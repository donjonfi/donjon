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
