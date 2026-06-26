## Contexte
Audit de couverture des tests unitaires du moteur Donjon FI (branche/worktree dédiés), puis comblement des plus gros trous + correction des bugs latents découverts en chemin.

Point de départ : `docs/plan-tests-a-ajouter.md` (plan priorisé de 207 tests, données istanbul brutes dans `docs/couverture-summary-2026-06-20.json`). Couverture mesurée initiale : **stmt 70,6 % / branch 59,9 % / func 75,6 %**.

## Résultat
- **~329 nouveaux tests** (suite **1469 → 1798**, 0 échec).
- **9 bugs moteur réels corrigés** (B2–B11, sauf B1), chacun avec une garde de non-régression et la suite complète revérifiée :
  - **B3/B4** `conjugaison` : 2ᵉ groupe totalement cassé (`Notification.length` → radical vide ; table `ir` morte). Correctif cohérent (radical stem-based + table `ir` réécrite + sélection group-aware).
  - **B2** `condition-multi.toString` (double incrément sautait un élément), **B5/B6** `commandeur`/`commandeur.tour` (copier-coller CECI/CELA, B5 évitait aussi un crash), **B7** `actions-utils` (message « combinaison »), **B8/B9** `abreviations` (apostrophe `l’` espacée / préfixe `s’`), **B10** `element-jeu` (`?.` manquant), **B11** `propriete-jeu.getDe` (élision des voyelles accentuées).

## Couverture ajoutée
Utils purs (mot/string/phrase/positions/tableau/conjugaison/propriété) et P0 intégration via `TestUtils` (conditions, changer, actions, déclencheur, compteurs, listes, états, commandeur, débogueur, flux/système/afficher, déplacer-copier, dire balises/numérique/contenu).

Les vagues de tests ont été rédigées en partie par des sous-agents parallèles qui auto-exécutent leurs specs (seuls les tests verts sont conservés), puis revérifiées ensemble + suite complète.

## À suivre (hors PR)
- **B1** `analyseur.type` (push d'erreur vide) délibérément **non corrigé** : contrairement à ce que suggérait l'audit, le vrai fix n'est pas trivial (la condition flague aussi les classes de base et les types référencés en avant) — à traiter séparément.
- **Quirk à confirmer** : `ajouter X à l'historique` dans une *règle avant commencer* ne semble pas peupler la liste (caractérisé dans F111, non confirmé comme bug).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
