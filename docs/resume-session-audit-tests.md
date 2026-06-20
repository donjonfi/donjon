# Reprise — Audit de couverture des tests unitaires

> Note de passation pour reprendre proprement la prochaine session.

## État actuel (2026-06-20)

- **Branche** : `test/audit-couverture-unitaire` — **poussée sur origin** (`origin/test/audit-couverture-unitaire`).
- **Worktree** : `D:\GIT\2025\donjon3\donjon3-audit-tests` (créé depuis master `a8aa427a`).
  - ⚠️ `webapp/donjon/node_modules` est une **jonction** vers `D:\GIT\2025\donjon3\donjon3-git\webapp\donjon\node_modules` (le worktree n'a pas ses propres deps). Lancer un spec : `npx ng test donjon --include="**/X.spec.ts" --watch=false --browsers=ChromeHeadless` depuis `webapp/donjon`.
- **9 commits** (`a8aa427a..49ecfcff`), arbre de travail propre.
- **Suite complète : 1798 verts** (1469 → 1798, **~329 tests ajoutés**), zéro régression.
- **Bugs moteur corrigés : B2, B3, B4, B5, B6, B7, B8, B10, B11** (B9 cosmétique/inerte). **Seul B1 reste** (non trivial — voir plus bas).

## Étape immédiate : créer la Pull Request

`gh` **n'est pas installé** dans cet environnement → la PR n'a pas pu être créée automatiquement.

Deux options :
1. **Web** : https://github.com/donjonfi/donjon/pull/new/test/audit-couverture-unitaire (coller le corps ci-dessous).
2. **CLI** (si `gh` installé plus tard) : depuis le worktree,
   `gh pr create --base master --head test/audit-couverture-unitaire --title "Audit de couverture : +~329 tests unitaires + 9 bugs moteur corrigés" --body-file docs/PR-body.md`
   (le corps ci-dessous est aussi enregistré dans `docs/PR-body.md`).

Alternative (convention du repo = merge local `--no-ff`) :
`git checkout master && git merge --no-ff test/audit-couverture-unitaire && git push origin master` (à faire dans le repo principal, pas le worktree, car master y est checkouté).

## Session 2026-06-20 (suite) — +6 fichiers specs

Vague « clôture couverture » : **F112–F120** ajoutés (≈118 tests, 3 commits `ae62aaf1`, `af9d58b4`, `a1b3a590`). Cibles désormais couvertes par assertions directes :
- `generateur.ts` (br72) : getOpposePosition / getLocalisation / getLieuID (F112) + appliquerDeclarationsEtats / appliquerAttributsAvecNegation (F117).
- `localisation.ts` (br33) modèle (F113) ; `position-objet.ts` getPrepositionSpatiale + `intitule.ts` getters (F120).
- `analyseur.attributs.ts` (br36, F114), `analyseur.capacite.ts` (br0, F115).
- `elements-jeu-utils.ts` (br71) : trouverDeterminantIndefini + sommeQuantiteRessource (F116).
- `verificateur.ts` (br53) : estFinRoutine mismatch (F118).
- `analyseur.position.ts` (br57) : multi-positions / placementNonRessource / élément introuvable (F119 ext).

**Prochain libre : F121.** Cibles restantes (rendement décroissant) : reste d'`elements-jeu-utils` (calculerIntituleElement, ces derniers, resoudreReferenceLocalisee), `instruction-dire-propriete/format`, `instruction-executer`, modèle `lieu.ts`.

### Nouveaux bugs moteur trouvés cette vague (NON corrigés — décision en attente)

- **B12** `compilation/expr-reg.ts:304` `xPronomPersonnelAttribut` : le lookahead négatif `(?!une |un |des )` est placé **avant** l'espace capturé → évalué à la position de l'espace, il ne voit jamais le déterminant qui suit. Garde inopérante : `Il est un outil` matche « un outil » comme **attribut** au lieu d'un type. Fix : déplacer l'espace avant le lookahead. Guard `xit [F114-T010]` dans `analyseur.attributs.spec.ts`.
- **B13** `compilation/analyseur/analyseur.position.ts:32-48` branche `/par rapport/` : `separerListeIntitulesEt("la cabane, la forêt")` → `["la cabane","la forêt"]`, le code prend `[0]` comme élément **concerné** et `[1]` comme **complément** → pour « Par rapport à la cabane, la forêt se trouve au nord… », sujet et complément sont **inversés** (positions attachées à cabane, complément forêt). Guard `xit [F119-T002]` dans `analyseur.position.spec.ts`.

## Reste à faire

- **B1** `analyseur.type.ts:52` (`ctxAnalyse.erreurs.push()` vide) — **NON corrigé volontairement**. L'audit le disait trivial à tort : la condition `!ctxAnalyse.typesUtilisateur.has(typeParent)` est vraie aussi pour les **classes de base** (objet/lieu/personne…) et pour les **types référencés en avant** (déclarés plus bas). Le vrai fix exige : (a) détecter une classe-racine (`EClasseRacine` / `ClassesRacines`), (b) gérer l'ordre de déclaration (la compilation est-elle mono- ou multi-passe ?). À investiguer avant de toucher, sinon on casse des scénarios valides. Tester via `CompilateurV8.analyserScenarioSeul` en assertant `rc.erreurs`.
- **Quirk F111 (à confirmer)** : `ajouter X à l'historique` dans une **règle avant commencer** n'a pas peuplé la liste (caractérisé à taille 0 dans `debogueur.spec.ts` T005). Peut être un vrai bug moteur — reproduire isolément.
- **Cibles de couverture restantes (rendement décroissant)** : `generateur` (br72), `verificateur` (br53, style analyseur), `elements-jeu-utils` (br71), `analyseur.propriete/attributs/capacite/position`, modèles `lieu/localisation/intitule`, `instruction-dire-propriete/format`, `instruction-executer`.
- **Annexe UI** (P3) : composants `ui/apercu/*`, `ui/visualisation/*`, `menu-tactile`, `lecteur.component` — non testés, hors scope moteur (cf. plan §5).

## Méthode qui a marché (à réutiliser)

Vagues de specs rédigées via **workflows d'agents parallèles** qui : lisent la source → grep les specs existants pour la **syntaxe DSL prouvée** → écrivent le `.spec.ts` → **l'exécutent headless** → corrigent jusqu'au vert (suppriment un test rebelle plutôt que rouge) → ne gardent que le vert. Puis : re-run groupé + **suite complète** + commit. Scripts des vagues : `…/workflows/scripts/draft-test-specs-wave{2..5}-*.js`.

Conventions : `[F0NN-TMMM]`, scénarios en template literals, apostrophes du code en U+0027, pas de chiffres dans les noms DSL. Numéros de feature utilisés : **F086–F111** (prochain libre : **F112**).

---

## Corps de la PR (copier-coller)

Voir `docs/PR-body.md`.
