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
- ✅ **(traité en LOT 6)** : `routines/simple` affirmait à tort que les appels différés ne prennent
  pas d'arguments → corrigé (section « Appels différés avec arguments »).

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

### LOT 1 — Conditions (reste, après pilote) — ✅ livré (2026-06-10, « LOT 1bis »)
- ✅ `exister` : page réécrite (propriété / aperçu / sortie & porte vers une direction /
  préposition pour ceci-cela) + djnc `wiki_conditions_existe_prix` et `wiki_conditions_existe_sortie`.
  **2 bugs moteur corrigés** (`conditions-utils.ts`, détails `docs/TODO.md`) : la résolution du
  sujet ignorait `Correspondance.localisation` (→ `sortie existe vers le sud` faux + « Sujet de la
  condition pas trouvé » dans les erreurs de tour ; les formes `aucune …` ne marchaient que par
  double négation — d'où des probes **instables selon l'ordre des tests**, l'origine du
  « faux positif » noté ici) ; et null-check inversé branches PORTE/OBSTACLE de
  `verifierConditionExiste` (→ `porte existe vers` ne marchait jamais). Gardes F060-T010/T014
  (tamponErreurs vide inclus).
- ✅ sujets spéciaux re-probés un par un et CONFIRMÉS : `le jeu est commencé` / `terminé`
  (T011/T015), `la réponse` (est / commence par / termine par, T013), `l'infinitif de l'action`
  (T012, + forme `n'est ni X ni Y`). Nouvelle section « Sujets spéciaux » (tableau + djnc
  `wiki_conditions_sujets_speciaux`) sur `si/start`.
- ✅ `commence par` / `termine par` : nouvelle page `si/verbes/commencer_terminer` (compléments
  entre guillemets, sensible casse/accents) + djnc `wiki_conditions_reponse_libre` (choisir
  librement + autre choix + aiguillage sur la réponse). Les tests pilotent le choix libre au
  niveau moteur (helper `repondreLibrement` qui mime `traiterChoixLibreJoueur` +
  `terminerInterruption` du lecteur : `tour.reponse` + `continuerLeTourInterrompu`).
- ✅ `choisir` : le statique avait déjà son djnc (`wiki_instructions_choisir`, LOT 2) — le résidu
  réel était le **choix libre** : djnc `wiki_conditions_reponse_libre` ajouté + section « Tester
  la réponse dans une condition » + Voir aussi + typos ; le `[[djnb>ex_choix_sage]]` reste en
  lien complémentaire. Doublon éditorial `instructions/choisir` (sous-ensemble de
  `instructions/controle/choisir`) réduit à un renvoi (pattern LOT 10 mode_triche).
- Spec `conditions-exemples-wiki.spec.ts` F060-T008→T016 (16 verts). Calibration : espace
  insécable inséré par le moteur avant « ? »/« ! » → asserter sans la ponctuation (cf. LOT 9).
- (cosmétique) slugs `<file donjon>` recalés sur les djnc : `listes.txt` (`ex_listes_courses` →
  `wiki_memoire_liste_courses`), `compteurs.txt` (`ex_compteurs_score` → `wiki_memoire_score_points_vie`).
- `reussir` → **LOT 9** ✅ (déjà livré).

### LOT 2 — Instructions (HAUTE) — ✅ livré (dire, changer, déplacer, choisir)
Résidus moyens — ✅ livrés (2026-06-10, « LOT 2bis », spec F062-T005→T011) :
- ✅ `copier X dans/sur/sous Y` : nouvelle page `instructions/copier` + djnc
  `wiki_instructions_copier`. Calibration : les copies identiques sont regroupées à l'affichage
  (« Dedans, il y a 3 médailles. »).
- ✅ verbes ressources (`consommer`/`créer`/`déplacer … depuis … vers`) : **findings obsolètes** —
  couverts depuis le chantier #161 par `definitions/ressources` (sections + djnc
  `wiki_ressources_instructions`). Rien à faire.
- ✅ `exécuter` : page `instructions/executer` enrichie — `la commande "…"` (accepte les balises
  dynamiques), **nouvelle section `la dernière commande`** (= la commande précédente du joueur),
  `l'action` (⚠️ calibration : échoue « Plusieurs actions compatibles » si le verbe a des
  surcharges, ex. examiner — contournement documenté via `exécuter la commande`, bug noté
  `docs/TODO.md`, garde F062-T007), renvoi réaction → LOT 8 ; djnc `wiki_instructions_executer`.
