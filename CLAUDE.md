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

## Replay : sauvegardes (.sol) et magnétoscope (.tst)

Le lecteur supporte deux modes de re-exécution déterministe d'une partie :

- **`.sol`** (sauvegarde) — restaure un état de partie : commandes (`c`), réponses (`r`), graines (`g`), déclenchements de routines (`d`). Rejoué automatiquement à l'ouverture, ou en mode `triche` / `triche auto`.
- **`.tst`** (vérification / magnéto) — rejoue une partie pas-à-pas en comparant chaque sortie à la sortie attendue stockée dans le fichier. UI dédiée (boutons Pas suivant, Lire auto, Précédent, etc.) avec gestion des divergences. Modèle : `FichierTest` (`models/jouer/fichier-test.ts`).

### Le `'d'` est une étape steppable au même titre que c/r

En mode magnéto live, le curseur s'arrête sur chaque `'c'`, `'r'` ET `'d'` (routines forcées). Chaque type a sa propre `sortie` attendue dans le `.tst` et sa propre comparaison de divergence — la sortie d'une commande est séparée de celle de la routine qui la suit. En intro (`sauterGrainInitiale=true` dans `avancerJusquAEtapeJouable`), les `'d'` sont au contraire forcés silencieusement (la `sortieIntro` globale couvre la comparaison).

`enregistrerSortieEtapeCourante` remplit les slots `c`, `r` ET `d` (pas seulement c/r) pour qu'une routine déclenchée pendant un enregistrement capture sa sortie dans le `.tst` généré.

UI sur divergence `'d'` : titre « Divergence sur la sortie de la **routine** » ; boutons Modifier/Insérer désactivés (non applicables à une routine forcée) ; Supprimer reste actif (retirer la routine du `.tst`).

### Routines programmées (`exécuter la routine X dans N secondes.`)

Les routines programmées via chrono temps réel (`programmationsTemps` + `verifierChrono` toutes les secondes) doivent être **désactivées pendant tout replay**, sinon elles s'exécutent deux fois : une fois via le chrono temps réel, une fois via l'étape `'d'` forcée du fichier.

Mécanisme commun : le flag `instructions.restaurationPartieEnCours` empêche le `push` dans `programmationsTemps` dans `instruction-executer.ts` (≈ ligne 275). Les étapes `'d'` forcent les routines via `tamponRoutinesEnAttente.push(...)` + `traiterProchaineRoutine()`.

- **`.sol`** : flag posé pendant le bloc `forEach` de restauration dans `lecteur.component.ts` (≈ 1160) et remis à `false` en fin de bloc (≈ 1209).
- **`.tst`** : flag posé tant que `verificationActive` est `true` — `initialiserMagneto` + `recapReculer` (entrée), `magnetoQuitter` + `afficherRecap` (sortie). Plus, à l'entrée du magnéto, on vide `programmationsTemps` et `tamponRoutinesEnAttente` pour évacuer les routines pendantes du jeu en cours (cas « magnéto sans RAZ » via `magnetoConfirmerRazNon`).

Cas particulier : un `annuler` dans le magnéto déclenche un reload (parent recompile → `ngOnChanges` → `initialiserJeu` → **nouvelle** `ContextePartie` avec `partie.ins.restaurationPartieEnCours = false` par défaut). Il faut donc re-poser le flag dans `initialiserJeu` quand `verificationActive` est `true`, sinon le replay auto-triche post-annuler ré-injecte des `ProgrammationTemps` que `verifierChrono` finit par déclencher (sortie de routine fantôme en fin d'écran, accumulée à chaque round-trip).

Si tu touches au cycle de vie d'un mode de replay : mirror toutes les transitions on/off du flag (et le vidage des tampons côté `.tst`).

### Précédent (magnéto) : trim avant `annuler`

Le moteur `annuler N tour(s)` (`commandes-utils.ts: enleverToursDeJeux`) **préserve volontairement** les `'d'` (déclenchements) en fin de sauvegarde (pile temporaire pop/re-push) pour ne pas ré-exécuter une routine déjà déclenchée en jeu normal. En magnéto c'est l'inverse : si on ne retire pas ces `'d'` AVANT `annuler`, ils restent dans la sauvegarde émise au parent, et le replay auto-triche les re-force → sortie de routine ré-attachée à la commande précédente.

Fix : `ContextePartie.enleverDeclenchementsTrailing()` appelé dans les deux branches de `magnetoPrecedent` (divergence + non-divergence). La méthode pop **tout ce qui n'est ni `'c'` ni `'r'`** en fin de pile — pas seulement les `'d'`. À la fin du replay auto-triche, `nouvelleGraineAleatoire()` pousse un `'g:...'` qui masque les `'d'` ; sans traverser les `'g'`, le trim raterait les `'d'` cachés derrière.

### Précédent depuis une divergence sur `'d'`

`annuler` enlève une **tour** entière (commande + routine forcée associée). Quand la divergence est sur un `'d'`, ça recule donc aussi la c/r qui le précédait — la routine seule ne peut pas être annulée. Sans correctif, le curseur restait sur le `'d'` mais l'état de jeu était à « avant la c/r » → désalignement, et `magnetoIdxCommande` (= dernière étape exécutée) retombait sur la c/r encore antérieure, donnant une mini-liste centrée trop en arrière.

Fix dans la branche divergence de `magnetoPrecedent` : si l'étape divergente est un `'d'`, on cible `magnetoIdx = idx de la c/r précédente`, puis on planifie un `magnetoPasSuivant()` programmatique dans le `setTimeout(250)` post-reload pour re-jouer cette c/r — résultat : état = « post-c/r, avant routine », curseur sur le `'d'`, c/r affichée comme courant.

## Testing

Library tests live in `webapp/donjon/projects/donjon/src/lib/tests/`. Naming convention : `[F0XX-TNNN]` IDs (F = feature group, T = sequence within the group). Run a single spec file with `ng test donjon --include="**/<file>.spec.ts" --watch=false --browsers=ChromeHeadless` — beaucoup plus rapide que la suite complète.

Integration tests use `TestUtils.genererEtCommencerLeJeu(scenario)` (`utils/test-utils.ts`) to compile a Donjon DSL scenario and start a game, then drive it via `ctx.com.executerCommande(...)` and assert on `sortie`, `ctx.jeu.tamponErreurs`, `ctx.jeu.tamponConseils`. Scenario strings use backticks (template literals), pas la concaténation.

`tamponConseils` n'apparaît dans le lecteur qu'en mode `[debogueur]="true"` (actif dans `donjon-creer` et `donjon-compagnon`, pas dans `donjon-jouer`). `eju.ajouterConseil(...)` est le canal pour les avertissements visibles uniquement au créateur.

## CI

GitHub Actions (`.github/workflows/node.js.yml`) runs on push/PR to `master`: installs deps, builds `donjon` library, then runs `test:prod` (headless Chrome with coverage).
