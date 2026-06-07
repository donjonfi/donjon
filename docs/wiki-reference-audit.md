# Audit de couverture du wiki « référence » — état et reste à faire

> But : combler les lacunes de la **référence** auteur (DokuWiki hors repo,
> `D:\GIT\2025\donjon3\wiki\v3\data\pages\reference\`) en doc **et** en exemples
> testables. Ce document est le point de reprise du chantier.

## Comment reprendre

1. Lire ce fichier + `wiki-reference-audit-findings.json` (données brutes exhaustives).
2. Choisir le prochain **lot** (voir « Backlog priorisé »).
3. Pour chaque notion : **probe-vérifier** la syntaxe réelle (cf. « Boucle de validation »)
   AVANT d'écrire — l'audit liste des notions qui n'existent pas vraiment côté auteur.
4. Écrire l'exemple `.djn`, la spec, lancer le test, `sync-wiki-examples.ps1`, écrire la page.
5. Récap à l'utilisateur, attendre validation.

Le détail par item (recommandation, page, preuve moteur, priorité) est dans
**`wiki-reference-audit-findings.json`** sous `.result.domains[].findings[]` et
`.result.critic.missed[]`. Filtrer par `bucket` (`not_covered`/`partial`/`no_testable_example`/`ok`)
et `priority` (`high`/`medium`/`low`).

```bash
# Exemple : lister les lacunes haute priorité d'un domaine
node -e "const d=require('./docs/wiki-reference-audit-findings.json').result; \
d.domains.forEach(x=>x.findings.filter(f=>f.bucket!=='ok'&&f.priority==='high') \
.forEach(f=>console.log(x.domain.slice(0,12),'|',f.notion)))"
```

## Méthode & périmètre

Diff à trois voies **moteur ↔ chunks DSL ↔ wiki+exemple**, ancré sur le **code moteur**
(source de vérité). Périmètre = namespace `reference/**` uniquement (tutoriels/faq/exemples/
messages hors périmètre). « A un exemple testable » = lien `[[djnc>…]]` adossé à un `wiki_*.djn`.
Exclusion : `inclure` (volontairement non testable via djnc).

## Résultats chiffrés

**312 notions : 124 ok · 81 sans exemple · 59 non couvertes · 48 partielles → 188 lacunes**
(+ 7 angles morts du critique). Priorité : **42 haute · 88 moyenne · 58 basse**.

| Domaine | non couv. | partiel | sans ex. | ok |
|---|---|---|---|---|
| Conditions & contrôle (si) | 18 | 11 | 19 | 5 | ← **pilote livré** |
| Texte / balises | 14 | 12 | 6 | 22 |
| Instructions | 12 | 3 | 18 | 17 |
| Définitions du monde | 4 | 8 | 6 | 14 |
| Mémoire | 4 | 3 | 10 | 22 |
| Divers & config | 3 | 0 | 5 | 2 |
| Routines / réactions / actions | 3 | 5 | 3 | 20 |
| Débogage & replay | 1 | 2 | 6 | 12 |
| Temps (horloge/calendrier) | 0 | 1 | 7 | 6 |
| Hasard | 0 | 3 | 1 | 4 |

## ✅ Déjà livré (2026-06-05)

**LOT 0 — bugs documentaires (vérifiés contre le moteur) :**
- `texte/balises_dynamiques` : `[accord X]` = **e+s** (alias de `[es X]`) ; ajout de `[e X]`
  (« e seul »). Idem `dsl/dsl-04-texte.md`.
- `temps/calendrier` : `[calendrier]` renvoie **HH:MM** (pas la date) ; date via
  `[jour]/[date]/[mois]/[année]`.
- `definitions/connaitre_un_objet` : état **`connu` → `familier`** (réécrit) + **balayage**
  des occurrences éparpillées (`balises_dynamiques` table des mentions, `memoire/etats/start`,
  `memoire/etats/etats_de_base`).
- `controle/si/verbes/atteindre` + `depasser` : copier-coller corrigé (atteint = `≥`, dépasse = `>`).
- **Reporté** : `routines/simple` affirme à tort que les appels différés ne prennent pas
  d'arguments → à corriger en LOT 6 (avec `programmer_routine`).

**LOT 1 — Conditions (pilote) :**
- 7 exemples testables : `ressources/scenarios/exemples/wiki/conditions/{comparateurs, combiner,
  branches, verbe_etre, verbe_posseder, verbe_se_trouver, verbe_contenir}.djn` →
  synced `wiki_conditions_*`.
- Spec verte : `webapp/donjon/projects/donjon/src/lib/tests/conditions-exemples-wiki.spec.ts`
  (F060-T001 → T007). Suite complète : **1202 SUCCESS**.
- Pages enrichies : `controle/si/start` (tableau comparateurs, combiner, parenthèses, sinonsi,
  soit/ni/mais, Voir aussi, 3 djnc) ; `controle/si/verbes/{atteindre,depasser,valoir,etre,
  posseder,se_trouver,contenir}` (djnc + corrections, lien cassé `etre` réparé).

**LOT 2 — Instructions :**
- 4 exemples testables `wiki_instructions_{dire,changer,deplacer,choisir}` ; spec verte
  `instructions-exemples-wiki.spec.ts` (F062-T001→T004).
- Pages réécrites : `dire` (+ djnc), `changer` (corrige `déverrouillé` → `n'est plus verrouillé`,
  énumère toute la surface + djnc), `deplacer` (objet dans/sur/sous/inventaire + joueur vers lieu + djnc),
  `choisir` ×2 (ajout djnc, corrige le lien `djnb`-only).
- Calibration → `docs/TODO.md` : états multiples à la déclaration = reliés par « et »
  (`fermé et verrouillé`) ; `déplacer le joueur vers <direction>` non supporté ;
  `[intitulé le <nom>]` (article masc.) → « problème balise » (forme correcte : `[intitulé <nom>]`).

**LOT 3 — Texte / balises :**
- 2 exemples testables `wiki_texte_{compter_elements,verbes_conjugues}` ; spec verte
  `texte-exemples-wiki.spec.ts` (F063-T001→T002).
- Pages enrichies : `balises_dynamiques` (nouvelle section « Compter des éléments » :
  `[nombre de <classe>]`, `+ <état>`, `[nombre de <classe> dans/sur/sous X]` + djnc) ;
  `conjugaison` (ajout de l'exemple jouable `[v …]` manquant + djnc).
- **Bug moteur corrigé** : filtre de classe ignoré avec une position (calibration #7).

## ⚠️ Découvertes de calibration (recherche à NE PAS reperdre)

1. **Combiner deux conditions distinctes** → `et si` / `ou si` (ou `et que` / `ou que`).
   Le `et` / `ou` **seul** entre deux clauses sujet+verbe NE combine PAS (silencieusement
   faux) ; il sert à partager un sujet (`possède X et Y`). **Parenthèses supportées**
   (idiome `(A ou si B) et si C`). [vérifié au probe + parser `analyseur.condition.ts:35,458`]
2. **BUG MOTEUR — ✅ CORRIGÉ (2026-06-05)** — `analyseur.condition.ts:361` testait `/résussi/`
   (coquille pour `réussi`) → négation toujours `"pas"`, donc `si un tirage … réussit` était
   **inversé** (= `échoue`). Corrigé en `/réussi/` ; garde anti-régression dans
   `conditions-exemples-wiki.spec.ts` (F060-T008). LOT 9 (`reussir`) désormais **débloqué**
   pour `réussit` ET `échoue`.
3. **`existe` vers une direction** (`si une sortie existe vers le nord`) **ne marche pas**
   (faux au runtime ; conçu pour `vers ceci/cela`, `conditions-utils.ts:230-262`). L'audit
   l'avait classé `not_covered` HAUTE = **faux positif**. Ne pas documenter comme feature.
4. **`quantité de X` / `nombre de X`** en condition → « Ressource attendue » : lié au
   système de **ressources**, pas générique.
5. **`contient`** ne marche que pour une **liste / l'historique** (accord `contiennent`).
   Pour un objet précis dans un contenant → `se trouve dans` (`conditions-utils.ts:407` :
   « pas encore gérée » pour un complément objet ; listes gérées l.691).
6. États **intégrés** (allumé/éteint, ouvert/fermé, mangeable…) : ne PAS les **redéclarer**
   (`X peut être …` → « Définition attendue »). Les utiliser directement.
7. **BUG MOTEUR — ✅ CORRIGÉ (2026-06-06)** — `[nombre de <classe> dans/sur/sous X]` **ignorait
   le filtre de classe** : avec une position, `trouverProprieteCible`
   (`instructions-utils.ts:325` case `nombreDeClasseAttributsPosition`) prenait **tout** le contenu
   de X via `trouverContenu(prepositionSpatiale)` puis ne filtrait que sur l'**état**, jamais sur la
   classe → `[nombre de trophées sur l'étagère]` comptait tous les objets posés dessus. Corrigé :
   étape « 1bis » qui `filter(heriteDe(x.classe, recherche.classe.nom))` (calquée sur le case A
   sans position). Garde F063-T001 (`trophées sur l'étagère` = 1, `objets allumés sur l'étagère`
   = 1). Le wiki documente désormais `[nombre de <classe> dans/sur/sous X]` comme filtrant la classe.
8. **`[nombre de <prop> de X]` ne marche PAS comme balise d'affichage** (LOT 3, probe) : la regex
   `xNombreDeProprieteElement` existe mais `[nombre de pattes du mille-pattes]` → « problème balise ».
   Lire une propriété numérique via `[<prop> de X]` (ex. `[pattes du mille-pattes]` = 100, propriété
   déclarée par `Les pattes du mille-pattes valent 100.`). NB : `Le nombre de … vaut N` n'est pas une
   définition valide (« Définition attendue »).
9. **Genre sur un pluriel** : `Les X sont des objets féminins/féminines` ne rend PAS `[pronom ceci]`
   au féminin (reste « ils »). Le genre fém. n'est lu correctement qu'au singulier (`objet féminin`
   → « elle »). Pour un démo de conjugaison/pronom pluriel féminin, à re-probe-vérifier (hors LOT 3).
10. **`action examiner ceci` ne surcharge pas le `examiner` intégré** ; ce dernier garde l'objet
    non vu (« Je ne l'ai pas encore vue ») tant qu'il n'a pas été vu (le `regarder` d'ouverture
    marque les objets `vu`). Pour un texte avec `ceci` lié → le mettre dans la **description** de
    l'objet (`Sa description est "… [v … ceci] …"`) ; jouer `regarder` puis `examiner` (cf. modèle
    `ressource-grammaire.spec.ts` + exemple grimoire). Pour remplacer un comportement : `règle
    remplacer examiner ceci` (mais l'exemple devient moins « standalone » côté djnc).
11. **Classes personnalisées (LOT 4, probe + correction utilisateur)** : la **bonne syntaxe** est
    `Un X est un <type>` (PAS `une sorte de`). Elle hérite correctement et **se chaîne** :
    `Un familier est un animal.` + `Un chaton est un familier.` → un chaton est familier + animal
    + objet (vérifié : `nombre de familiers` = 3 dont le chaton, `minou est un familier/animal` OK).
    `Un X est <état>` pose un défaut de type hérité (surchargeable par instance : `Le chien est
    repu.`), et on peut poser le défaut inline dans le sous-type : `Un chaton est un familier
    affamé.`. ⚠️ `une sorte de` (que j'avais utilisé) compile mais **ne chaîne pas** custom→custom
    → ne pas l'employer. Formes invalides : `Un X peut être A ou B` (états → forme standalone
    `A et B forment une bascule`) ; `La description d'un X est "…"` (pas de description par défaut
    de type, non prévu). **Capacités (« Il permet de … ») = TODO moteur non implémenté** → ne pas
    documenter en LOT 4.

**Leçon transversale** : le bucket `not_covered` confond « existe dans le moteur » et
« marche pour l'auteur ». → **probe-vérifier chaque `not_covered`** avant d'écrire.

## Boucle de validation (par lot, incrémentale)

1. Écrire le `.djn` sous `ressources/scenarios/exemples/wiki/<thème>/`.
2. Spec `*.spec.ts` (modèle : `conditions-exemples-wiki.spec.ts` ou `ressource-exemples-wiki.spec.ts`) :
   inline le scénario préfixé par `actions` (import `./scenario_actions`).
   `TestUtils.genererEtCommencerLeJeu` **lève si erreur de compil/analyse** → vaut compile-check ;
   asserter le comportement (`ctx.com.executerCommande(...).sortie`).
3. `ng test donjon --include="**/<file>.spec.ts" --watch=false --browsers=ChromeHeadless`.
4. `scripts/sync-wiki-examples.ps1` (régénère les `wiki_*.djn` pour que `[[djnc>]]` résolve).
5. Écrire/enrichir la page wiki + liens « Voir aussi ».
6. Servir le wiki pour vérifier le rendu : `cd D:\GIT\2025\donjon3\wiki\v3 ; C:\php\php.exe -S localhost:8000`.

## Conventions

- Pages : `======` H1 (1/page), `=====` H2, `==== ====` H3, code inline `''xxx''`.
  Exemple court `<code donjon>…</code>` ; jouable `<file donjon wiki_<thème>_<nom>>…</file>` +
  `[[djnc>wiki_<thème>_<nom>|tester cet exemple]]`. Section « Voir aussi » finale.
- Apostrophes typographiques U+2019 dans les chaînes affichées. Pas de markup dans les labels
  de liens, pas de liens dans les titres. `<WRAP tip|important>` disponible.
- Mini-jeux : 1 lieu + minimum, en-tête comment, « règle avant commencer le jeu » listant les
  commandes à essayer. États ∈ liste de base ou perso. Nommage synced :
  `wiki/<dossier>/<fichier>.djn` → `wiki_<dossier>_<fichier>.djn`.
- Hygiène fan-out : 1 spec + 1 dossier `.djn` par lot ; `sync` + `ng test` = étapes globales
  en série après chaque lot.

## Backlog priorisé — reste à faire

Items **haute priorité** détaillés ci-dessous (recommandation courte). Pour les items
**moyenne/basse** : voir le JSON (filtrer par domaine + bucket + priority). Les doublons
inter-domaines sont assignés à un seul lot (balises heure/date → LOT 6 ; locateur `situé` → LOT 1).

### LOT 1 — Conditions (reste, après pilote)
- (moyen) `choisir` statique : djnc dédié (l'exemple actuel est un `djnb`, ne compte pas).
- (moyen) `exister` : sortir l'exit-testing (faux positif) ; documenter `une propriété existe`.
- (moyen) sujets spéciaux qui MARCHENT : `le jeu est commencé/terminé`, `réponse`, `infinitif
  de l'action` (à re-probe-vérifier un par un) ; `commence par` / `termine par`.
- `reussir` → **LOT 9** (dépend du bug moteur).

### LOT 2 — Instructions (HAUTE) — ✅ livré (dire, changer, déplacer, choisir)
Reste (moyenne) : `copier X dans/sur/sous Y` ; verbes ressources `consommer` / `créer` /
`déplacer … depuis … vers` (page instruction dédiée) ; `exécuter l'action/la commande/la réaction` ;
`afficher` image/écran ; `jouer` son/musique ; `attendre` (touche / N s) ; `sélectionner un nombre`.

### LOT 3 — Texte / balises (HAUTE) — ✅ livré (compter éléments, verbes conjugués)
- ✅ `[nombre de <classe>]` + `<état>` + `[nombre de <classe> dans/sur/sous X]` documentés + djnc.
  Découvertes : filtre classe ignoré avec position → **corrigé** (calibration #7) ;
  `[nombre de <prop> de X]` ne marche pas comme balise (#8) → non documenté comme tel.
- ✅ Conjugaison `[v …]` : exemple jouable + djnc ajoutés.
- (déjà fait LOT 0 : `[e X]`/`[es X]`/`[accord X]`).
- Reste (moyenne, JSON) : autres balises `texte/*` non couvertes/partielles.

### LOT 4 — Définitions du monde (HAUTE) — ✅ livré
- ✅ **Classes personnalisées & héritage** + **`definitions/classes`** (stub → page complète :
  hiérarchie des types intégrés, `Un X est un <type>`, héritage chaîné `Un chaton est un familier`,
  défaut de type + surcharge). Exemple `wiki_definitions_classe_personnalisee`, spec
  `definitions-exemples-wiki.spec.ts` F064-T001 (cf. calibration #11 pour la syntaxe correcte).
- ✅ **Catalogue des états INTÉGRÉS posables** (critique #1) : nouvelle page
  `definitions/etats_integres`. États qui **activent une action par défaut** (vérifiés) :
  mangeable→manger, buvable→boire, lisible→lire (→lu), ouvrable→ouvrir/fermer,
  portable/enfilable/chaussable/équipable→**mettre/enlever** (→porté/enfilé/chaussé/équipé),
  transportable→**prendre/poser** (fixé bloque : « Elle est fixée. »), parlant→**parler avec**
  (muet bloque). Section « posables sans action par défaut » réduite à : allumé/éteint,
  actionné/arrêté, opaque/transparent. Exemple `wiki_definitions_etats_interactions` (manger/lire/
  ouvrir/mettre/prendre-fixé/parler), spec F064-T002. Cross-links `etats_de_base` + `visibilite`.
- ❌ **Capacités** (« Il permet de … ») = **TODO moteur non implémenté** → hors LOT 4.
- Calibration : `ouvrir` exige `ouvrable` ET un état `ouvert`/`fermé` ; `mettre`/`enlever` couvrent
  les vêtements/équipement ; `prendre` bloqué par `fixé` ; `parler avec` exige parlant (≠ muet).

### LOT 5 — Mémoire (HAUTE)
- `memoire/historique` : prose OK mais AUCUN djnc → exemple (définir/ajouter/tester ; **attention** :
  l'historique n'est pas une liste qu'on déclare via `L'historique est une liste` — re-probe-vérifier
  la vraie syntaxe d'alimentation, mes essais `changer/ajouter` n'ont pas déclenché).
- Relations entre états (bascule ↔ / implication → / exclusion ≠) : djnc (les `.djn`
  `etats/bascule_linge.djn`, `etats/implication_dragon.djn` existent déjà → relier).

### LOT 6 — Temps (HAUTE/MOYENNE)
- Routine programmée **avec arguments** (`exécuter la routine X avec <args> dans N s`) :
  section + djnc sur `programmer_routine`. **+ corriger `routines/simple`** (claim « pas d'args »).
- Balises `[heure]/[date]/[horloge]/[jour]/[mois]/[année]` + conditions sur l'heure → djnc.

### LOT 7 — Divers & configuration (HAUTE)
- **(critique)** `désactiver les actions/commandes de base` (jeu 100 % custom — `analyseur.divers.ts:80`).
- `activerAudio`, `activerRemplacementDestinationDeplacements`, `activerChoixNumeriques`.
- `divers/liquides` → `<file>` + djnc ; `commencer_le_jeu` → djnc.

### LOT 8 — Routines / actions prédéfinies (HAUTE)
- `routines/actions_predefinies/start` : remplir la section conversation vide
  (`parler/demander/interroger/montrer`) + compléter ~25 verbes manquants (casser, pousser,
  tirer, toucher, secouer…).

### LOT 9 — Hasard (HAUTE) — bug `réussit` corrigé, lot débloqué
- `controle/si/verbes/reussir` : documenter `réussit` **et** `échoue` + djnc (la garde
  F060-T008 couvre déjà `un tirage à 1 chance sur 1 réussit/échoue` — en faire un exemple wiki).
- (moyen) tirage dans une liste, déterminisme via graine (PRNG).

### LOT 10 — Débogage (BASSE)
- Commande joueur `déboguer`/`deb` (la plupart non « exemplifiable » via djnc).

## Sources moteur (ancres)
`utils/jeu/instructions.ts` (dispatch), `instruction-changer.ts`, `instruction-dire*.ts`,
`utils/compilation/analyseur/analyseur.condition.ts` + `analyseur.divers.ts`,
`models/commun/constantes.ts` (EEtatsBase), `parametres.ts`, `ressources/scenarios/actions.djn`.
