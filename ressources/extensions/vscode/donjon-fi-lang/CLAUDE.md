# CLAUDE.md — Extension `donjon-fi-language`

## Vue d'ensemble

Extension VS Code qui apporte le support du langage Donjon FI (`.djn`) : coloration syntaxique (TextMate), snippets, **semantic tokens**, **document symbols**, **definition / hover / document links**. Pas de webview, pas de moteur — pur côté éditeur, sans dépendance runtime sur le moteur Donjon.

Elle est listée comme `extensionPack` dans `donjon-fi-compagnon`, donc installée automatiquement avec lui.

## Build

```powershell
cd ressources/extensions/vscode/donjon-fi-lang
npm install
npm run compile           # tsc -> out/
npm run watch             # tsc -w
npm test                  # node --test out/declarationScanner.test.js
```

Le packaging `.vsix` (`vsce package`) est manuel ; pas de script repo dédié.

## Architecture

```
src/
├── extension.ts                # activate() : enregistre providers + watcher workspace
├── workspaceIndex.ts           # index workspace-wide des décls (Map<uri, FileEntry>) + globalDeclVersion
├── analysis.ts                 # cache par URI ; clé = (document.version, globalDeclVersion)
├── declarationScanner.ts       # cœur du scan : regex sur texte « nettoyé » (commentaires/strings blanchis)
├── declarationScanner.test.ts  # tests Node sur la lib pure
├── definitionProvider.ts       # provideDefinition cross-file → Location[] (peek si plusieurs)
├── hoverProvider.ts            # provideHover cross-file (mentionne fichier source si externe)
├── documentLinkProvider.ts     # rend cliquables `inclure "X.djn"` (résolu relativement au .djn courant)
├── renameProvider.ts           # F2 / Renommer ; rename cross-workspace (var, type, routine ; pas action)
├── symbolProvider.ts           # outline / breadcrumb / Ctrl+T (reste single-file — outline du doc courant)
└── semanticTokensProvider.ts   # surligne variables/types détectés (legend exporté), workspace-aware
```

### Modèle de données (`declarationScanner.ts`)

`Declaration` = un objet déclaré dans le DSL. Quatre `kind` :
- `variable` — instance (`Le X est un Y` / `La X est une Y` / `L'X est…` **ou** `Nom est un Y` pour les noms propres : amorce sans article, majuscule initiale requise)
- `type` — sous-type (`Un X est un Y` / `Une X est une Y` / `Des X sont…`)
- `routine` — `routine <ident>:`
- `action` — `action <signature>:` (la signature complète sert de `name` — voir `normalizeSignature`)

