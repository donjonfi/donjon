# TODO moteur — bugs & idées de fonctionnalités

> Liste constituée pendant le chantier de documentation du wiki (rédaction + tests des
> exemples). Lignes `fichier:ligne` indicatives. Voir aussi `wiki-reference-audit.md`.

## Bugs

- [ ] **`exécuter réaction de ceci` : article et `concernant` cassent la résolution** (LOT 8, 2026-06-09).
  Forme qui marche : `exécuter réaction de <vivant>` (sans article) → déclenche la réaction //basique//.
  Deux anomalies : (1) `exécuter **la** réaction de ceci` (avec article) ne déclenche RIEN (sortie vide,
  aucune erreur de compil) ; (2) `exécuter réaction de ceci **concernant** <sujet>` ignore le sujet et
  retombe sur la réaction basique au lieu de la réaction `concernant <sujet>`. Les actions de base
  (`demander`/`interroger`/`montrer`) y arrivent pourtant via `exécuter réaction de … concernant …`
  (`actions.djn`) — donc la résolution du sujet existe mais n'est pas atteinte depuis une action auteur.
  Doc rédigée prudemment (forme sans article + basique uniquement, `routines/reaction/start`). Garde :
  `actions-exemples-wiki.spec.ts` F070-T011. Piste : dispatch `exécuter (la) réaction de …` dans
  `instructions.ts` / `instruction-executer.ts` (parsing de l'article + du trailer `concernant`).

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

- [x] **Faute d'orthographe « jeurdi » sur le jeudi** (LOT 6, 2026-06-09). Le tableau des jours
  de la semaine contenait `'jeurdi'` au lieu de `'jeudi'` à deux endroits actifs :
  `instruction-dire-numerique.ts:66` (balise d'affichage `[jour]`) et `conditions-utils.ts:1273`
  (condition `si le jour est <jour>`). Conséquence : un jeudi, `[jour]` affichait « jeurdi » et
  `si le jour est jeudi` était toujours faux. Corrigé (+ commentaire mort `instructions-utils.ts:158`).
  Garde : `temps-exemples-wiki.spec.ts` F068-T007.

- [x] **Implication / exclusion : états sujet/cible non pré-existants + cascade incomplète** (LOT 5, 2026-06-09).
  Deux correctifs liés (`liste-etats.ts`, `generateur.ts`, `parametres.ts`, `analyseur.divers.ts`) :
  - **Fix 1 — création automatique des états** : nouveau paramètre `activerCreationAutomatiqueEtats`
    (actif par défaut ; DSL `activer/désactiver création automatique des états.`). Si actif, les états
    inconnus utilisés dans une définition / `changer` / une relation (implication/exclusion) sont créés
    à la volée (les phases implication/exclusion appellent `assurerEtatPourRelation`). Si inactif, un
    état non déclaré → erreur (hors **conditions**, qui n'ont jamais créé d'état via `trouverEtat`).
    `trouverOuCreerEtat` respecte le flag (renvoie `null` si désactivé).
  - **Fix 2 — cascade des implications** : `ajouterEtatElement` applique désormais l'état impliqué via
    `appliquerAjoutEtatCascade` (récursif) → l'état impliqué applique À SON TOUR ses bascules/groupes/
    contradictions (ex. `enragé ⟹ éveillé` réveille un dragon `endormi`). Un suivi `{ajoutes, retires}`
    évite les boucles et lève une « Conflit d'états » si on ajoute un état précédemment retiré (ou
    l'inverse) dans la même cascade.
  Tests : `etats-creation-cascade.spec.ts` (F067-T001→T004). Suite complète verte (1223). Exemples wiki
  `etats/{implication_dragon,dragon_endormi}.djn` rétablis (réveil par implication) + doc mise à jour.

- [x] **`si un tirage … réussit` était inversé** (coquille regex `/résussi/` → `/réussi/`),
  `analyseur.condition.ts:361` — corrigé le 2026-06-05 (commit `91562107`) + garde
  `condition-tirage-reussir.spec.ts`. `réussit` ET `échoue` fonctionnent désormais.
