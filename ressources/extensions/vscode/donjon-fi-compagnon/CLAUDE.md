# CLAUDE.md — Extension `donjon-fi-compagnon`

## Vue d'ensemble

Extension VS Code qui ouvre un panneau compagnon pour les fichiers `.djn` (Donjon FI). Le panneau est une **webview** dans laquelle s'exécute une app Angular (le projet `donjon-compagnon`) qui compile le scénario et expose les onglets **Analyse**, **Jeu**, **Visualisation**, **Aperçu**.

Cette extension est **toujours utilisée en binôme** avec l'app Angular `donjon-compagnon`. Pas de mode autonome — il n'y a pas de `if (extension) … else (standalone)` à maintenir.

## Architecture en deux moitiés

```
┌───────────────────────────────────────────────────────────────┐
│  EXTENSION (Node, ce dossier)                                 │
│  src/extension.ts        Webview, commandes, diagnostics      │
│  src/concat-resolver.ts  Résout `inclure` → blob + line-map   │
│  src/protocol.ts         Types des messages host ↔ webview    │
│  media/compagnon-app/    Bundle Angular (généré, non versionné│
│                          jusqu'au sync)                       │
└──────────────────────────┬────────────────────────────────────┘
                           │ postMessage / window.__djn*__
┌──────────────────────────┴────────────────────────────────────┐
│  WEBVIEW Angular  (webapp/donjon/projects/donjon-compagnon/)  │
│  src/app/app.component.*       Onglets, bouton Analyser       │
│  src/app/services/             compilation + bridge VS Code   │
│  src/styles.scss               Bootstrap + Font Awesome       │
└───────────────────────────────────────────────────────────────┘
```

L'app Angular est un projet à part : `webapp/donjon/projects/donjon-compagnon/`. Elle est buildée séparément, copiée dans `media/compagnon-app/`, puis chargée dans la webview avec une réécriture des chemins via `webview.asWebviewUri`.

## Build (un seul script)

À la racine du repo :

```powershell
.\scripts\build-extension-compagnon.ps1
```

Étapes :

