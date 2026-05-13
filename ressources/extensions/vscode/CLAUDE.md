# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Portée de ce dossier

Ce dossier regroupe les **extensions VS Code** de Donjon FI. Chaque sous-dossier est une extension distincte avec son propre `package.json` et son propre cycle `tsc` + `vsce package`.

| Dossier | Identifiant Marketplace | Rôle |
|---|---|---|
| `donjon-fi-lang/` | `donjon-fi.donjon-fi-language` | Support langage `.djn` : grammaire TextMate, snippets, semantic tokens, providers (definition / hover / rename / symbols / document links). Pur côté éditeur — aucune dépendance runtime sur le moteur Donjon. |
| `donjon-fi-compagnon/` | `donjon-fi.donjon-fi-compagnon` | Webview qui embarque l'app Angular `donjon-compagnon` (depuis `webapp/donjon/projects/donjon-compagnon/`) pour analyser, tester, visualiser un scénario. Dépend de `donjon-fi-lang` via `extensionPack`. |
| `donjon-fi-runner/` | `donjon-fi.donjon-fi-runner` | **DÉPRÉCIÉE** — coquille vide qui ne fait que dépendre du compagnon via `extensionPack`. Ne pas y ajouter de code. |

Les trois partagent la même `version` (alignée sur la version moteur, cf. `feedback_donjon_version_bump`). Le numéro est aussi présent dans les `constantes.ts` du moteur et dans `actions.djn` — `bump-version.ps1` à la racine `scripts/` met tout à jour.

## Build

**Tous les scripts de build sont à `<repo>/scripts/`**, jamais ici. Ils ancrent eux-mêmes leur `cwd` ; on peut les invoquer depuis n'importe où.

```powershell
# Depuis n'importe quel cwd
.\scripts\build-extension-lang.ps1        # tsc + vsce package → donjon-fi-lang/*.vsix
.\scripts\build-extension-compagnon.ps1   # ng build (Angular) + sync media/ + tsc + vsce package → donjon-fi-compagnon/*.vsix
.\scripts\build-all.ps1                   # build complet (apps Angular + extensions + site) — non versionné, à vérifier avant usage
```

Pour un cycle rapide sur une extension donnée :

```powershell
cd ressources/extensions/vscode/<donjon-fi-lang|donjon-fi-compagnon>
npm install        # une fois
npm run compile    # tsc -p ./
npm run watch      # tsc -w
```

Le compagnon est plus impliqué : son `media/compagnon-app/` est le **bundle Angular** d'un projet séparé (`webapp/donjon/projects/donjon-compagnon/`), copié par `scripts/sync-compagnon.js`. Pour itérer sur l'UI il faut `ng build donjon-compagnon --configuration=bundle` puis `node scripts/sync-compagnon.js` — c'est ce que fait `build-extension-compagnon.ps1`.

### Tests

Seul `donjon-fi-lang` a des tests (`node --test out/declarationScanner.test.js`) :

```powershell
cd ressources/extensions/vscode/donjon-fi-lang
npm test           # compile + lance le scanner
```

Pour cibler un seul fichier de test, compiler puis appeler `node --test out/<fichier>.test.js` directement (cf. `feedback_tests_run` — toujours cibler le fichier édité, pas la suite entière).

## Sync `actions.djn`

`actions.djn` est canonique à `<repo>/ressources/scenarios/actions.djn`. Il est répliqué dans 5 destinations :

- `webapp/donjon/projects/donjon-creer/src/assets/modeles/actions.djn`
- `webapp/donjon/projects/donjon-jouer/src/assets/modeles/actions.djn`
- `webapp/donjon/projects/donjon/src/lib/tests/scenario_actions.ts` (inline TS template literal)
- `ressources/extensions/vscode/donjon-fi-compagnon/media/actions.djn` (fallback à l'exécution si aucun `actions.djn` n'est trouvé près du `.djn` édité)

Lancer **`scripts/sync-actions.ps1`** après toute modification du fichier source (cf. `feedback_sync_actions`). Le 4ᵉ chemin (compagnon) est mis à jour par `build-extension-compagnon.ps1` étape 3, pas par `sync-actions.ps1`.

## Cibler la bonne extension

Avant d'éditer, vérifier dans quelle extension le code vit :

- **Coloration / snippets / autocomplétion / outline / F12** → `donjon-fi-lang/`
- **Webview / panneau Compagnon / diagnostics dans le panneau Problèmes / commande Ctrl+F5 « Tester le jeu »** → `donjon-fi-compagnon/`
- **App Angular qui s'affiche dans le panneau Compagnon** → pas ici, c'est `webapp/donjon/projects/donjon-compagnon/` (le compagnon embarque son bundle copié par `sync-compagnon.js`)

## Architecture détaillée par extension

Chaque extension a son propre `CLAUDE.md` à jour :

- [`donjon-fi-lang/CLAUDE.md`](./donjon-fi-lang/CLAUDE.md) — index workspace, modèle `Declaration`/`Occurrence`, providers, pièges regex (flag `d`, apostrophes U+0027/U+2019).
- [`donjon-fi-compagnon/CLAUDE.md`](./donjon-fi-compagnon/CLAUDE.md) — protocole host↔webview (`window.__djn*__` à l'init, `postMessage` ensuite), résolution `inclure` + line-map, contrats à miroirer côté Angular.

Toujours lire le CLAUDE.md de l'extension concernée avant un changement non trivial — ils documentent les invariants subtils que `package.json` et le code ne rendent pas visibles.

## Repo global

Pour le moteur, la grammaire DSL et la structure Angular, voir le CLAUDE.md à la racine du repo (`<repo>/CLAUDE.md`) et l'index DSL `<repo>/dsl/dsl-00-index.md`.
