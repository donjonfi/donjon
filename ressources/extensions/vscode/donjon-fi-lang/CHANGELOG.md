# Historique des versions

## [3.6.0] - 07/05/2026
Alignement de la version sur Donjon FI 3.5.0, support sémantique et navigation.

### Coloration syntaxique
- Nouveaux états : `éteint`, `cassé`, `actionné`, `arrêté`, `connu`, `visité` ; correction typo `ajdacent` → `adjacent`
- Nouveaux verbes : `ajouter`, `retirer`, `enlever`, `donner`, `prendre`, `augmenter`, `diminuer`, `lister`, `mémoriser`, `oublier`, `ouvrir`, `fermer`, `verrouiller`, `allumer`, `éteindre`
- Nouveaux types/classes : `ressource`, sous-types de listes (`listevide`, `listenombre`, `listetexte`, `listeintitulé`, `listemixte`), pluriels manquants (`directions`, `vivants`, `concepts`, `intitulés`, `éléments`, `ressources`)
- Tags dynamiques entre crochets : `[intitulé X]`, `[description X]`, `[aperçu X]`, `[statut X]`, `[sorties X]`, `[titre X]`, `[obstacle vers X]`, `[décrire objets dans/sur X]`, `[lister objets inventaire]`, préfixes `[p X]` `[c X]` `[s X]` `[v X]`, références `[@nom]` `[#nom]` `[&nom]`
- Formatage plus précis : `{n}`, `{N}`, `{p}`, `{x}`, `{e}`, `{i}`, `{U}`, `{*gras*}`, `{/italique/}`, `{_souligné_}`, `{+...+}`, `{-...-}`, `{=...=}`
- Pause clavier `@@attendre touche@@` et expressions temporelles `dans X secondes`, `dans X tours`, `après X tours`
- Scopes corrigés : propriétés (`intitulé`, `description`, `aperçu`, `titre`, …) en `support.type.property.donjon` au lieu de `entity.name.function` ; directions (`au sud`, `sur`, `dans`, …) en `keyword.other.direction.donjon`

### Coloration sémantique (analyse du document)
- Instances déclarées (`La pomme est un objet.`) mises en **gras** comme `variable` à chaque réutilisation, peu importe le déterminant
- Types et classes (`Un homme est un vivant.`, déterminants indéfinis) distingués et mis en **gras** comme `type`
- Détection de l'article élidé (`L'apicultrice`) et du suffixe de genre (`(f)`, `(m)`, `(n)`, `(p)`)
- Masquage des chaînes mono- et multi-lignes pour éviter les faux highlights dans les descriptions
- Mise en gras fournie via `configurationDefaults`, sans impact sur les autres langues ; mapping `semanticTokenScopes` vers `entity.name.variable.donjon` / `entity.name.type.donjon` en fallback

### Navigation
- **Plan / Outline** (Ctrl+Shift+O) : lieux, objets, personnes, types, routines et actions, avec leur type parent en sous-titre. Symboles distincts : `Class` pour les types, `Module` pour les lieux, `Function` pour routines/actions, `Array` pour les listes, `Number` pour les compteurs, `String` pour les intitulés, `Field` pour les ressources, `Object` pour les objets/personnes/portes/obstacles
- **Aller à la définition** (F12 / Ctrl+clic) : saute à la déclaration depuis n'importe quelle réutilisation
- **Survol** : nom, type parent (instance ou sous-type), ligne de déclaration
- **Routines** : déclarations `routine X:` reconnues, références `exécuter [la] routine X` cliquables
- **Actions** : déclarations `action X [ceci [<prép> cela]]:` reconnues, références `exécuter [l']action X [ceci [<prép> cela]]` cliquables avec match exact par arité (et fallback sur le verbe seul)

### Diagnostic et architecture
- Cache d'analyse versionné par `document.version` : un seul scan par changement, partagé entre tous les providers
- Output channel « Donjon » avec logs d'activation et de scan
- Suite de tests unitaires (`npm test`, 35 tests, sans dépendance ajoutée)

## [3.0] - 16/11/2024
- Coloration syntaxique pour Donjon FI 3.0

## [2.0 beta 18] - 30/08/2024
- Coloration syntaxique pour Donjon FI 2.0 (beta 18)

## [2.0 beta 1] - 28/08/2022
- Coloration syntaxique pour Donjon FI 2.0 (beta 1)

## [0.6.0] - 18/02/2022
### Améliorations

- Coloration syntaxique

## [0.5.0] - 11/12/2021
### Ajouts

- Coloration syntaxique
- Indentation automatique des règles et des conditions
- Plier/déplier les parties indentées

----------------------

All notable changes to the "donjon-fi-lang" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.
