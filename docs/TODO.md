# TODO moteur — bugs & idées de fonctionnalités

> Liste constituée pendant le chantier de documentation du wiki (rédaction + tests des
> exemples). Lignes `fichier:ligne` indicatives. Voir aussi `wiki-reference-audit.md`.

## Bugs

- [ ] **`si une sortie / porte / obstacle existe vers <direction>` ne s'évalue plus correctement.**
  `si une sortie existe vers le nord` devrait être vrai s'il existe un lieu voisin au nord, mais le
  moteur ne le résout pas (il cherche un élément nommé « nord » → condition fausse). Confirmé bug
  (devait fonctionner). Piste : `webapp/donjon/projects/donjon/src/lib/utils/jeu/conditions-utils.ts`
  ~230-262 (branche `(sortie|obstacle|porte) vers`, résolution via épithète / `trouverLocalisation`).
  Découvert en LOT 1 (page `controle/si/verbes/exister`) — non documenté tant que non corrigé.

- [ ] **Balise `[intitulé le <nom>]` (article défini masculin) → « problème balise ».**
  `[intitulé coffre]` (sans article) et `[intitulé la pomme]` fonctionnent ; `[intitulé le coffre]`
  renvoie `{+@problème balise@+}`. Le « le » est vraisemblablement confondu avec la balise `[le X]`.
  Contournement auteur : `[intitulé <nom>]` sans article (la balise ajoute elle-même le déterminant).

- [ ] *(mineur)* **Condition `si l'intitulé de <X> vaut "…"` → erreur (`Cannot read properties of null`).**
  L'intitulé comme sujet de condition n'est pas géré. Contournement : afficher `[intitulé <nom>]`.

## Idées de fonctionnalités

- [ ] **`déplacer le joueur vers <direction>`** (nord/sud/est/ouest/haut/bas) — faire avancer le joueur
  d'un cran dans une direction donnée. Aujourd'hui il faut nommer le lieu de destination
  (`déplacer le joueur dans <lieu>` ou `… vers <lieu>`). Confirmé non encore supporté.

## Corrigé

- [x] **`si un tirage … réussit` était inversé** (coquille regex `/résussi/` → `/réussi/`),
  `analyseur.condition.ts:361` — corrigé le 2026-06-05 (commit `91562107`) + garde
  `condition-tirage-reussir.spec.ts`. `réussit` ET `échoue` fonctionnent désormais.