Pour les noms propres, on dispose de **deux** regex distinctes : `INSTANCE_DECLARATION` (article défini, flag `i`) et `PROPER_NOUN_INSTANCE_DECLARATION` (pas d'article, pas de flag `i`, début par `\p{Lu}`). Cette dernière n'utilise pas `i` parce que `\p{Lu}` y matcherait aussi les minuscules — ce qui défait la contrainte « majuscule initiale ». Le double-comptage entre les deux regex est évité par un lookahead négatif `(?!(?:Le|La|Les|Un|Une|Des|Deux)\s|L['’])` côté nom propre.

`Occurrence` = mention référençant une déclaration. Trois familles :
- variables/types : matchés par regex sur le mot lui-même (frontière unicode `(?<![\\p{L}\\p{M}])…(?![\\p{L}\\p{M}])`)
- routines : `exécuter [la] routine <ident>`
- actions : `exécuter [l']action <signature>` jusqu'à `.`/`,`/`;`/`\n`

`blankCommentsAndStrings(text)` remplace `--…\n` et `"…"` par des espaces (en préservant les sauts de ligne pour ne pas décaler les offsets).

### Index workspace (`workspaceIndex.ts`)

Module à état global (singletons module-level) :

- `Map<uriString, FileEntry>` — `FileEntry = { uri, version, declarations[] }` ; `version = -1` si chargé depuis le disque (fichier non ouvert dans VS Code), sinon `document.version`.
- `globalDeclVersion: number` — bumpé à chaque changement de l'ensemble des déclarations (création, suppression, édit qui change les décls).

Cycle de vie :

1. `activateWatcher(context)` — enregistre `FileSystemWatcher('**/*.djn')` (create/change/delete), `onDidChangeTextDocument`, `onDidOpenTextDocument`.
2. `ensureScanned()` — async, idempotent : `findFiles('**/*.djn')` puis lit chaque fichier via `vscode.workspace.fs.readFile`. Override avec le contenu non sauvegardé pour les documents ouverts. Appelé par les providers en début de méthode (`await ensureScanned()`).
3. Édit dans un `.djn` ouvert → `updateFromDocument(doc)` (texte courant, version VS Code).
4. Sauvegarde externe d'un fichier non ouvert → `onDidChange` du watcher → `scanFromDisk(uri)`.
5. `setEntry` ne bumpe `globalDeclVersion` que si `sameDeclarations(prev, next)` est faux — évite les invalidations inutiles.

API : `getDeclarationsForName(kind, name) → DeclarationLocation[]`, `getAllDeclarations() → Declaration[]`, `getGlobalDeclVersion()`.

### Cache d'analyse (`analysis.ts`)

`getAnalysis(document)` → `{ version, globalVersion, declarations, declarationsByName, occurrences }`. Cache invalidé si **soit** `document.version` change **soit** `globalDeclVersion` a bougé (autre fichier modifié = re-derive les occurrences). Vidé sur `onDidCloseTextDocument`.

- `declarations` / `declarationsByName` : **locales au document** (pour `symbolProvider` outline et hover-detail local).
- `occurrences` : calculées contre `getAllDeclarations()` (workspace), donc une référence à un objet défini ailleurs sera détectée.

`declarationsByName` est keyé par `${kind}:${name}`. Une `variable` écrase un `type` homonyme.

`findOccurrenceAt(analysis, offset)` : recherche linéaire ordonnée, exit anticipé dès qu'on dépasse l'offset.

### Lookup cross-file dans les providers

- `definitionProvider` : `getDeclarationsForName(occ.kind, occ.name)` → `Location[]` (VS Code affiche un peek si plusieurs). Les positions du fichier cible sont calculées via `vscode.workspace.openTextDocument(uri).positionAt(offset)` — VS Code met en cache le `TextDocument`.
- `hoverProvider` : choisit la décl locale si elle existe (cas le plus fréquent), sinon la première du workspace ; ajoute `*+N autres déclarations dans le workspace.*` si pluralité.
- `semanticTokensProvider` : utilise `analysis.occurrences` qui est déjà workspace-aware → un objet déclaré dans `part2.djn` est surligné dans `part1.djn` sans changement supplémentaire.
- `renameProvider` : F2 / clic-droit → Renommer. `prepareRename` retourne le `range` + `placeholder = displayName`. `provideRenameEdits` itère `getAllFileUris()`, ouvre chaque fichier (`openTextDocument` — caché par VS Code), lit ses occurrences depuis `analysis.occurrences` et remplace celles qui matchent `(target.kind, target.name)`. **Cas particulier routines** : le span du nom dans `routine X:` n'est pas dans les occurrences (le scanner ne le détecte que via `exécuter routine X`), donc on parcourt aussi `analysis.declarations` pour ajouter ces ranges. **Variables/types** : leurs spans de déclaration SONT dans les occurrences (la regex de référence matche le nom partout dans le texte nettoyé). **Actions exclues** : la « name » d'une action est sa signature complète, le rename d'une signature est plus une refonte qu'un renommage. Validation du nouveau nom : `[\p{L}_][\p{L}\p{M}\p{N}_-]*` pour les routines (ident sans espace), `[\p{L}][\p{L}\p{M}\p{N}\-'’ ]*` pour var/type. **Limites connues** : ne corrige pas l'article (`Le`/`La`/`L'`/`Un`/`Une`) si le genre/nombre du nouveau nom diffère ; ne renomme pas dans les commentaires ni dans les chaînes (volontaire — le scanner les blanchit).

## Pièges connus

- **Indices `d` regex** : tous les patterns utilisent le flag `d` pour récupérer `m.indices` — le code y dépend (`indices[1]`). Si tu modifies une regex, garde le flag.
- **Apostrophe** : `L'…` accepte U+0027 et U+2019 (cf. classes `[''’]`). Quand tu rajoutes du regex texte-DSL, utilise les deux.
- **Articles indéfinis pour types** : `Un|Une|Des|Deux` (pluriel inclus). Au pluriel le verbe est « sont ».
- **Action vs routine** : la `name` d'une action est la **signature normalisée complète** (lowercase, espaces collapse). Une action ≠ routine côté lookup ; elles partagent juste le scanner.
- **Limite des actions** : le scan repère uniquement `exécuter l'action <sig>` ; il y a un fallback verbe-seul si la signature ne matche pas (utile quand l'auteur écrit du texte non normalisé).
- **Rien ne sort du document courant** — pour étendre à `inclure`, il faut un index workspace (cf. `donjon-fi-compagnon/src/concat-resolver.ts` qui résout déjà la chaîne d'`inclure` avec line-map).

## Limites actuelles & extensions naturelles

- **Pas de `provideReferences`**. Les occurrences sont calculées mais pas exposées comme « Find All References » (l'utilisateur passe par le rename ou le hover).
- **Pas de `WorkspaceSymbolProvider`** — l'index workspace existe, ce serait facile à brancher (`Ctrl+T` cross-file).
- **Pas de diagnostics** — c'est le compagnon qui pose les `vscode.Diagnostic` (via webview → host).
- **Pas de tests** sur l'index workspace : le scanner pur est testé (`declarationScanner.test.ts`) mais le `workspaceIndex` touche `vscode.workspace` et nécessiterait un harnais d'intégration.
- **Path semantics divergence** : `documentLinkProvider` résout `inclure` **doc-relatif** ; le moteur (via `concat-resolver` du compagnon) résout **root-relatif**. Pré-existant, non adressé.

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/extension.ts` | `activate` : output channel, enregistrement des 5 providers, watcher workspace, vidage cache à la fermeture |
| `src/workspaceIndex.ts` | Index global des décls par fichier ; `ensureScanned`, `getDeclarationsForName`, `globalDeclVersion` |
| `src/analysis.ts` | Cache `(version, globalVersion)` ; helpers `findOccurrenceAt`, `declarationForOccurrence` |
| `src/declarationScanner.ts` | Regex DSL ; `findDeclarations`, `findOccurrences` ; types `Declaration`/`Occurrence` |
| `src/definitionProvider.ts` | `provideDefinition` cross-file → `Location[]` (peek si plusieurs) |
| `src/hoverProvider.ts` | `provideHover` cross-file ; mentionne fichier source si externe |
| `src/documentLinkProvider.ts` | Cliquable sur `inclure "X.djn"` ; résolu via `path.resolve(docDir, fichier)` |
| `src/renameProvider.ts` | F2 / Renommer ; cross-workspace (var/type/routine, pas action) |
| `src/symbolProvider.ts` | DocumentSymbol pour outline du document courant (volontairement single-file) |
| `src/semanticTokensProvider.ts` | Tokens `variable`/`type` workspace-aware ; `legend` exporté ; `attachOutput` pour debug |
| `package.json` | `contributes.languages/grammars/snippets/semanticTokenScopes` ; pas de `commands` |
| `syntaxes/donjon.tmLanguage.json` | Coloration TextMate (statique) |
| `snippets/donjon.json` | Snippets DSL |

## Ressources externes

- DSL : `dsl/dsl-00-index.md` à la racine du repo
- Site : <https://donjon.fi>
- Doc DSL : <https://donjon.fi/doc/v3/start>