- ✅ `afficher` image : djnc `wiki_instructions_image` (l'instruction émet `@@image:X@@`) +
  balise `[image X]` ajoutée à `texte/balises_dynamiques` (finding « partial »).
- ✅ `afficher l'écran …` : djnc `wiki_instructions_ecrans`. Calibration : chaque changement
  d'écran crée une interruption (`TypeInterruption.changerEcran = 'e'`) — en test, drainer les
  interruptions (`executerEnDrainant`).
- ✅ `jouer`/`arrêter` : djnc `wiki_instructions_audio` + note synonyme `stopper`.
  **Calibration test** : ne JAMAIS exécuter `jouer …` en spec — l'audio démarre réellement et
  Chrome headless rejette `play()` (NotAllowedError, unhandled rejection → DISCONNECTED Karma) ;
  la spec compile + n'exécute que `arrêter`.
- ✅ `attendre` : djnc `wiki_instructions_attendre` + **plafond 10 s documenté** (« Attendre: 10
  secondes maximum. », `instruction-systeme.ts:66`) + typo. Interruptions `'t'`/`'s'`
  (`nbSecondesAttendre`), reprise testée.
- `sélectionner un nombre` → déjà livré au LOT 9 (`instructions/selectionner`).

### LOT 3 — Texte / balises (HAUTE) — ✅ livré (compter éléments, verbes conjugués)
- ✅ `[nombre de <classe>]` + `<état>` + `[nombre de <classe> dans/sur/sous X]` documentés + djnc.
  Découvertes : filtre classe ignoré avec position → **corrigé** (calibration #7) ;
  `[nombre de <prop> de X]` ne marche pas comme balise (#8) → non documenté comme tel.
- ✅ Conjugaison `[v …]` : exemple jouable + djnc ajoutés.
- (déjà fait LOT 0 : `[e X]`/`[es X]`/`[accord X]`).
- Résidus moyens — ✅ livrés (2026-06-10, « LOT 3ter », spec F073-T006→T008) :
  - ✅ filtres `sauf cachés / sauf mentionnés / sauf cachés et mentionnés` documentés
    (`balises_dynamiques` § Contenu). **Calibration** : un objet caché déjà affiché/mentionné
    n'est plus filtré par `sauf cachés` (révélé = plus à cacher — le 1er probe semblait montrer
    un filtre inopérant, c'était l'ordre des balises dans l'action) ; `sauf mentionnés` = pas
    encore mentionnés au cours du tour.
  - ✅ `[obstacle vers ceci]` (exemple, sortie accordée « La grille est fermée. ») et
    `[statut ceci]` (sorties réelles accordées en genre) documentés. **Calibration** : ces deux
    balises n'acceptent QUE les cibles spéciales — élément/direction nommés → balise brute ou
    « problème balise » (la levée de limitation F074 ne couvre pas ces handlers).
  - ✅ verbes pronominaux `[v s'ouvrir ipr ceci]` → « s'ouvre » / « ne s'ouvre pas » :
    paragraphe + note sur `conjugaison` ; même restriction cibles spéciales pour `[v …]`
    (élément nommé → balise laissée telle quelle).
  - ✅ alias `[il X]/[Il X]` (= `[pronom X]/[Pronom X]`) noté ; `[infinitif action]` documenté
    sur `balises_dynamiques` (vérifié T008) ; cross-links Voir aussi → temps/horloge+calendrier.
  - ✅ `[énumérer la liste L]` ajouté sur `memoire/listes` (+ tableau comparatif
    lister/décrire/énumérer ; la section « Énumérer » montrait en fait `[lister]`).
  - ✅ `mise_en_forme` : section « Typographie automatique » (apostrophe courbe auto,
    insécables avant !?:).
  - **Findings obsolètes** (déjà couverts avant) : `[c taille de liste]` (memoire/listes l.133),
    djnc conjugaison (LOT 3, `wiki_texte_verbes_conjugues`), et tout le bloc pronoms/cibles/
    quantité/mémoire/aide/nombre/Cest/Singulier-Pluriel (LOT 3bis), `[image X]` (LOT 2bis).
  - **Décisions « ne pas documenter »** : alias `{l}`/`{t}` (volontairement non documentés
    côté moteur) ; `@@tester audio@@` (mécanique interne du lecteur, pas une balise auteur).

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

### LOT 5 — Mémoire (HAUTE) — ✅ livré (2026-06-09, commit 8e987c18)
- ✅ `memoire/historique` : page réécrite + exemple complet `wiki_memoire_historique_levier`
  (file + djnc) + spec `memoire-exemples-wiki.spec.ts` F065-T001→T003. **Syntaxe résolue**
  (le doute du re-probe est levé) : l'historique EST une liste déclarée (`L'historique est une
  liste.`), alimentée par `changer l'historique contient "…"` / retirée par `ne contient plus`,
  testée par `si l'historique contient "…"` (condition et balise dynamique).
- ✅ Relations entre états (bascule ↔ / implication → / exclusion ≠) : spec
  `etats-exemples-wiki.spec.ts` F066 (bascule, implication **en cascade** — enragé ⟹ éveillé
  chasse endormi du groupe de contradiction —, exclusion, + gros exemple dragon) ; exemples
  `etats/bascule_linge.djn`, `implication_dragon.djn`, `dragon_endormi.djn` reliés par djnc
  sur `memoire/etats/start` et `definitions/etats_personnalises`.

### LOT 6 — Temps (HAUTE/MOYENNE) — ✅ livré (2026-06-09)
- ✅ Routine programmée **avec arguments** : section « Programmer une routine avec des arguments »
  + djnc sur `temps/programmer_routine` (exemple `wiki_temps_routine_avec_args`). **`routines/simple`
  corrigé** : la section « Limitation des appels différés » (claim « pas d'args ») est remplacée par
  « Appels différés avec arguments » (args résolus au déclenchement, surcharge re-résolue).
- ✅ Balises horloge/calendrier + conditions : djnc `wiki_temps_horloge_jour_nuit` (`[horloge]/[heure]/
  [minute]/[seconde]` + `si l'heure dépasse …`) sur `temps/horloge` ; `wiki_temps_calendrier_fetes`
  (`[jour]/[date]/[mois]/[année]` + `si le mois est décembre` / `dépasse` / `si le jour est dimanche`)
  sur `temps/calendrier`. Spec `temps-exemples-wiki.spec.ts` F068-T001→T007 (clock rejoué via
  `HorlogeUtils`, cf. F058). **Bug moteur corrigé** : faute `jeurdi`→`jeudi` (balise `[jour]` +
  condition `si le jour est jeudi`), 2 sites actifs, garde F068-T007 (cf. `docs/TODO.md`).
- Calibration : la regex balise horloge accepte le pluriel (`[heures]/[minutes]/[secondes]`, `s*` hors
  capture) ; la regex calendrier non (`[jour]` au singulier). `mois` compteur = 1→12 ; `jour` compteur
  = 1 (lundi) → 7 (dimanche) ; valeur textuelle via `être` (`le mois est décembre`, `le jour est dimanche`).

### LOT 7 — Divers & configuration (HAUTE) — ✅ livré (2026-06-09)
- ✅ **(critique)** `Désactiver les commandes de base.` documenté + djnc `wiki_divers_jeu_custom`.
  Détection sur le scénario brut (`compilateur-v8.ts:34`, regex littérale terminée par `.`/`;`).
  **Calibration** : désactiver enlève AUSSI `commencer le jeu` (= action de base `commencer ceci`,
  actions.djn:247) et `regarder` ; le boot du lecteur (`lecteur.component.ts:431`) ne déclenche
  `commencer le jeu` **que si l'action existe**. Solution documentée : l'auteur définit sa propre
  `action commencer le jeu:` (vérifié : acceptée, déclenchée au démarrage). `chanter` EST une action
  de base (actions.djn:240) → ne pas l'utiliser comme exemple custom.
- ✅ `activerAudio` (défaut **off**), `activerRemplacementDestinationDeplacements` (défaut **on**),
  `activerChoixNumeriques` (défaut off, **UI-only** `lecteur.component.ts` → pas de test unitaire),
  + synonymes auto / attendre / création auto états : catalogue (formulations + défauts + effet)
  dans `divers/configurations`. Cross-links jouer / choisir / etats_personnalises.
- ✅ `divers/liquides` → `<file>` djnc `wiki_divers_liquides` (liquide+buvable+`bu`) + typos corrigés
  (« J'avais », « une bouteille ») ; `divers/commencer_le_jeu` → djnc `wiki_divers_commencer`.
- Spec `divers-exemples-wiki.spec.ts` F069-T001→T004 (preparer `analyserScenarioEtActions` AVEC
  les `actions` de base — TestUtils.genererEtCommencerLeJeu ne les inclut pas, donc inapte à tester
  la directive). T002 = contrôle (sans directive, `regarder` marche).

### LOT 8 — Routines / actions prédéfinies (HAUTE) — ✅ livré 2026-06-09
- ✅ `routines/actions_predefinies/start` : sections conversation (parler/interroger/demander/
  montrer/donner + variantes prépositionnelles), vivant, « Manipuler un objet », « Expressions
  et divertissement » + Voir aussi ; djnc `wiki_actions_conversation` (vendeuse à réactions).
- ✅ `routines/reaction/start` : section « Déclencher une réaction manuellement »
  (`exécuter réaction de ceci` SANS article — bug article/`concernant` noté dans TODO.md).
- Spec `actions-exemples-wiki.spec.ts` F070-T000→T011 (harness `analyserScenarioEtActions`
  + actions de base, pattern F069).

### LOT 9 — Hasard (HAUTE) — ✅ livré 2026-06-10
- ✅ `controle/si/verbes/reussir` réécrit : sections `réussit` ET `échoue` (X chances sur Y /
  Y−X sur Y) + exemple jouable `wiki_hasard_tirage_pepite` (tamiser 1/3 réussit, pêcher 2/3
  échoue) + Voir aussi.
- ✅ `instructions/selectionner` : intro corrigée (nombres uniquement, PAS de liste), bug
  copier-coller `dé2`→`dé1` dans le sinon, exemple jouable `wiki_hasard_de_six`
  (`[mémoire nombre]` + comparateur) + Voir aussi.
- ✅ `hasard.txt` : djnc sur les 3 sections (de_six, tirage_pepite, texte_au_hasard déjà LOT 3),
  typo « C'est est », + section « Le hasard est rejouable » (graine notée dans sauvegardes/
  magnéto ; `annuler` régénère volontairement la graine — anti save-scumming).
- Spec `hasard-exemples-wiki.spec.ts` F071-T001→T003 (40 tirages/issue, P(faux échec) < 1e-7 ;
  cohérence valeur↔Gagné/Perdu sur 30 lancers).
- **Calibrations LOT 9** : « tirage dans une liste » = **faux positif d'audit** (le moteur ne
  supporte QUE `sélectionner un nombre compris entre X et Y`, cf. erreur explicite dans
  `instruction-selectionner.ts`) ; la graine n'est PAS exposée au DSL (mécanisme interne
  `.sol`/`.rec`) → documentée comme comportement, pas comme feature ; noms de nombres
  personnalisés multi-mots et avec chiffres OK (`dé1`, `petit dé` — sondés) ; le moteur
  remplace l'espace avant « ! » par une insécable dans la sortie (assertions sans « ! »).

### LOT 3bis — Texte / balises restantes (MOYENNE) — ✅ livré 2026-06-10
- ✅ `balises_dynamiques` : nouvelles sous-sections `[lui X]`, `[Cest X]/[cest X]`,
  `[Singulier X]/[Pluriel X]`, `[quantité X]` (+ djnc `wiki_texte_pronoms_accords`, pomme f sing /
  cerises f pl) ; nouvelle section « Cibles spéciales » (tableau ceci/cela/ici/origine/destination/
  orientation/réponse + `[ceci]/[cela]` brut + `[préposition ceci/cela]` + djnc
  `wiki_texte_origine_destination`) ; snippet listes (`[énumérer/lister/décrire maListe]`, guillemets
  sur les items texte) ; `[mémoire X]` ; section « Fiche d'aide » `[aide ceci/cela]` (snippet
  `règle remplacer afficher ceci pour cela` validé par test).
- ✅ `mise_en_forme` : « Couleur 4 (code) » `{@…@}` (span `t-code-couleur`, `balises-html.ts:54`).
- Spec `texte-balises-exemples-wiki.spec.ts` F073-T001→T005 (verte).
- **Calibrations LOT 3bis** (sondées) :
  - ~~Les balises propriété n'acceptent QUE les cibles spéciales~~ — **limitation LEVÉE**
    (2026-06-10) : la regex `instruction-dire-propriete.ts:32` accepte aussi un élément nommé
    (`[lui pomme]`, `[Cest cerises]`, `[le balai]`…), résolu par intitulé ; balise laissée
    intacte si non résolu (protège `[s score]` compteur & co). Spec F074
    `balises-cibles-nommees.spec.ts` ; wiki `balises_dynamiques` § Cibles spéciales reformulé.
  - Le féminin sur un pluriel marche avec le **marqueur `(f)`** (`Les cerises (f) sont…`) —
    la calibration #9 ne vaut que pour l'épithète (`des objets féminins`). Voulu, pas de changement.
  - `origine/destination/orientation` remplis au déplacement (`instruction-systeme.ts:103+`) ;
    ~~`aller vers le nord` ne tire pas~~ — **limitation LEVÉE** (2026-06-10) :
    `Evenement.orientationDeplacement` mémorise la direction et le `Declencheur` matche dessus ;
    `règle après aller vers le nord` déclenche (aussi via raccourcis `nord`/`n`), cumulable avec
    la règle « lieu ». Spec F075 `regles-direction-deplacement.spec.ts` ; wiki
    `routines/regle/start` § Déclencheurs.
  - `[préposition ceci]` est vide pour `poser ceci sur cela` (pas de préposition devant ceci) ;
    `[préposition cela]` → « sur ».
  - `règle remplacer` : la signature inclut la phase `définitions` — sans elle (deux intitulés ici)
    l'action de base coexiste et répond à la place du remplacement (garde F073-T005).
    **Conseil à l'analyse ajouté** (2026-06-10, `generateur.ts` passe 3) : forme non remplacée
    restante → `tamponConseils`. Spec F076 `regle-remplacer-conseil-partiel.spec.ts` ; wiki
    `routines/regle/remplacer` ⚠️ définitions = signature.
  - `aide danser` est une abréviation côté lecteur ; la commande moteur complète est
    `afficher aide pour danser`.

### LOT 10 — Débogage (BASSE) — ✅ livré 2026-06-10
- ✅ Exemple `wiki_debogage_terrain_essai` (cabane/jardin/pomme/coffre) relié aux DEUX pages
  `deboguer_element_jeu` (file + djnc) et `modifier_etat_jeu_et_position_joueur` (djnc + renvoi) —
  terrain d'essai pour `deb <élément>`, `deb changer`, `si <condition>`, `cd`, `mv`, `deb effacer`.
- ✅ `modifier_etat_jeu_et_position_joueur` : note de gating (les instructions `déboguer
  changer/déplacer/effacer/vider/dire` exigent le débogueur actif = éditeur, `commandeur.ts:166` ;
  l'inspection `deb <élément>` fonctionne partout — `essayerCommandeDeboguer` non gaté) + Voir aussi.
- ✅ `magneto.txt` : nouvelle section « Étape qui lit l'heure » (saisie date/heure à la pause,
  sortie attendue recalculée, ré-avance automatique) — finding `absent` MEDIUM du critique.
- ✅ `format_fichier_solution.txt` : forme `d:nom avec <args>` (table + prose, trailer canonique).
- ✅ Doublon éditorial : `divers/mode_triche.txt` (obsolète, 0 lien entrant) réduit à un renvoi
  vers `debogage/mode_triche` (canonique).
- Spec `debogage-exemples-wiki.spec.ts` F072-T001→T005 (harness `ContextePartie(jeu, undefined,
  false, true)` pour activer le débogueur + `Abreviations.obtenirCommandeComplete` pour étendre
  les raccourcis comme le lecteur ; T005 = contrôle gating débogueur inactif).
- Hors action (audit `complete`/UI, non testable via djnc) : magnéto navigation/divergence/
  édition, mode triche, générer solution/enregistrement, deb ici/états (console F12).

## Sources moteur (ancres)
`utils/jeu/instructions.ts` (dispatch), `instruction-changer.ts`, `instruction-dire*.ts`,
`utils/compilation/analyseur/analyseur.condition.ts` + `analyseur.divers.ts`,
`models/commun/constantes.ts` (EEtatsBase), `parametres.ts`, `ressources/scenarios/actions.djn`.