1. `ng build donjon-compagnon --configuration=bundle` (depuis `webapp/donjon/`)
2. `node ../../scripts/sync-compagnon.js` — copie `dist/donjon-compagnon-bundle/browser/` vers `media/compagnon-app/`
3. **Sync `actions.djn` par défaut** : `Copy-Item ressources/scenarios/actions.djn → media/actions.djn` (utilisé comme fallback à l'exécution)
4. `npm run compile` (côté extension) — TypeScript → `out/`
5. `vsce package --no-dependencies` → `.vsix` dans ce dossier

Les étapes 1–3 suffisent pour itérer sur l'UI Angular ; les étapes 4–5 ne sont nécessaires qu'avant de produire un `.vsix` pour distribution.

## Protocole webview ↔ host

Défini dans `src/protocol.ts`. **Toute modification doit être miroir des deux côtés** (l'extension et `webapp/donjon/projects/donjon-compagnon/src/app/services/vscode-bridge.service.ts`).

- **Host → Webview** (via injection `window.__djn*__` à la construction du HTML, pas via postMessage) :
  - `__djnScenario__` : blob concaténé des `inclure`
  - `__djnActions__` : contenu de `actions.djn`
  - `__djnInit__` : payload `MsgInit` (rootScenarioPath, assetsBaseUri…)
  - `__djnLineMap__` : `LineMapEntry[]` pour traduire `ligneFinale` → `{ nomFichier, ligneOrigine }`
- **Webview → Host** (`postMessage` via `acquireVsCodeApi`) :
  - `READY` — webview chargée
  - `COMPILATION_RESULT` — messages d'analyse (le host les traduit puis publie en `vscode.Diagnostic`)
  - `OPEN_FILE` — demande d'ouverture (chemin relatif au root scenario + ligne) ; le host appelle `ouvrirFichier`
  - `RUN_GAME` — recompilation à la demande (clic sur ▶ Analyser) ; le host appelle `rafraichir(context)` qui rebuild le HTML

## Recompilation : à la demande, jamais sur sauvegarde

La sauvegarde du `.djn` ne déclenche **rien**. La recompilation est manuelle :

- Bouton ▶ (icône `$(play)`) dans la barre de titre de l'éditeur VS Code → commande `donjon.runGame`
- Bouton « Analyser » (baguette magique `fa-wand-magic-sparkles`, `btn btn-warning`) dans la barre d'onglets de la webview → message `RUN_GAME` au host
- Palette : « Tester le jeu Donjon FI » (`donjon.runGame`) ou « Ouvrir le compagnon Donjon FI » (`donjon.openCompagnon`)

Les deux commandes sont aujourd'hui équivalentes : elles appellent `openCompagnon` qui reconstruit le HTML, ce qui force Angular à rebooter et à relire `__djnScenario__` depuis le disque.

## Résolution des `inclure` et line-map

`concat-resolver.ts` parse les directives `inclure "X.djn"` récursivement, produit :

- `contenu` — un seul blob qu'on injecte dans la webview
- `lineMap[]` — pour chaque ligne du blob : `{ ligneFinale, ligneOrigine, nomFichier }`
- `fichiersInclus[]` — chemins absolus, pour suivre les fichiers dépendants
- `erreurs[]` — cycles, profondeur max, fichier manquant

**Le moteur Donjon compile le blob**, donc il renvoie des numéros de ligne *du blob*. Le line-map est utilisé deux fois :

1. Côté host, dans `publierDiagnostics` → traduit avant de poser le `vscode.Diagnostic` sur le bon fichier.
2. Côté webview (onglet Analyse) → traduit avant d'afficher le badge cliquable. Sans cette traduction, l'utilisateur voit la ligne du blob (ex. 246) au lieu de la ligne du fichier source (ex. 2).

Si tu touches au format du line-map, **mets à jour les deux côtés** (`concat-resolver.ts` et `vscode-bridge.service.ts` qui exporte `LineMapEntry`).

## Webview : pièges connus

- **Polices Font Awesome** : importées via SCSS dans `donjon-compagnon/src/styles.scss` (mêmes chemins que `donjon-creer`). Le builder Angular les place dans `media/` à côté du CSS, et `localResourceRoots` inclut `media/` de l'extension → les `url()` relatifs des `@font-face` se résolvent. Si une icône ne s'affiche pas après build, vérifier d'abord que le `.woff2` est bien dans `media/compagnon-app/media/`.
- **Réécriture des URLs** : seule la regex sur `src=` / `href=` du HTML est appliquée par `construireHtml`. Les `url(...)` dans le CSS bundlé fonctionnent grâce à la résolution relative — ils ne passent pas par cette regex.
- **Scrollbars** : VS Code injecte par défaut des scrollbars sombres (thème de l'éditeur), illisibles sur le fond blanc du compagnon. Forcées dans `styles.scss` avec `scrollbar-color` + `::-webkit-scrollbar*`, basées sur `$primary` de la palette Donjon.
- **`retainContextWhenHidden: true`** est déjà set, donc l'état Angular survit quand l'utilisateur change d'onglet VS Code. Mais `RUN_GAME` reconstruit le HTML → l'état Angular est perdu à chaque clic Analyser (volontaire : on veut un jeu frais).

## Onglets Angular et tab par défaut

Ordre fixé : **Analyse · Jeu · Visualisation · Aperçu**. Après chaque `lancerCompilation()`, l'onglet actif est posé à `'analyse'` si `nbErreurs > 0`, sinon `'jeu'`. Logique dans `app.component.ts` (`AppComponent.lancerCompilation`).

## Versionnement

La version de l'extension dans `package.json` suit la version du moteur Donjon FI (cf. `memory/project_version_bump.md` à la racine du repo : 6 fichiers à mettre à jour pour un bump moteur, ce qui inclut `package.json` de cette extension).

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/extension.ts` | `activate`, commandes `donjon.openCompagnon` / `donjon.runGame`, gestion du `WebviewPanel`, publication des `Diagnostic` |
| `src/concat-resolver.ts` | Résolution des `inclure`, line-map, détection des cycles |
| `src/protocol.ts` | Types partagés des messages (à synchroniser avec `vscode-bridge.service.ts` côté Angular) |
| `package.json` | Manifest VS Code : commandes, menus `editor/title`, keybindings, configuration `donjon.actionsFile` |
| `media/compagnon-app/` | **Généré** — bundle Angular synchronisé par `sync-compagnon.js` |

## Ressources externes

- Site : <https://donjon.fi>
- Doc DSL : <https://donjon.fi/doc/v3/start>
- Tester en ligne (équivalent web du compagnon) : <https://donjon.fi/creer/>
