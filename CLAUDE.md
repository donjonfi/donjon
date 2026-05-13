# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Donjon FI is a French interactive fiction (text adventure) engine built with Angular 19. It consists of a reusable Angular library (`donjon`) and two applications: an editor (`donjon-creer`) and a player (`donjon-jouer`). All work happens under `webapp/donjon/`.

## Commands

All commands must be run from `webapp/donjon/`:

```bash
cd webapp/donjon

# Install dependencies
npm install

# Development: build library in watch mode + serve editor
ng build donjon --watch          # terminal 1 — rebuild library on changes
ng serve donjon-creer            # terminal 2 — editor at localhost:4200
ng serve donjon-jouer            # terminal 2 — player at localhost:4201

# Build
ng build donjon                  # build library
ng build donjon-creer            # build editor app
ng build donjon-jouer            # build player app (default config)
ng build donjon-jouer --configuration=one   # single-game player build

# Single-file distribution (after building donjon-jouer --configuration=one)
npx gulp                         # inlines CSS/JS into a single HTML file → single-dist/

# Tests
npm run test                     # watch mode
npm run test:prod                # headless Chrome, no watch, with coverage
ng test donjon                   # run tests for the library only
```

## Architecture

```
webapp/donjon/projects/
├── donjon/          # Angular library (published to npm)
├── donjon-creer/    # Editor app (localhost:4200)
└── donjon-jouer/    # Player app (localhost:4201), configs: multi/one/development
```

The `donjon` library is the core and is imported by both apps via the TypeScript path alias `donjon` → `projects/donjon/src/public-api.ts`.

### Library internal structure (`projects/donjon/src/lib/`)

```
models/
├── commun/         # Shared enums/types (Genre, Nombre, Classes, etc.)
├── compilateur/    # Types for the compilation phase (AST, rules, actions)
├── jeu/            # Compiled game objects (Monde, Élément, Classe…)
└── jouer/          # Player runtime state

utils/
├── compilation/
│   └── analyseur/  # Parser/analyzer — converts raw Donjon DSL text into models
├── jeu/            # Game engine — executes actions, applies consequences
└── commun/         # Shared utilities

lecteur/            # LecteurComponent — the player UI (used by donjon-jouer)
interfaces/         # compilateur interfaces (Reaction, Regle)
```

### Data flow

1. Author writes a game in the Donjon DSL (a French-language custom syntax).
2. **Compilateur** (`utils/compilation/analyseur/`) parses the DSL into a `Monde` object.
3. **Jouer** (`utils/jeu/`) manages the live game state: resolves player commands, evaluates `Regle`/`Condition`/`Consequence` chains.
4. **LecteurComponent** renders the current game state in the browser.

### Key domain types

- `Monde` — the compiled game world (elements, classes, rules, actions)
- `Action` / `Réaction` / `Règle` — rule system triggered by player commands
- `Condition` / `Conséquence` — condition checks and side-effects within rules
- `Élément` / `Classe` / `Phrase` — base entity types in the game model

## DSL Reference

The Donjon FI DSL reference is split into thematic chunks under `dsl/`. Always load `dsl/dsl-00-index.md` first — it lists which file to load for each topic:

| Fichier | Contenu |
|---|---|
| `dsl/dsl-00-index.md` | Index + comportements automatiques du moteur |
| `dsl/dsl-01-monde.md` | Structure, Lieux, Objets, Portes/Obstacles |
| `dsl/dsl-02-elements.md` | États, Propriétés, Paramètres du jeu |
| `dsl/dsl-03-logique.md` | Synonymes, Actions personnalisées, Règles avant/après |
| `dsl/dsl-04-texte.md` | Instructions courantes, Balises dynamiques, Mise en forme |
| `dsl/dsl-05-avance.md` | Positions, Routines, Réactions (PNJ), Compteurs, Listes, Temps |
| `dsl/dsl-06-exemple.md` | Exemple complet minimal |

## Scripts (`scripts/`)

Scripts PowerShell utilitaires (build des apps Angular, build des extensions VS Code, bump de version, sync `actions.djn`). Deux conventions à respecter pour tout nouveau script :

### 1. Résolution robuste de la racine du repo

L'ancrage naïf `Split-Path -Parent $PSScriptRoot` casse si le dossier `scripts/` est copié hors repo (cas réel : raccourci utilisateur où `scripts/` vit dans le dossier parent du repo). Pattern à utiliser :

```powershell
$RepoMarker = "webapp/donjon"   # ou autre marker stable pour ce script
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot $RepoMarker))) {
    $candidate = Get-ChildItem -Path $RepoRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName $RepoMarker) } |
        Select-Object -First 1
    if ($candidate) { $RepoRoot = $candidate.FullName }
}
Set-Location (Join-Path $RepoRoot $RepoMarker)
```

Si le parent direct ne contient pas le marker, on cherche un sous-dossier qui le contient. Le script reste invocable depuis `<repo>/scripts/` ou depuis une copie hors repo.

### 2. Restauration du `cwd` initial

Les scripts modifient le `cwd` avec `Set-Location`. Restaurer en fin de script — succès **et** erreurs :

```powershell
$InitialLocation = Get-Location
# ... corps du script ...
# avant chaque exit :
Set-Location $InitialLocation
exit 1
# a la fin :
Set-Location $InitialLocation
```

Note : `exit N` ne déclenche pas `try { } finally { }` en PowerShell — d'où la restauration explicite avant chaque `exit`. Les exceptions non gérées peuvent encore laisser le `cwd` souillé mais c'est marginal sur ces scripts.

## CI

GitHub Actions (`.github/workflows/node.js.yml`) runs on push/PR to `master`: installs deps, builds `donjon` library, then runs `test:prod` (headless Chrome with coverage).
