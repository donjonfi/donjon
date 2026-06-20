# Plan de tests unitaires — Moteur Donjon FI

**Branche :** `test/audit-couverture-unitaire` · **Date :** 2026-06-20 · **Auteur :** architecte qualité (synthèse de 14 audits par sous-système)

---

## 1. Résumé exécutif

### État de la couverture (karma / istanbul)

| Métrique | Couverture | Lu comme |
|---|---|---|
| Statements | **70,59 %** (11473/16251) | secondaire |
| Branches | **59,90 %** (5950/9933) | **cible n°1** |
| Functions | **75,61 %** (1389/1837) | **cible n°2** |
| Lines | 71,25 % (11020/15466) | secondaire |

Suite actuelle : **1469 tests verts**, 104 fichiers spec, ~44 700 LOC de librairie (208 fichiers source).

### Méthodologie (à lire avant d'exploiter ce plan)

Le pourcentage de couverture est un **signal négatif uniquement** :

- **Faible %** = trou certain (du code n'est jamais exécuté → on ne sait rien de son comportement). C'est exploitable.
- **% élevé ≠ comportement vérifié.** La suite Donjon est majoritairement composée de tests d'**intégration** qui compilent un scénario et jouent des commandes : ils *traversent* énormément de code sans **asserter** sa logique propre. Un fichier peut être à 100 % de couverture sans qu'aucune assertion ne décrive son contrat.

Exemples concrets de ce piège, fournis par l'audit :
- `texte-utils.ts` : **st100 / br100 / fn100**, et pourtant **zéro** assertion sur `enleverBalisesStyleDonjon` / `enleverBalisesConditionnelles` / `remplacerEspacesInsecables` / `enleverGuillemets` (traversé incidemment).
- `condition-multi.ts` : **br100 / st100**, `toString()` exécuté (logs de debug) mais **jamais asserté** — et il contient un bug réel (cf. §4).
- `balises-html.ts` : **fn100 / st97**, mais seul `retirerBalisesHtml` est testé ; tout `convertirEnHtml` / `ajouterBalisesHtml` (cœur de la mise en forme) est non-asserté.
- `analyseur.type.ts` : **br100**, mais la branche « parent inconnu » est *inerte* (bug `push()` vide, cf. §4).

**On vise donc `functions%` et surtout `branches%`**, en privilégiant les **assertions directes** (input → output sur fonctions pures, ou assertion sur le `CodeMessage` / l'état muté pour le code piloté par scénario) plutôt que la simple traversée.

### Conclusions majeures (où sont les plus gros trous)

1. **Le cœur de la résolution n'est presque pas asserté directement.** `conditions-utils.ts` (br58, **211 branches non couvertes — le plus gros trou unique du moteur**), `declencheur.ts` (br33, jamais instancié dans un spec), `actions-utils.ts` (br46, 169/370 branches), `commandeur.ts` (br64) et `elements-jeu-utils.ts` (br71, 374/530) sont massivement *traversés* par l'intégration mais leur logique de **scoring / désambiguïsation / recherche d'éléments** n'est balisée par aucune assertion ciblée.

2. **Les utilitaires purs de langue sont une mine de quick-wins non exploitée.** `conjugaison.ts` (br35), `mot-utils.ts` (fn100 mais 0 assertion directe), `string.utils.ts` (br46), `texte-utils.ts` (100 % trompeur), `positions-utils.ts` (br33), `tableau-utils.ts` (absent du rapport). Testables sans compiler de jeu, ratio valeur/effort maximal.

3. **Des fichiers entiers à br0 / fn0 sur des fonctionnalités exposées à l'auteur.** `instruction-charger.ts` (**br0**), `aleatoire-utils.ts` (**br0**, pivot du replay déterministe), `analyseur.capacite.ts` (**br0**), `analyseur.attributs.ts` (br36, 0 assertion directe), `analyseur.position.ts` (br57, 0 assertion directe), `instruction-afficher.ts` (fn27/br29), `instruction-flux.ts` (br19).

4. **L'audit a révélé ~10 bugs réels** (no-op silencieux, copier-coller, mauvaise constante) couverts par aucun test. Ils sont la sortie la plus précieuse de cet audit — voir le tableau ci-dessous puis §4.

### ⚠️ Bugs réels détectés (à transformer en regression-guards)

Ces tests doivent être écrits pour **figer le comportement correct** ; ils seront ROUGES jusqu'à correction du moteur.

| # | Fichier (ligne) | Défaut | Test |
|---|---|---|---|
| B1 | `compilation/analyseur/analyseur.type.ts` (~52) | `ctxAnalyse.erreurs.push();` — **push vide** : un type à parent inconnu n'émet aucune erreur ; branche « couverte » mais inerte | T-analyseur-monde-08 |
| B2 | `models/compilateur/condition-multi.ts` (~25-31) | `toString()` : `for(...; index++){ …; index++ }` **double-incrémente** → pour 3 enfants, saute l'élément du milieu | T-conditions-11 |
| B3 | `utils/jeu/conjugaison.ts` (503/506) | `getRadical` cas 2 utilise `Notification.length` (API Web globale ≈ 1) au lieu de `infinitifSansSe.length` → radical vide pour le 2e groupe | T-langue-utils-pure-01 |
| B4 | `utils/jeu/conjugaison.ts` (369) | `getTerminaisonVerbe2eGroupe` lit `Conjugaison.er` au lieu de `Conjugaison.ir` → la table `Conjugaison.ir` est **morte** | T-langue-utils-pure-02 |
| B5 | `utils/jeu/commandeur.ts` (~267) | Copier-coller : bloc de refus CELA écrit `ceciRefuse = correspondCeci.concepts[0]` (devrait viser `celaRefuse`/`correspondCela`) ; risque de crash | T-commandeur-03 |
| B6 | `utils/jeu/commandeur.tour.ts` (~159) | Copier-coller : `executerPhaseFin` retire `discret` de **ceci** au lieu de **cela** dans le bloc CELA | T-tour-01 |
| B7 | `utils/jeu/actions-utils.ts` (~156) | Message « La combinaison de X et X » : `ceciCommande.intitule` utilisé **2×** au lieu de `…` puis `celaCommande.intitule` | T-actions-tactile-08 |
| B8 | `utils/jeu/abreviations.ts` (~76) | `(mots[0] === "l'" || mots[0] === "l'")` — **même littéral testé deux fois** : la variante apostrophe typographique espacée n'est probablement pas gérée | T-debogage-abreviations-09 |
| B9 | `utils/jeu/abreviations.ts` (~60-61) | Branche `s'` assigne le **même** préfixe `"m’ "` que `m'` (suspect) | T-debogage-abreviations-08 |
| B10 | `models/jeu/element-jeu.ts` (152/156) | `nbAffichageDescription` get/set utilisent `.find(…).nbAffichage` **sans `?.`** (contrairement à apercu/texte) → throw sur objet sans description | T-modeles-runtime-10 |
| B11 | `models/jeu/propriete-jeu.ts` (getDe) | Regex d'élision `/^(a|e|i|o|u|y)/i` ASCII → rate les voyelles accentuées initiales (`écu` → « de écu » au lieu de « d'écu ») | T-modeles-runtime-08 |

---

## 2. Quick wins (meilleur rapport valeur/effort)

Tests **unitaires purs** : import + assertion `input → output`, **aucune compilation de jeu** (pas de `TestUtils.genererEtCommencerLeJeu`). Démarrage instantané, déterministes, et chacun ferme un gros paquet de branches. À écrire en premier.

> Cette section est un **index par ID** ; le détail (esquisse, assertion, spec) figure dans la phase correspondante (§3).

| ID | Cible (fonction pure) | Fichier source (cov) | Pourquoi quick win |
|---|---|---|---|
| T-langue-utils-pure-03 | `Conjugaison.getGroupe` | conjugaison.ts (br35) | classification 1/2/3, prérequis de toute conjugaison |
| T-langue-utils-pure-04 | `Conjugaison.verbeDans2eGroupe` | conjugaison.ts (br35) | grosse regex liste-blanche + chemin null |
| T-langue-utils-pure-05 | `Conjugaison.verbeAvecAuxiliaireEtre` | conjugaison.ts (br35) | choix être/avoir (temps composés) |
| T-langue-utils-pure-06 | `Conjugaison.getParticipePasse` | conjugaison.ts (br35) | map irréguliers + 3 chemins réguliers |
| T-langue-utils-pure-07 | 1er groupe radicaux ger/yer/cer/eler/eter | conjugaison.ts (br35) | filet avant refactor de `getRadical` |
| T-langue-utils-pure-08 | `MotUtils.getPluriel` | mot-utils.ts (fn100/br80, 0 assert) | exceptions bijou/clou/pneu/feu/unités |
| T-langue-utils-pure-09 | `MotUtils.getSingulier` + `*Tete` | mot-utils.ts | singularisation + idempotence du mot de tête |
| T-langue-utils-pure-10 | `MotUtils.getFeminin` | mot-utils.ts | très nombreuses exceptions féminin |
| T-langue-utils-pure-11 | `MotUtils.getNombre`/`getQuantite`/`estFormePlurielle` | mot-utils.ts | déterminant → nombre/quantité |
| T-langue-utils-pure-12 | `StringUtils.getNombreEntierDepuisChiffresOuLettres` | string.utils.ts (br46) | 2 throw + table lettres + routage |
| T-langue-utils-pure-13 | `StringUtils.normaliserMot` + `normaliserReponse` | string.utils.ts (br46) | accents, déterminant, apostrophe U+2019 |
| T-langue-utils-pure-14 | `StringUtils.nomDeFichier/DossierSecurise*` | string.utils.ts (br46) | nommage sauvegardes/exports |
| T-langue-utils-pure-15 | `TableauUtils.listerTableau` | tableau-utils.ts (absent du rapport) | 3 branches FR de jointure, fichier jamais exercé |
| T-langue-utils-pure-16 | `PositionsUtils.positionsIdentiques`/`getObjetsQuiSeTrouventLa` | positions-utils.ts (br33/st22) | chemins null + warn-else |
| T-langue-utils-pure-17 | `TexteUtils.*` (4 fonctions) | texte-utils.ts (**100 % trompeur**) | st100 mais 0 assertion |
| T-langue-utils-pure-18 | `PhraseUtils.trouverDeterminant` | phrase-utils.ts (br47) | grande table switch déterminants |
| T-langue-utils-pure-19 | `PhraseUtils.separerListe*` (5 fonctions) | phrase-utils.ts (br47) | séparateurs et/ou + restauration guillemets + throw |
| T-langue-utils-pure-22 | `ClasseUtils.getIntituleNormalise` | classe-utils.ts (br92) | homme/femme→personne + fallback objet |
| T-compilation-pipeline-01 | `ExprReg.xNombre`/`xNombreEntier`/`xNombreDecimal` | expr-reg.ts (0 ref directe) | 007 rejeté, virgule décimale, exposant |
| T-compilation-pipeline-04 | `ExprReg.xActiverDesactiver`/`xAbreviation`/`xCommenceParUneVoyelle` | expr-reg.ts | élision (l'/le) partout |
| T-compilation-pipeline-05 | `Generateur.getOpposePosition` | generateur.ts (br72) | 12 branches, bidirectionnalité portes |
| T-compilation-pipeline-06 | `Generateur.getLocalisation` | generateur.ts | strip préfixe/suffixe + alias |
| T-conditions-01 | `PileConditionsUtils.compterChoixNiveauCourant` | pile-conditions-utils.ts (0 test direct) | saut de profondeur — raison d'être du fichier |
| T-conditions-02 | `PileConditionsUtils` — comptage Xe fois | pile-conditions-utils.ts | nbChoix + plusGrandFois |
| T-conditions-03 | `PileConditionsUtils.categoriser` | pile-conditions-utils.ts | si vs sinonsi, finsi/finchoix |
| T-conditions-04 | `StatutCondition` getters | statut-conditions.ts (0 assert) | pile vide/mixte, couvre aussi `CadreCondition` |
| T-memoire-temps-hasard-07 | `AleatoireUtils` déterminisme instantane/restaurer | aleatoire-utils.ts (**br0**) | pivot du replay `.sol`/`.rec` |
| T-cmdutils-01 | `CommandesUtils.enleverToursDeJeux` | commandes-utils.ts (fn100, 0 unit) | invariants critiques du replay/annuler |
| T-cmdutils-02 | `CommandesUtils.nettoyerCommande`/`commandesSimilaires` | commandes-utils.ts | normalisation espaces insécables |
| T-eju-03 | `ElementsJeuUtils.trouverDeterminantIndefini` | elements-jeu-utils.ts (br71) | table genre × nombre exhaustive |
| T-eju-06 | `ElementsJeuUtils.sommeQuantiteRessource` | elements-jeu-utils.ts | possède/disponible + illimité -1 |
| T-instruction-dire-01 | `BalisesHtml.convertirEnHtml` (tags forme) | balises-html.ts (fn100 trompeur) | 7 paires de remplacement, public-api |
| T-modeles-runtime-01 | `PositionObjet.getPrepositionSpatiale` | position-objet.ts (br90) | sur/sous/dans + synonymes + inconnu |
| T-modeles-runtime-02 | `Localisation.getLocalisation` + toString | localisation.ts (br33) | 12 directions + default throw |
| T-debogage-abreviations-01 | `Abreviations.direction` | abreviations.ts (br30) | 8 directions, statique pure, 100 % non assertée |

---

## 3. Plan priorisé par phases

**Note de priorisation.** Le champ `priority` des audits a été **repriorisé globalement**. P0 = le cœur du moteur sur ses branches les plus faibles et au plus fort rayon d'impact (résolution de commande, conditions, déclencheur, flux/état). On y a remonté les 1-3 tests les plus structurants de chaque sous-système nommé même quand leur bucket les classait P1/P2 (un fichier à `br0` comme `instruction-charger` justifie à lui seul un P0 d'amorçage). Colonnes : **Type** = nature du gap (`branch` = untested-branch, `unit` = untested-unit, `edge` = edge-case, `file` = untested-file/0 %, `guard` = regression-guard, `feat` = feature-no-spec).

### PHASE P0 — Cœur, branches faibles, fort impact

Les 8 sous-systèmes désignés P0 sont tous représentés : conditions-utils · instruction-changer · actions-utils · declencheur · commandeur · instruction-flux/charger/jouer-arreter · instruction-afficher.

#### P0 — conditions (conditions-utils.ts, pile-conditions-utils.ts)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-conditions-05 | `verifierConditionEst` — `est défini` / `n'est pas défini` (tous types + sujet indéfini) | conditions-utils.ts (br58) | branch | `new ConditionsUtils(jeu,false)` ; `siEstVrai('si a est défini',…)`, idem négation, idem sujet inexistant `zzz` | `a défini`→true, négation→false ; sujet absent→false, +négation→true ; 0 erreur | conditions.spec.ts (étendre) |
| T-conditions-01 | `PileConditionsUtils.compterChoixNiveauCourant` — saut de profondeur | pile-conditions-utils.ts (0 test direct) | unit | morceaux de `[au hasard]A[si…]B[ou]C[fin]D[ou]E[fin]F`.split(/\[\|\]/) ; appel index du `au hasard` | `nbChoix===2` (le `[ou]` imbriqué profondeur 2 ignoré) ; `plusGrandFois===-1` | pile-conditions-utils.spec.ts (créer) |
| T-conditions-02 | `PileConditionsUtils` — comptage `Xe fois` | pile-conditions-utils.ts | branch | morceaux de `[1ere fois]A[2e fois]B[3e fois]C[fin]` | `nbChoix===3`, `plusGrandFois===3` | pile-conditions-utils.spec.ts |
| T-conditions-03 | `PileConditionsUtils.categoriser` | pile-conditions-utils.ts | unit | `categoriser('si …')`, `'2e fois'`, `'au hasard'`, `'sinonsi …'`, `'sinon'`, `'ou'`, `'fin si'`, `'prix de ceci'` | ouverture / continuation / fermeture / inconnu corrects (piège `si` vs `sinon si`) | pile-conditions-utils.spec.ts |
| T-conditions-04 | `StatutCondition` getters (sommet/conditionDebutee/pileVisible) + `CadreCondition` | statut-conditions.ts (0 assert) | branch | pile vide ; puis push 2 `CadreCondition` (1 visible, 1 non) | vide→null/aucune/true ; mixte→sommet=dernier, type sommet, `pileVisible===false` | pile-conditions-utils.spec.ts |

#### P0 — declencheur (declencheur.ts, br33 — jamais instancié dans un spec)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-memoire-temps-hasard-01 | `Declencheur` — priorité élément exact (4000) > classe > générique | declencheur.ts (br33) | branch | objet pomme + `apres croquer un objet:` + `apres croquer la pomme:` ; jouer `croquer la pomme` | sortie contient `REGLE-EXACT.` et **pas** `REGLE-CLASSE.` (seul le meilleur score conservé) | F082-declencheur-priorite.spec.ts (nouveau) |
| T-memoire-temps-hasard-02 | `Declencheur` — inversion commutative ceci↔cela quand infinitif **non** précisé | declencheur.ts | branch | `apres une action impliquant la fiole et le creuset:` ; jouer `combiner le creuset avec la fiole` (ordre inverse) | `COMMUTATIF.` présent ; variante avec infinitif précisé + ordre inverse → **ne** se déclenche pas | F082-declencheur-priorite.spec.ts |

#### P0 — commandeur (commandeur.ts br64, elements-jeu-utils.ts br71)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-commandeur-01 | Désambiguïsation par découpe (`QcmDecoupe`) — 2 candidats même score | commandeur.ts (br64) | branch | action `donner ceci a cela` + 2 objets ; `donner couteau a fromage` | `commandeValidee===false`, `QcmDecoupe.Choix.length===2` ; re-soumettre `Reponse=0`→ validée | commandeur-desambiguisation.spec.ts (nouveau) |
| T-commandeur-02 | Correction verbe inconnu via verbe similaire (`QcmInfinitif`) | commandeur.ts | branch | `examinr la table` (faute) | `QcmInfinitif` propose `examiner` ; re-soumettre → validée + sortie d'examen | commandeur-desambiguisation.spec.ts |
| T-eju-01 | `calculerIntituleElement` — familles d'intitulé (intact/un vs familier/le ; pluriel des/les ; multiple) | elements-jeu-utils.ts (br71, plus gros puits) | branch | `[intitulé ceci]` avant/après `examiner` ; + objet multiple + quantité infinie | `une pomme`→`la pomme` ; multiple→`une` même familier ; infini→`des`/`les` | eju-intitule-element.spec.ts (nouveau) |

#### P0 — actions-utils (actions-utils.ts, br46 — 169/370 branches)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-actions-tactile-01 | `verifierCandidatCeciCela` — scoring sujet précis, bonus +500 si priorité (état) respectée | actions-utils.ts (br46) | branch | 2 objets même nom (`clef` ouverte/fermée), action `ceci est un objet prioritairement ouvert` | candidat retenu = la clef **ouverte** (+500) | F083-resolution-action-scoring.spec.ts (nouveau) |
| T-actions-tactile-02 | `verifierCandidatCeciCela` — élément du jeu (+125) prime sur concept ; invisible pénalisé (-1) | actions-utils.ts | branch | cible classe `un objet` + concept homonyme | élément du jeu retenu (score 225) vs concept (100) ; visible préféré à invisible | F083-resolution-action-scoring.spec.ts |
| T-debogage-abreviations-03 | `obtenirCommandeComplete` — guard `nombreDeMots==1` (g/n/i/z…) | abreviations.ts (br30, **chemin critique de chaque commande**) | branch | `g`→`repeter la derniere commande` ; `n`→`aller au nord` ; mais `g coffre`→`g coffre` (guard bloque) | expansion **uniquement** si commande à 1 mot | abreviations.mots.spec.ts (nouveau) |

> Note : `actions-utils` est le cœur P0 ; T-actions-tactile-01/02 montent en P0. Le reste de l'arbre de refus (`expliquerRefus*`) reste en P1. T-debogage-abreviations-03 est placé ici car `obtenirCommandeComplete` est sur le chemin critique de **toute** commande joueur (br30 trompeur : fn93 mais traversée non assertée).

#### P0 — instruction-afficher (instruction-afficher.ts, fn27/br29)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instruction-dire-06 | `executerAfficher` — `afficher l'écran` (principal/secondaire/temporaire/précédent) → `ChoixEcran` + interruption | instruction-afficher.ts (fn27/br29) | branch | action `afficher l'écran secondaire` | `ecran===ChoixEcran.secondaire`, `typeInterruption===changerEcran`, `interrompreBlocInstruction===true` | instruction.afficher.spec.ts (nouveau) |

#### P0 — instruction-flux / charger / jouer-arreter

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instructions-etat-flux-01 | `InstructionCharger.executerCharger` — sécurité du nom de fichier (refus) | instruction-charger.ts (**br0**) | branch | règle `charger le theme "mon thème.css".` (espace/accent) | `tamponErreurs` contient `Charger : le nom du fichier…` ; aucun `<link client-theme>` ajouté | instruction.charger.spec.ts (nouveau) |
| T-instructions-etat-flux-04 | `InstructionFlux.executerInterrompre` + `executerContinuer` (partie) | instruction-flux.ts (br19) | unit | `interrompre la partie.` puis `continuer la partie.` | après interrompre : `jeu.interrompu===true`, `debutInterruption` défini ; après continuer : `finInterruption` défini | instruction.flux.spec.ts (nouveau) |
| T-instructions-etat-flux-07 | `InstructionFlux.executerAnnuler` — annuler routine (splice `programmationsTemps`) + erreurs | instruction-flux.ts | branch | `executer la routine tic dans 5 s` puis `annuler la routine tic` ; aussi `annuler la routine` (sans nom) | `programmationsTemps` sans `tic` ; sans nom → erreur `veuillez spécifier le nom` | instruction.flux.spec.ts |
| T-instructions-etat-flux-26 | `InstructionJouerArreter.executerArreter` — `arreter l'action` (`arreterApresRegle`) | instruction-jouer-arreter.ts (br8) | branch | `avant prendre la braise: dire "Trop chaud !". arreter l action.` | action de base non exécutée (braise pas dans l'inventaire) + sortie `Trop chaud !` | instruction.jouer-arreter.spec.ts (nouveau) |

#### P0 — instruction-changer (instruction-changer.ts, br54 — 898 LOC, plus de branches absolues)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instructions-etat-flux-14 | `changerJoueur` — porter un objet (enfile/chausse/équipe) + `ne porte plus` | instruction-changer.ts (br54) | branch | casque enfilable ; `le joueur porte le casque` puis `ne porte pas le casque` | porter → états `porte`+`enfile`, en inventaire ; retirer → plus `porte`/`enfile` | instruction.changer-joueur.spec.ts (nouveau) |
| T-instructions-etat-flux-16 | `changerListe` — négation (`ne contient plus` nombre/intitulé/texte) | instruction-changer.ts | branch | liste scores [10,20] + liste trouvailles [bougie] ; `ne contient plus 10` / `ne contient plus la bougie` | les 3 branches A/B/C de retrait assertées | instruction.changer-liste.spec.ts (nouveau) |

#### P0 — aléatoire (aleatoire-utils.ts, br0 — pivot du replay déterministe)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-memoire-temps-hasard-07 | `AleatoireUtils` — déterminisme `instantane()`/`restaurer()` | aleatoire-utils.ts (**br0**) | unit | `init('graine')` ; tirer a,b ; `snap=instantane()` ; tirer c ; `restaurer(snap)` ; tirer c2 | `c2===c` ; `snap.compteur===2` ; `init` rejoué reproduit a,b | F083-aleatoire.spec.ts (nouveau) |

---

### PHASE P1 — Logique métier importante, branches d'erreur structurelles, utilitaires purs

#### P1 — analyseur (logique : control-flow, dispatch, routines)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-analyseur-logique-01 | `traiterInstructionSi` — sinonsi après sinon (`sinonsiSuitSinon`) | analyseur-v8.controle.ts (br68) | branch | règle avec `si:…sinon…sinonsi:…fin si` | message `code===CodeMessage.sinonsiSuitSinon` | analyseur-v8-controle-erreurs.spec.ts (nouveau) |
| T-analyseur-logique-03 | `traiterInstructionSi` — `fin choisir` ferme un bloc `si` (`finBlocDifferent`) | analyseur-v8.controle.ts | branch | `si:…fin choisir` dans une règle | `code===finBlocDifferent`, libellé « fin si manquant » | analyseur-v8-controle-erreurs.spec.ts |
| T-analyseur-logique-07 | `analyserPhrases` — `fin règle` sans routine (`finRoutinePasAttendu`) | analyseur-v8.ts (br63, point d'entrée) | branch | scénario `Le salon est un lieu.\nfin règle` | `code===finRoutinePasAttendu` | analyseur-v8-dispatch-erreurs.spec.ts (nouveau) |
| T-analyseur-logique-02 | `traiterInstructionSi` — double sinon | analyseur-v8.controle.ts | branch | `si:…sinon…sinon…fin si` | `code===sinonsiSuitSinon`, « sinon pas attendu ici » | analyseur-v8-controle-erreurs.spec.ts |
| T-analyseur-logique-04 | `traiterInstructionChoisir` — `fin si` ferme un bloc choisir | analyseur-v8.controle.ts | branch | `choisir…choix "oui":…fin si` | `code===finBlocDifferent`, « fin choisir manquant » | analyseur-v8-controle-erreurs.spec.ts |
| T-analyseur-logique-05 | `traiterInstructionChoisir` — instruction avant tout choix | analyseur-v8.controle.ts | branch | `choisir\n dire "orphelin".\n choix "oui":…` | `code===finBlocManquant`, « choix ou fin choisir attendu » | analyseur-v8-controle-erreurs.spec.ts |
| T-analyseur-logique-08 | `analyserPhrases` — `fin si` hors routine (`finBlocPasAttendu`) | analyseur-v8.ts | branch | `Le salon est un lieu.\nfin si` | `code===finBlocPasAttendu` | analyseur-v8-dispatch-erreurs.spec.ts |
| T-analyseur-logique-09 | `chercherEtTraiterInstructionSimpleOuControle` — `fin bloc inconnu` | analyseur-v8.instructions.ts (br62) | branch | `si:…fin tantque…fin si` | `code===finBlocInconnu` | analyseur-v8-controle-erreurs.spec.ts |
| T-analyseur-logique-10 | `validerNomRoutine` — nom = mot réservé (`nomRoutineInvalide`) | analyseur-v8.routines.ts (br74) | branch | `routine si:…fin routine` (vérifier `motsReservesRoutine` au préalable) | `code===nomRoutineInvalide` | analyseur-v8-routines.spec.ts (étendre F012) |
| T-analyseur-logique-11 | `traiterDefinition` — phrase non reconnue (`definitionAction` / « Définition attendue ») | analyseur-v8.definitions.ts (br82) | branch | `Le salon est un lieu.\nblork glop zzz.` | `code===definitionAction` | analyseur-v8-dispatch-erreurs.spec.ts |

#### P1 — analyseur (monde : attributs, capacité, position, propriété)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-analyseur-monde-01 | `testerPositionElement` — multi-positions relatives suivies | analyseur.position.ts (br57, 0 assert directe) | unit | `La foret se trouve au nord du chemin et au sud de l'abri.` | `erreurs` vide ; `positionString` ≥ 2, couvre nord/chemin + sud/abri | analyseur.position.spec.ts (étendre) |
| T-analyseur-monde-02 | `testerPositionElement` — « Par rapport à X, … au nord, au sud et à l'ouest » | analyseur.position.ts | branch | `Par rapport a la cabane, la foret se trouve au nord, au sud et a l'ouest.` | `positionString.length===3`, tous `complement==='cabane'` (branche `/par rapport/`) | analyseur.position.spec.ts |
| T-analyseur-monde-06 | `testerPronomDemonstratifTypeAttributs` — « C'est un `<type>` `<attributs>` » | analyseur.attributs.ts (br36, 0 assert) | unit | objet marteau + `C'est un outil lourd et solide.` | `classeIntitule==='outil'`, attributs ⊇ [lourd, solide] | analyseur.attributs.spec.ts (créer) |
| T-analyseur-monde-07 | `testerPronomPersonnelAttributs` — « Elle est `<attributs>` » + déduction genre | analyseur.attributs.ts | unit | objet clé + `Elle est rouillee et fragile.` | attributs ⊇ [rouillee, fragile] ; `genre===Genre.f` ; « Il est un outil » ne matche pas | analyseur.attributs.spec.ts |
| T-analyseur-monde-04 | `testerPourCapacite` — « Il permet de `<verbe>` `<complément>` » | analyseur.capacite.ts (**br0/3**) | file | objet couteau + `Il permet de couper le pain.` | `ResultatAnalysePhrase.capacite` ; `capacites.length===1` (verbe `couper`, complément `le pain`) | analyseur.capacite.spec.ts (créer) |
| T-analyseur-monde-09 | `AnalyseurElementPosition` — « Il y a N `<non-ressource>` ici » → `placementNonRessource` | analyseur.element.position.ts (br70) | edge | `La salle est un lieu.\nIl y a 5 cailloux ici.` | `placementNonRessource==='cailloux'` ; aucun objet `cailloux` créé | analyseur.position.spec.ts |
| T-analyseur-monde-03 | `testerPositionRelative` — élément concerné introuvable | analyseur.position.ts | edge | `Le phare se trouve au nord de la cabane.` (`phare` jamais défini) | `erreurs.length>0` (`nomElementCiblePasSupporte`) | analyseur.position.spec.ts |

#### P1 — compilation-pipeline (regex coeur, générateur, peuplerLeMonde, vérificateur)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-compilation-pipeline-01 | `ExprReg.xNombre`/`xNombreEntier`/`xNombreDecimal` | expr-reg.ts (0 ref) | unit | `'0'`,`'-3'`,`'3,5'`,`'007'`,`'1.5e3'` ; entier rejette `'3,5'` ; décimal rejette `'5'` | 007 et exposant rejetés ; virgule décimale acceptée ; décimal exige partie fractionnaire | expr-reg-nombres.spec.ts (nouveau) |
| T-compilation-pipeline-02 | `ExprReg.xConditionTirage` (6 groupes captures) | expr-reg.ts | branch | `'un tirage de deux chances sur trois réussit'` + variante chiffres/`échouent` | groupes 1/3/5 chiffres, 2/4/6 lettres, 7=réussit/échoue ; `'zéro'`→no-match | expr-reg-conditions.spec.ts (nouveau) |
| T-compilation-pipeline-03 | `ExprReg.xActionExecuterRoutine` (avec args / dans N temps) | expr-reg.ts | branch | `'routine sonner'`, `'la routine afficher avec le score'`, `'routine reveiller dans 3 secondes'`, avec+dans | g1=nom, g2=trailer args, g3=délai, g4=unité singularisée | expr-reg-instructions-routine.spec.ts (nouveau) |
| T-compilation-pipeline-05 | `Generateur.getOpposePosition` | generateur.ts (br72) | unit | est↔ouest, nord_est↔sud_ouest, nord_ouest↔sud_est, haut↔bas, intérieur↔extérieur, inconnu→inconnu | croisement diagonal exact, default=inconnu | generateur-localisation.spec.ts (nouveau) |
| T-compilation-pipeline-06 | `Generateur.getLocalisation` (parsing + default) | generateur.ts | branch | `'au nord'`,`'à l'est'`,`'en haut'`,`'dessous'`,`'dans'`,`'hors'`,`'nord-est'`,`'SUD'`,`'nulle part'` | strip préfixe/suffixe, casse, alias dessous=bas/hors=extérieur ; inconnu→inconnu | generateur-localisation.spec.ts |
| T-compilation-pipeline-07 | `appliquerDeclarationsEtats` — erreurs « déjà déclaré » (simple/bascule/groupe) | generateur.ts | branch | `fermé est un état.` ×2 ; bascule en conflit | erreurs « … est déjà déclaré » / « impossible de créer la bascule » | etats-creation-cascade.spec.ts (étendre F067) |
| T-compilation-pipeline-08 | `appliquerAttributsAvecNegation` — conseil bascule + erreur état inexistant | generateur.ts | branch | `le coffre est non ouvert.` ; `la fiole est non bidule.` | conseil « Plutôt qu'écrire non ouvert… » ; erreur « l'état bidule n'existe pas » | generateur-negation-attributs.spec.ts (nouveau) |
| T-compilation-pipeline-11 | `Verificateur.estFinRoutine` — « fin X n'est pas attendu ici » (mismatch) | verificateur.ts (br53) | branch | `action nager:…fin règle` | `erreurs` contient « Le fin règle n'est pas attendu ici » | compilateur-v8-verificateur.spec.ts (étendre F024) |
| T-compilation-pipeline-15 | `Generateur.getLieuID` — exact / préfixe-unique / préfixe-ambigu / absent | generateur.ts | unit | lieux minimaux ; `getLieuID(…, 'cuisine')`, `'grande'`, `'inexistant'`, `'salle'` (ambigu) | exact→id, préfixe unique→id, absent→-1, ambigu→-1 | generateur-getlieuid.spec.ts (nouveau) |

#### P1 — instruction-dire / afficher / balises-html

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instruction-dire-01 | `BalisesHtml.convertirEnHtml` — tags de forme | balises-html.ts (fn100 trompeur) | unit | `'{*gras*} {/ital/} {_soul_} {+import+} {-cmd-} {=barre=} {@code@}'` | HTML attendu (`<b>`, `<i>`, `<u>`, spans `t-important`/`t-commande`/`t-highlight`/`t-code-couleur`) | balises.html.spec.ts (étendre) |
| T-instruction-dire-02 | `ajouterBalisesHtml` — règles d'espace `{E}` | balises-html.ts | branch | `'Fin.{E}{E}Suite'`, `'mot{E}collé'`, `'Phrase !{E}Mot'` | collapse après ponctuation→1 espace ; `{E}` sans ponctuation→supprimé ; après `!`→espace | balises.html.spec.ts |
| T-instruction-dire-03 | `ajouterBalisesHtml` — strip `{N}/{U}/{P}` + apostrophe + demi-espace | balises-html.ts | branch | `'{N}{N}Texte{N}'`, `"l'eau c'est bon"`, `'Attention :'` | strip→`Texte` ; apostrophe U+0027→U+2019 ; demi-espace insécable avant `:` | balises.html.spec.ts |
| T-instruction-dire-04 | `ajouterBalisesHtml` — lien ligne `{L}NNN{L}` cliquable vs texte | balises-html.ts | branch | `'Erreur ligne {L}42{L}.'` avec `liensCliquables` true puis false | true→`<a … href="#L42">[42]</a>` ; false→`[42]` brut | balises.html.spec.ts |
| T-instruction-dire-07 | `executerAfficher` — branches d'erreur (image invalide, écran inconnu, cible non supportée) | instruction-afficher.ts (fn27) | edge | `afficher image 'mon image.png'` ; `afficher l'écran latéral` ; `afficher la pomme` | 3 messages d'erreur précis | instruction.afficher.spec.ts |
| T-instruction-dire-08 | `executerEffacer`/`effacerElement` — retrait objet/porte des voisins | instruction-afficher.ts | branch | `effacer la pomme` ; `effacer la porte rouge` ; `effacer l'écran` | pomme retirée de `jeu.objets` ; porte retirée des `voisins` ; écran→`@@effacer écran@@` | instruction.afficher.spec.ts |
| T-instruction-dire-09 | `calculerCrochetsConditions` — `[au hasard]/[ou]` (PRNG seedé) | instruction-dire.ts (br73) | branch | action `dire "[au hasard]rouge[ou]vert[ou]bleu[fin choix]"` ; **seeder `AleatoireUtils`** avant | sortie = exactement une branche ; graine fixée → `vert` (cf. dédup §5) | instruction.dire.conditions-imbriquees.spec.ts |
| T-instruction-dire-10 | `estConditionDescriptionRemplie` — erreurs inline `[ou hors hasard]`/orphelin | instruction-dire.ts | branch | `calculerTexteDynamique('[si vrai]a[ou]b[fin]')` ; `'[fin choix]'` seul | `tamponErreurs` contient `[ou] sans « au hasard »` ; orphelin signalé | instruction.dire.erreurs-crochets.spec.ts |
| T-instruction-dire-11 | `calculerCrochetsConditions` — `[fin]` manquant | instruction-dire.ts | edge | `calculerTexteDynamique('[si vrai]texte sans fin')` | retour contient `{+{/[fin manquant]/}+}` + `tamponErreurs` « cadre(s) resté(s) ouvert(s) » | instruction.dire.erreurs-crochets.spec.ts |
| T-instruction-dire-13 | `calculerBaliseListerDecrireContenu` — prépositions sur/sous | instruction-dire-contenu.ts (br69) | branch | support `table` + `[décrire objets sur la table]` ; support vide | `Dessus, il y a … pomme` ; vide→`rien de particulier dessus` ; idem `sous`/`dessous` | instruction.dire.lister-objets.spec.ts |
| T-instruction-dire-14 | `calculerBaliseApercu` — variante direction (`[aperçu ceci]` = lieu voisin) | instruction-dire-apercu-statut.ts (br52) | branch | jardin au nord, aperçu défini ; `observer le nord` → `[aperçu ceci]` | sortie contient l'aperçu du jardin ; lieu reçoit l'état `vu` | instruction.dire.apercu.spec.ts (nouveau) |

#### P1 — instructions-état-flux (changer, déplacer, flux, charger, système)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instructions-etat-flux-17 | `changerSynonymesDe` — remplacement **total** des synonymes | instruction-changer.ts (br54) | unit | `boite rouge` synonyme `coffre` ; `changer les synonymes de la boite rouge sont "caisse" et "malle".` | `caisse` fonctionne, `coffre` échoue ; synonymes == [caisse, malle] | instruction.changer-synonymes.spec.ts (nouveau) |
| T-instructions-etat-flux-19 | `changerActionsTactiles` — forme instruction « changer X a aussi Y comme action courante » | instruction-changer.ts | feat | `changer le bandit a aussi insulter comme action complémentaire.` | `actionsTactiles` ⊇ {typeListe secondaires, mode ajouter, [insulter], cible=bandit} | F062-interface-tactile.spec.ts (étendre) |
| T-instructions-etat-flux-10 | `executerDeplacer` — sorties d'erreur (sujet/destination introuvable) | instruction-deplacer-copier.ts (br55) | branch | `deplacer le tournevis vers la fusee` (inexistants) ; variantes | messages « ni le sujet ni la destination », « destination introuvable », « aucun objet ne porte… » | instruction.deplacer.spec.ts (nouveau) |
| T-instructions-etat-flux-11 | `executerDeplacerObjetVersDestination` — branches quantité (split/merge/suppr) | instruction-deplacer-copier.ts | branch | `les cinq pieces` dans coffre ; `deplacer trois pieces vers le joueur` puis `deux pieces` | split→3/2 ; merge→5 chez joueur, source effacée | instruction.deplacer.spec.ts |
| T-instructions-etat-flux-05 | `executerInterrompre/Continuer` — erreurs déjà/pas interrompue | instruction-flux.ts (br19) | edge | `interrompre` ×2 ; `continuer` hors interruption | « déjà interrompue » / « n'est pas interrompue » | instruction.flux.spec.ts |
| T-instructions-etat-flux-08 | `executerAttendre` — clamp > 10 secondes | instruction-systeme.ts (br42) | edge | `attendre 30 secondes` | `tamponErreurs` « 10 secondes maximum » ; `nbSecondesAttendre` clampé à 10 | instruction.systeme.spec.ts (nouveau) |

#### P1 — commandeur / elements-jeu-utils (recherche, bugs)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-commandeur-03 | `chercherParmiLesActions` — **BUG B5** refus CELA concept | commandeur.ts (br64) | guard | action `ouvrir ceci avec cela` ; `ouvrir cle avec courage` (concept) | refus cohérent mentionnant CELA, **sans exception** (`not.toThrow`) — révèle B5 | commandeur-refus-cela.spec.ts (nouveau) |
| T-tour-01 | `executerPhaseFin` — **BUG B6** objet familier perd `discret` | commandeur.tour.ts (br75) | guard | action `frotter ceci sur cela` ; 2 objets `discret` | cela perd `discret`, gagne `familier` — révèle B6 (cela garde discret à tort) | tour-phase-fin-familier.spec.ts (nouveau) |
| T-cmdutils-01 | `enleverToursDeJeux` — préservation des `d` + pop parallèle `horlogesSauvegarde` + default throw | commandes-utils.ts (fn100, 0 unit) | unit | `Sauvegarde` montée à la main (c/r/d/g + horloges) ; `enleverToursDeJeux(1,…)` | `d`/`g` préservés ; `horlogesSauvegarde` aligné par index ; type inconnu → `Error` | commandes-utils.spec.ts (nouveau) |
| T-eju-02 | `intituleEchoRessource` — variantes ressource (unité, quantité -1/1/N, liaison voyelle) | elements-jeu-utils.ts (br71) | unit | `eau`(litre), `pomme` ; quantités 2/-1/1/3 | `2 litres d'eau`, `les litres d'eau`, `1 pomme`, `3 pommes` | eju-intitule-ressource.spec.ts (nouveau) |
| T-eju-04 | `trouverCorrespondance` — `ces derniers` (pluriel) via `derniersElementIds` | elements-jeu-utils.ts | branch | action `relier ceci a cela` (cle, lampe) puis `tester ces derniers` | résout les 2 derniers éléments (QcmCeci sur 2 éléments) | eju-ce-dernier-pluriel.spec.ts (nouveau) |
| T-eju-05 | `resoudreReferenceLocalisee` — « les objets sur la table » | elements-jeu-utils.ts | unit | table+livre+tasse+chaise ; `resoudreReferenceLocalisee(GN 'objets','sur',…,'table')` | == [livre, tasse] (chaise exclue) ; tester aussi non-générique + ici=true | eju-reference-localisee.spec.ts (nouveau) |

#### P1 — actions-utils (arbre de refus)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-actions-tactile-03 | `verifierCandidatCeciCela` — fallbacks direction (75) / intitulé (50) | actions-utils.ts (br46) | branch | action `ceci est une direction` + `scruter le nord` ; action `ceci est un intitulé` sur mot libre | direction→localisation nord ; intitulé→résout au mot ; commande validée | F083-resolution-action-scoring.spec.ts |
| T-actions-tactile-04 | `obtenirRaisonRefusCommande` — verbe inconnu vs non-supporté vs similaire | actions-utils.ts | branch | `xyzzy` ; verbe du dictionnaire sans action ; `examinar` (≈examiner) | 3 messages distincts (vérifier `dictionnaireVerbes` + `ressemblanceMots`) | F083-refus-commande.spec.ts (nouveau) |
| T-actions-tactile-05 | `expliquerRefusTropOuTropPeuArguments` — 0/1/2 arguments | actions-utils.ts | branch | actions `astiquer ceci`/`sauter`/`combiner ceci avec cela` ; commandes mal-cardinalées | « il manque le complément » / « complément de trop » / « il manque un/les complément(s) » | F083-refus-commande.spec.ts |
| T-actions-tactile-06 | `expliquerRefusClasseOuEtatArgument` — argument mauvaise classe | actions-utils.ts | branch | action `ceci est un objet` ; `reparer Bob` (personne) ; variante 2-args pour `argumentUnique=false` | « n'est pas un objet » / « n'est pas une personne », nomme l'argument | F083-refus-commande.spec.ts |
| T-actions-tactile-08 | `obtenirRaisonRefusCommande` — combinaison refusée + **BUG B7** | actions-utils.ts | branch | 2 actions même infinitif/arité ; combinaison invalide | « La combinaison de … » contient les **deux** intitulés distincts (échoue tant que B7 non corrigé) | F083-refus-commande.spec.ts |

#### P1 — langue-utils (conjugaison — bugs ; mot-utils ; string ; phrase)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-langue-utils-pure-01 | `getRadical`/`getConjugaigonVerbeRegulier` (2e groupe) — **BUG B3** | conjugaison.ts (br35) | guard | `getConjugaigonVerbeRegulier('finir','ipr','3ps',false)` | `'finit'` (ROUGE jusqu'à fix de `Notification.length`) | conjugaison.spec.ts (nouveau) |
| T-langue-utils-pure-02 | `Conjugaison.ir` (table 2e groupe) — **BUG B4 / code mort par bug** | conjugaison.ts | dead/guard | après fix : `getConjugaigonVerbeRegulier('finir','ipr','3pp',false)` | `'finissent'` ; preuve que `Conjugaison.ir` redevient vivante | conjugaison.spec.ts |
| T-langue-utils-pure-03 | `Conjugaison.getGroupe` | conjugaison.ts | unit | manger→1, aller→3, finir→2, partir→3, prendre→3 | classification correcte (exception ER aller) | conjugaison.spec.ts |
| T-langue-utils-pure-05 | `Conjugaison.verbeAvecAuxiliaireEtre` | conjugaison.ts | branch | aller→true, manger→false, `laver` pronominal→true, `se laver`→true | DR&MRS-P-VANDERTRAMP + pronominaux | conjugaison.spec.ts |
| T-langue-utils-pure-06 | `Conjugaison.getParticipePasse` | conjugaison.ts | unit | prendre→pris, ouvrir→ouvert, manger→mangé, finir→fini | map irréguliers + 3 chemins réguliers | conjugaison.spec.ts |
| T-langue-utils-pure-08 | `MotUtils.getPluriel` | mot-utils.ts (0 assert) | branch | cheval→chevaux, tableau→tableaux, bijou→bijoux, clou→clous, pneu→pneus, feu→feux, souris→souris, km→km | toutes les exceptions | mot-utils.spec.ts (nouveau) |
| T-langue-utils-pure-09 | `getSingulier` + `getSingulierTete` + `getPlurielTete` | mot-utils.ts | unit | chevaux→cheval ; `points de vie`→`point de vie` ; `pommes de terre` idempotent | singularisation + idempotence tête | mot-utils.spec.ts |
| T-langue-utils-pure-11 | `getNombre`/`getQuantite`/`estFormePlurielle` | mot-utils.ts | branch | `les`→p, `du`→i, `cinq`→p ; `deux`→2, `des`→-1 ; `chats`/`choux-fleurs`→true | déterminant→nombre/quantité, composés pluriels | mot-utils.spec.ts |
| T-langue-utils-pure-12 | `StringUtils.getNombreEntierDepuisChiffresOuLettres` | string.utils.ts (br46) | branch | `'38'`→38, `'sept'`→7, `'le'`→1, `'zero'`→0 ; `'onze'` et tout-null → throw | 2 throw + table lettres + routage | string-utils.spec.ts (nouveau) |
| T-langue-utils-pure-13 | `normaliserMot` + `normaliserReponse` | string.utils.ts | unit | `'Les Épées'`→`epees` ; `'l'Œuf'`→`oeuf` ; null→`''` ; `'  "Oui"  '`→`oui` | minuscule+accents+déterminant+apostrophe U+2019 ; trim+guillemets | string-utils.spec.ts |
| T-langue-utils-pure-18 | `PhraseUtils.trouverDeterminant` | phrase-utils.ts (br47) | unit | `'au'`→`le `, `'de la'`→`la `, `'aux'`→`les `, `'de l''`→`l'`, `'à'`→null, `'mon'`→`le ` | mapping déterminant/contraction, prépositions nues→null | phrase-utils.spec.ts (nouveau) |
| T-langue-utils-pure-19 | `PhraseUtils.separerListe*` (intitulés/textes/nombres) | phrase-utils.ts | branch | `'a, b et c'`, `'a ou b'`, `''`, `'"a" ou "b"'`, `'1, 2 ou 3'`, `'1, x'` | découpe et/ou ; vide→[] ; guillemets restaurés ; nombres throw si non-numérique | phrase-utils.spec.ts |
| T-langue-utils-pure-20 | `PhraseUtils.trouverPropriete` (discrimination type) | phrase-utils.ts | unit | `'la description du sol'` ; `'le nombre de pièces de la maison'` ; `'… situé dans la cuisine'` | types `proprieteElement`/`nombreDeProprieteElement` ; locateur ré-attaché à l'épithète | phrase-utils.spec.ts |

#### P1 — mémoire-temps-hasard (déclencheur, liste, compteurs, aléatoire)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-memoire-temps-hasard-03 | `Declencheur` — `action quelconque` prepend avant / append après | declencheur.ts (br33) | branch | `avant une action quelconque:` + `apres une action quelconque:` ; jouer `avancer` | ordre : `AVANT-Q` < texte action < `APRES-Q` | F082-declencheur-priorite.spec.ts |
| T-memoire-temps-hasard-04 | `Liste` — transition `ListeMixte` (Texte+Nombre) + getter `valeurs` | liste.ts (br43) | branch | `new Liste('butin')` ; `ajouterTexte('"or"')` ; `ajouterNombre(5)` | `classe===ListeMixte` ; `valeurs.size===2` ⊇ {`"or"`,5} ; `taille===2` | F042-liste-unitaire.spec.ts (nouveau) |
| T-memoire-temps-hasard-06 | `Liste.decrire`/`enumerer`/`lister` — formats de sortie | liste.ts | unit | `ajouterTextes(['"alice"','"bob"','"charlie"'])` ; liste vide | `decrire()` finit par `.`, `enumerer()` sans `.`, `lister()` puces `{e}•{e}` ; vide→`(vide)`/`''` | F042-liste-unitaire.spec.ts |
| T-memoire-temps-hasard-08 | `AleatoireUtils` — gardes d'erreur (non init, min>max) | aleatoire-utils.ts (br0) | edge | `nombre()` sans init→throw ; `nombreEntierPositif(6,1)`→throw ; `(3,3)`→3 | messages d'erreur ; min===max→valeur fixe | F083-aleatoire.spec.ts |
| T-memoire-temps-hasard-09 | `CompteursUtils` — clamp quantité `augmente`/`diminue` | compteurs-utils.ts (br51) | branch | ressource 3 pièces ; `diminue de 5` ; ressource -1 (illimitée) ; `diminue` | plancher 0 (pas -2) ; -1 reste -1 | compteurs.spec.ts (étendre) |
| T-memoire-temps-hasard-10 | `intituleValeurVersNombre` — valeur depuis autre compteur / décimal | compteurs-utils.ts | branch | `score` + `bonus(7)` ; `augmente du bonus` ; `vaut 2,5` | score==7 (résolu via `trouverCompteurAvecNom`) ; 2,5→2.5 | compteurs.spec.ts |

#### P1 — modèles-runtime (écran, localisation, lieu, contexte-tour, bugs)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-modeles-runtime-01 | `PositionObjet.getPrepositionSpatiale`/`prepositionSpatialeToString` | position-objet.ts (br90) | branch | `'dans'`,`'à l'intérieur'`,`'sous le lit'`,`'dessus'`,`'sûr'`,`'derriere'` | synonymes mappés ; inconnu→`inconnu` ; toString inverse, `??` pour inconnu | position-objet.spec.ts (nouveau) |
| T-modeles-runtime-02 | `Localisation.getLocalisation` + toString | localisation.ts (br33) | branch | boucle sur les 12 `ELocalisation` ; `inconnu`→throw | singleton attendu / 12 directions ; default throw ; toString=`'nord'` etc. | localisation.spec.ts (nouveau) |
| T-modeles-runtime-03 | `Lieu.ajouterVoisin` (dedup triple) | lieu.ts (br43) | branch | ajouter voisin (id+loc+type) identique ×2 ; même id autre loc ; autre id | length 1 / 2 / 3 | lieu-voisins.spec.ts (nouveau) |
| T-modeles-runtime-04 | `ContexteEcran` — routage et priorité des écrans | contexte-ecran.ts (br28) | unit | ajouter principal/secondaire/temporaire ; `precedent` ; `ChoixEcran` inconnu | priorité temporaire>secondaire>principal ; temporaire RAZ ; précédent ferme temporaire ; inconnu→throw | contexte-ecran.spec.ts (nouveau) |
| T-modeles-runtime-10 | `ElementJeu.nbAffichageDescription` — **BUG B10** absence de `?.` | element-jeu.ts (fn71) | edge/guard | objet sans propriété `description` ; lire `nbAffichageDescription` | `apercu`/`nbAffichageApercu` OK (`?.`) mais `nbAffichageDescription` **throw** (fige B10) | element-jeu-accesseurs.spec.ts (nouveau) |
| T-modeles-runtime-14 | `ContexteTour` — `ajouterValeur`/`trouverValeur` + `formaterMessageErreur` | contexte-tour.ts (br53) | unit | `ajouterValeur('le score', v)` ; `trouverValeur('score')` ; erreur formatée | clé normalisée (déterminant retiré) ; message `{L}12{L}` + contexte « dire bonjour » + erreur | contexte-tour.spec.ts (nouveau) |

#### P1 — feature-lens (continuer l'action — control-flow non testé ; synonyme dispatch ; déclencheurs `ou`)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-feature-lens-01 | `continuer l'action` (bare) dans une règle avant — laisse passer | commandeur.tour.ts | feat | règle avant prendre : si pourrie refuser sinon `continuer l'action.` ; `prendre la pomme` | confirmation de prise (objet possédé), **pas** « Pomme pourrie » | F082-continuer-action.spec.ts (nouveau) |
| T-feature-lens-02 | `continuer l'action avant.` — sortie standard **précède** le texte de la règle après | commandeur.tour.ts | feat | règle après aller dans crypte : `continuer l'action avant.` puis `dire`. | `indexOf('crypte') < indexOf('murmure')` | F082-continuer-action.spec.ts |
| T-feature-lens-03 | `continuer l'action après.` — sortie standard **suit** le texte | commandeur.tour.ts | feat | règle après : `dire` puis `continuer l'action après.` | `indexOf('descendez') < indexOf('crypte')` | F082-continuer-action.spec.ts |
| T-feature-lens-05 | synonyme d'action — dispatch end-to-end | commandeur.ts | feat | `interpréter fouiller comme examiner.` + règle après fouiller ; `fouiller le coffre` | sortie « Vous fouillez le coffre. » (preuve du routage) | analyseur.synonymes.spec.ts (étendre F009) |
| T-feature-lens-06 | déclencheurs combinés `ou` — une règle, plusieurs déclencheurs | analyseur (regles) | feat | `apres donner l'anneau au roi ou donner l'anneau à la reine:` | les deux commandes produisent « Royaume sauvé. » | compilateur-v8.regles.spec.ts (étendre) |

#### P1 — debogage-abreviations (chemin critique commande)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-debogage-abreviations-01 | `Abreviations.direction` — 8 directions + variantes (ne/nw/sw/w) + passthrough | abreviations.ts (br30) | unit | `direction('n')`,`'ne'`,`'n-e'`,`'e'`,`'sw'`,`'w'`,`'nw'`,`'xyz'` | intitulés directionnels (apostrophe U+2019 est/ouest) ; inconnu inchangé | abreviations.direction.spec.ts (nouveau) |
| T-debogage-abreviations-05 | `obtenirCommandeComplete` — « le/la/les `<infinitif>` » → pronom accordé | abreviations.ts | branch | `'le prendre'`→`prendre ce dernier` ; `'la prendre'` ; `'les prendre'` ; `'le salon'` inchangé | insertion pronom + reste ; non-infinitif → inchangé | abreviations.pronoms.spec.ts (nouveau) |
| T-debogage-abreviations-06 | `obtenirCommandeComplete` — « l'`<verbe collé>` » (apostrophe droite ET U+2019) | abreviations.ts | branch | `"l'examiner"`, `'l'examiner'`, `"l'x"`, `"l'ouvrir le coffre"` | `examiner ce dernier` etc. (regex matchLApostrophe) | abreviations.pronoms.spec.ts |
| T-debogage-abreviations-07 | `obtenirCommandeComplete` — « lui/leur `<infinitif>` » | abreviations.ts | branch | `'lui parler'`→`parler avec ce dernier` ; `'lui montrer le coffre'`→`montrer le coffre à ce dernier` | sans arg→`avec <pronom>` ; avec arg→`<reste> à <pronom>` | abreviations.pronoms.spec.ts |
| T-debogage-abreviations-08 | `obtenirCommandeComplete` — préfixe réflexif `m'`/`s'` — **BUG B9** | abreviations.ts | guard | exécuter `"m'examiner"` et `"s'habiller"`, figer la sortie réelle | pin du réel ; documenter si `s'` duplique le préfixe `m'` (B9) | abreviations.pronoms.spec.ts |
| T-debogage-abreviations-13 | `Debogueur.deboguer` — fiche d'un LIEU (`afficherDetailLieu`) | debogueur.ts (fn35) | branch | jeu débogueur ; `deboguer cuisine` | sortie : titre, `_titre_`, `_contenu_`, liste la pomme | debogueur.inspection.spec.ts (nouveau) |
| T-debogage-abreviations-14 | `Debogueur.deboguer` — fiche COMPTEUR et LISTE | debogueur.ts | branch | `deboguer score` (compteur 5) ; `deboguer objets trouves` (liste) | `_valeur_`+5 ; `liste`+`_taille_` | debogueur.inspection.spec.ts |

---

### PHASE P2 — Compléments, edge-cases, branches résiduelles

#### P2 — analyseur (monde + logique, branches d'erreur résiduelles)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-analyseur-monde-05 | `testerPourCapacite` — verbe pronominal « se `<verbe>` » sans complément | analyseur.capacite.ts (br0) | branch | objet lit + `Il permet de se reposer.` | verbe=`se reposer`, complément=null | analyseur.capacite.spec.ts |
| T-analyseur-monde-10 | `testerDeclarationEtat` — groupe « X se contredisent » < 2 états | analyseur.etats.ts (br72) | edge | `solide se contredisent.` | erreur « au moins deux états » ; aucune déclaration | analyseur.etats.spec.ts |
| T-analyseur-monde-11 | `testerContenuListe` — pronom sans liste précédente | analyseur.liste.ts (br77) | edge | `dernierElementGenerique` = objet (pas liste) + `Il contient 1, 2 et 3.` | `aucun` ; erreur « doit faire référence à une liste » | analyseur.liste.spec.ts |
| T-analyseur-monde-12 | `AnalyseurUtils.trouverCorrespondance` — résolution pronom (il/celui-ci) | analyseur.utils.ts (br62) | branch | dernier élément `lampe` ; `trouverCorrespondance('il',…)` ; `'dragon'` | `il`→lampe (genre forcé m) ; absent→undefined | analyseur.utils.spec.ts (créer) |
| T-analyseur-monde-13 | `trouverPositionIciDedansDessusDessous` — « à l'intérieur » + garde auto-réf | analyseur.utils.ts | edge | coffre+or ; position `à l'intérieur` ; auto-réf coffre/coffre | pos définie complément coffre ; auto-réf→undefined + erreur « même nom » | analyseur.utils.spec.ts |
| T-analyseur-monde-14 | `enregistrerSurchargeParLieu` — base ≠ fond propre unique → refus | analyseur.fond.ts (br73) | edge | fond `sol` commun + `description du sol situé dans la cuisine` | `surchargesParLieu` vide ; erreurs > 0 | F059-fond.spec.ts (étendre) |
| T-analyseur-monde-15 | `construirePresence` — domaine filtré par état (« commune dans les lieux côtiers ») | analyseur.fond.ts | branch | fond `mer` + `Elle est commune dans les lieux cotiers.` | `presenceFond.portee==='partage'`, `tousLesLieux===false`, `etatDomaine==='cotier'` | F059-fond.spec.ts |
| T-analyseur-logique-06 | `traiterInstructionChoisir` — choisir libre + dynamique | analyseur-v8.controle.ts (br68) | branch | `choisir librement` ; `choisir parmi les couleurs disponibles` | libre→`TypeChoisir.libre` ; dynamique→message « pas encore pris en charge » | instruction.choisir.spec.ts (étendre F030) |
| T-analyseur-logique-12 | `obetenirConditionSoloDebut` — « la porte/sortie vers X » | analyseur.condition.ts (br85) | branch | `getConditionMulti("la porte vers le nord n'est pas ouverte")` | sujet `porte vers`/nord, verbe `est`, négation `pas`, complément `ouverte` | conditions.spec.ts (étendre F027) |
| T-analyseur-logique-13 | `obetenirConditionSoloDebut` — « aucun/un X pour/vers Y » | analyseur.condition.ts | branch | `getConditionMulti("aucune sortie pour le nord")` / `"une porte pour ceci"` | verbe `existe`, négation `aucune`/null | conditions.spec.ts |
| T-analyseur-logique-14 | `obetenirConditionSoloDebut` — fallback propriété « la taille de X atteint N » | analyseur.condition.ts | edge | `getConditionMulti("la taille du groupe d'accusés atteint 5")` | condition non nulle ; sujet `la taille`, verbe `atteint`, complément `5` | conditions.spec.ts |
| T-analyseur-logique-17 | `simplifierMorceauConditionMulti` — « mais bien » + erreurs « mais soit/ni » seuls | analyseur.condition.ts | branch | `"x est usé mais bien porté"` ; `"x est mais soit a"` ; `"…mais ni a"` | « mais bien »→négation retirée ; « mais soit/ni » seul→nbErreurs>0 | conditions.spec.ts |
| T-analyseur-logique-15 | `chercherDebut/FinInstructionControle`/`chercherFinBlocInconnu` | analyseur-v8.utils.ts (br74) | unit | Phrases `'si …:'`,`'fin choisir'`,`'fin tantque'`,`'fin si'` | `si`/`choisir` ; `fin tantque`→true, `fin si`→false | analyseur-v8-utils.spec.ts (étendre F013) |
| T-analyseur-logique-16 | `chercherEtiquetteParmiListe` & `chercherEtiquetteExacte` | analyseur-v8.utils.ts | unit | listes + `'cela:'`/`'cela'` ; `'autre choix:'` | respect `ObligatoireFacultatif` (deux-points obligatoires/facultatifs) | analyseur-v8-utils.spec.ts |

#### P2 — compilation-pipeline (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-compilation-pipeline-04 | `xActiverDesactiver`/`xAbreviation`/`xCommenceParUneVoyelle` | expr-reg.ts | unit | `'activer le mode debug'`, `'l'abréviation x correspond à'`, `'arbre'`/`'hibou'`/`'été'` | verbe+reste ; un seul token ; voyelle inclut accents/y mais pas h | expr-reg-divers.spec.ts (nouveau) |
| T-compilation-pipeline-09 | `peuplerLeMonde` — « Plusieurs lieux portent ce nom » | compilateur-commun-utils.ts (br66) | branch | `La forêt est un lieu.` ×2 | erreur « Plusieurs lieux portent ce nom : forêt » ; 2e non ajouté | compilateur-v8-analyser-scenario.spec.ts (étendre F021) |
| T-compilation-pipeline-10 | `peuplerLeMonde` — ressources du jeu : dossier non sécurisé / formulation | compilateur-commun-utils.ts | branch | `dossier mon dossier` (espace) ; `sont dans le placard` ; `dossier mon_dossier` (OK) | « ne peut contenir que… » / « utiliser la formulation » ; valide→0 erreur | peupler-monde-ressources-dossier.spec.ts (nouveau) |
| T-compilation-pipeline-12 | `forcerFermetureRoutine` — `reaction` et `simple` | verificateur.ts (br53) | branch | réaction non fermée ; routine simple non fermée | « fin réaction manquant » / « fin routine manquant » | compilateur-v8-verificateur.spec.ts (étendre F024) |
| T-compilation-pipeline-13 | `validerContinuation` — `[puis]` hors cadre fois/boucle/initialement | validateur-textes-dynamiques.ts (br90) | branch | `"[si le mur est sale][puis] sale[fin]"` | `motCleHorsCadre` « [puis] hors fois/boucle/initialement » | validateur-textes-dynamiques.spec.ts (étendre F051) |
| T-compilation-pipeline-14 | `validerPhrases` — reconstruction guillemets imbriqués | validateur-textes-dynamiques.ts | edge | `"[si le sac contient "or"] plein[fin]"` | crochets équilibrés → 0 message d'erreur structurelle (pas de faux positif) | validateur-textes-dynamiques.spec.ts |

#### P2 — instruction-dire (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instruction-dire-05 | `ajouterBalisesHtml` — fonts `{1..7}` / `{0..}` / image `@@image:@@` | balises-html.ts | branch | `'{1texte1} {0normal0}'` ; `'@@image:photo.png@@'` | `<span class="font-1">` ; `<img src=".../images/photo.png" …>` | balises.html.spec.ts |
| T-instruction-dire-12 | `calculerTexteDynamique` — retour-ligne auto (pas de `{N}` si fin par balise ; strip si vide) | instruction-dire.ts (br73) | branch | `'Fin de phrase.{i}'` ; `'[si faux]rien[fin choix]{N}'` | 1) ne finit pas par `{N}` ; 2) `{N}` retiré (texte vide) | texte.spec.ts (étendre) |
| T-instruction-dire-15 | `afficherStatut` — matrice genre × ouvert/fermé × verrouillable × ouvrable | instruction-dire-apercu-statut.ts (br52) | edge | boîte(f) fermée non-verr. ; coffre(m) verrouillé ; sac contenant ouvert non-ouvrable | « Elle est fermée mais pas verrouillée. Vous pouvez l'ouvrir. » / « Il est fermé et verrouillé. » / chaîne vide | texte-balises-exemples-wiki.spec.ts (étendre) |
| T-instruction-dire-16 | `recupererFicheAideSansTenirCompteDesAccents` — fallback aide via synonyme/sans accent | instruction-dire-apercu-statut.ts | branch | aide pour `examiner` ; demander l'aide via synonyme/casse différente | fiche retrouvée via synonyme normalisé ; sinon « pas de page d'aide » | texte-balises-exemples-wiki.spec.ts |

#### P2 — instructions-état-flux (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-instructions-etat-flux-02 | `executerCharger`/`executerDecharger` — sujet non supporté | instruction-charger.ts (br0) | branch | `charger le son "a.mp3"` ; `decharger le son` | « seul un thème peut être chargé/déchargé » | instruction.charger.spec.ts |
| T-instructions-etat-flux-03 | `chargerTheme` + `unload` — manipulation `<link id=client-theme>` | instruction-charger.ts | unit | `executerCharger(theme)` ; 2e thème ; `executerDecharger` | crée `<link client-theme>` ; 2e→href MAJ (pas de 2e link) ; décharger→supprimé | instruction.charger.spec.ts |
| T-instructions-etat-flux-06 | `executerCommencer` — nouvelle partie + erreur | instruction-flux.ts (br19) | branch | `commencer une nouvelle partie.` ; `commencer le combat.` | sortie `@nouvelle partie@` ; sujet non supporté→erreur | instruction.flux.spec.ts |
| T-instructions-etat-flux-09 | `executerTester` — chemin non-audio | instruction-systeme.ts (br42) | branch | `tester le combat.` (sujet ≠ audio) | « je sais uniquement tester l'audio » | instruction.systeme.spec.ts |
| T-instructions-etat-flux-12 | `executerDeplacer` — multi-objets (objets dans ceci) | instruction-deplacer-copier.ts (br55) | branch | coffre contenant 2 objets ; `deplacer les objets dans ceci vers ici.` | 2 objets dans le lieu courant, plus dans le coffre ; succès | instruction.deplacer.spec.ts |
| T-instructions-etat-flux-13 | `executerDeplacerObjetVersDestination` — MAJ états vers lieu vs joueur | instruction-deplacer-copier.ts | branch | amulette possédée ; `deplacer vers la cuisine` puis `vers le joueur` | vers lieu→plus `possede`/`porte`, `disponible` ; vers joueur→`present`,`possede`,`vu` | instruction.deplacer.spec.ts |
| T-instructions-etat-flux-15 | `changerJoueur` — possède objets dans/sur ceci (bulk) | instruction-changer.ts (br54) | branch | sac contenant 2 objets ; `le joueur possede les objets dans ceci.` | 2 objets en inventaire (possede), plus dans le sac | instruction.changer-joueur.spec.ts |
| T-instructions-etat-flux-18 | `changerConcept` — ajouter/retirer état + refus déplacement | instruction-changer.ts | branch | concept `justice` ; `est rendue` / `n'est plus rendue` / `est dans le coffre` | concept gagne/perd `rendue` ; déplacement→erreur « pas possible de déplacer un concept » | instruction.changer-concept.spec.ts (nouveau) |
| T-instructions-etat-flux-20 | `changerAffichageCompteur` — masquer + options sans titre/unité + option inconnue | instruction-changer.ts | branch | `affiché en bas à gauche sans titre` ; `n'est plus affiché` ; `sans zorglub` | `positionAffichage`/`sansIntitule` ; négation→undefined ; option inconnue→message | compteurs.spec.ts (étendre) |
| T-instructions-etat-flux-21 | `changerAffichageRessource` — (re)positionner et retirer du cartouche | instruction-changer.ts | branch | ressource argent ; `affiché en haut à droite sans intitulé` ; `n'est plus affiché` | `ressourcesAffichees` créée puis retirée | ressource-cartouche.spec.ts (étendre) |
| T-instructions-etat-flux-22 | `changerAffichageLieu` — afficher/masquer titre du lieu | instruction-changer.ts | branch | `changer le lieu est affiché dans le cartouche du bas.` ; négation | `afficherTitreLieu==='bas'` puis `'aucun'` | instruction.changer-affichage.spec.ts (nouveau) |
| T-instructions-etat-flux-23 | `changerProprieteSujet` — texte→lisible automatique en cours de partie | instruction-changer.ts | edge | lettre sans texte ; `changer le texte … est "…"` puis `""` | texte non vide→état `lisible` ; texte vide→`lisible` retiré | instruction.changer-propriete.spec.ts (nouveau) |
| T-instructions-etat-flux-24 | `changerElementJeu` — quantité à 0 supprime l'objet | instruction-changer.ts | edge | `trois fleches`(3) ; `diminue de trois` | `jeu.objets` ne contient plus l'objet | instruction.changer-propriete.spec.ts |
| T-instructions-etat-flux-25 | `executerVider` — vider l'inventaire | instruction-listes.ts (br63) | branch | joueur avec 2 objets ; `vider l inventaire.` | objets `position===null` ; inventaire vide | listes.spec.ts (étendre) |

#### P2 — commandeur (divers)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-commandeur-04 | `executerCommande` — commentaire auteur (`*`/`@`) | commandeur.ts (br64) | branch | `* note` ; `@ todo` | `commandeValidee===true` ; sortie `@@commentaire@@` | commandeur-divers.spec.ts (nouveau) |
| T-commandeur-05 | `executerCommande` — message de première incompréhension (exemples 1 seule fois) | commandeur.ts | branch | `xyzzy` puis `plugh` | 1er : « je n'ai pas compris » + « Voici des exemples » ; 2e : sans les exemples | commandeur-divers.spec.ts |
| T-cmdutils-02 | `nettoyerCommande`/`commandesSimilaires` | commandes-utils.ts (fn100) | unit | `'  prendre   la    cle  '` ; null ; `('prendre la cle','prendre cle')` | espaces normalisés/trim ; null géré ; déterminants ignorés | commandes-utils.spec.ts |
| T-eju-03 | `trouverDeterminantIndefini` — table genre × nombre | elements-jeu-utils.ts (br71) | unit | p→`des `, s/f→`une `, s/m→`un `, i/f voyelle→`de l'`, i/m consonne→`du ` | table complète + test voyelle | eju-determinant-indefini.spec.ts (nouveau) |
| T-eju-06 | `sommeQuantiteRessource` — scope possède/disponible + illimité (-1) | elements-jeu-utils.ts | unit | piles or (joueur 5, ailleurs 3) + bois ; illimité -1 | possede→5, disponible→3, -1→-1, []→0 | eju-somme-ressource.spec.ts (nouveau) |

#### P2 — langue-utils (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-langue-utils-pure-04 | `Conjugaison.verbeDans2eGroupe` | conjugaison.ts (br35) | branch | finir/reussir→true, partir→false, `''`/null→false | liste-blanche + chemin null | conjugaison.spec.ts |
| T-langue-utils-pure-07 | 1er groupe radicaux ger/yer/cer/eler/eter | conjugaison.ts | branch | manger→mange, placer→placent, appeler→appelle, jeter→jette | radicaux 1er groupe (filet avant refactor) | conjugaison.spec.ts |
| T-langue-utils-pure-10 | `MotUtils.getFeminin` | mot-utils.ts | branch | grand→grande, neuf→neuve, doux→douce, vieux→vieille, public→publique, gentil→gentille, benin→benigne, rouge→rouge | exceptions féminin | mot-utils.spec.ts |
| T-langue-utils-pure-14 | `nomDeFichierSecurise`/`nomDeDossierSecurise`/`…ExtensionForcee` | string.utils.ts (br46) | edge | `'mon jeu.djn'`→`monjeu.djn` ; `'a.b.c'`→undefined ; `'!!!'`→undefined | retire [^a-z0-9-_] ; 2+ points→undefined | string-utils.spec.ts |
| T-langue-utils-pure-15 | `TableauUtils.listerTableau` | tableau-utils.ts (absent du rapport) | file | null, [], ['a'], ['a','b'], ['a','b','c'] | `(non défini)`/`(vide)`/`a.`/`a et b.`/`a, b et c.` | tableau-utils.spec.ts (nouveau) |
| T-langue-utils-pure-16 | `PositionsUtils.positionsIdentiques`/`getObjetsQuiSeTrouventLa` | positions-utils.ts (br33/st22) | branch | positions égales/null ; objets au lieu 1 vs 2 | true si type+id+pre égaux ; `'ici'`→filtre ; autre→[] + warn | positions-utils.spec.ts (nouveau) |
| T-langue-utils-pure-17 | `TexteUtils.*` (4 fonctions) — **100 % trompeur** | texte-utils.ts (fn100/br100/st100, 0 assert) | unit | `'un {x}mot{x} ici'` ; `'avant [si x]milieu[fin si] apres'` ; espaces insécables ; guillemets | retire style/conditionnelles ; remplace insécables ; retire guillemets+trim | texte-utils.spec.ts (nouveau) |
| T-langue-utils-pure-21 | `PhraseUtils.extraireLocalisationReference` | phrase-utils.ts (br47) | edge | `'le sol situé dans la cuisine'` ; `'… situé ici'` ; `'le sol'` ; null | `{base,preposition,cible}` / `{base,ici:true}` / null | phrase-utils.spec.ts |
| T-langue-utils-pure-22 | `ClasseUtils.getIntituleNormalise` | classe-utils.ts (br92) | branch | `'Les Hommes'`/`'femme'`→`personne` ; `'Tables'`→`table` ; null/vide→`objet` | mapping + normalisation + singulier + fallback | classe-utils.spec.ts (nouveau) |

#### P2 — mémoire-temps-hasard / modèles-runtime (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-memoire-temps-hasard-05 | `Liste.retirerNombre`/`retirerTexte`/`contientNombre` — no-op sur liste mixte | liste.ts (br43) | guard | liste mixte ; `retirerNombre(3)` ; `contientNombre(3)` | no-op (taille inchangée) ; `contientNombre`→false (fige le no-op actuel) | F042-liste-unitaire.spec.ts |
| T-memoire-temps-hasard-11 | `ListeEtats.ajouterImplication` — propagation transitive (A⇒B, B⇒C ⇒ A⇒C) | liste-etats.ts (br52) | branch | `allumé implique chaud` + `chaud implique visible` ; allumer la torche | torche `visible` transitivement | etats-creation-cascade.spec.ts (étendre F067) |
| T-conditions-06 | `siEstVraiSansLien` — tirage : branches d'erreur (x>y, ≤0, formulation) | conditions-utils.ts (br58) | branch | `tirage à 5 chances sur 2` ; `tirage à beaucoup` ; `tirage vaut 3` | 3 messages d'erreur distincts ; aucune valeur aléatoire consommée | condition-tirage-reussir.spec.ts (étendre) |
| T-conditions-07 | tirage probabiliste déterministe via graine | conditions-utils.ts | branch | `init('graine')` ; `1 chance sur 1`→true ; `1 sur 1000000`→false | branche succès ET échec (cf. dédup §5) | condition-tirage-reussir.spec.ts |
| T-conditions-08 | `siEstVraiSansLien` — verbe `réagit/réagissent` | conditions-utils.ts | branch | gardien avec réaction vs caillou sans ; `si ceci réagit` | « réagit » vs « Aucune réaction » | conditions-reagit.spec.ts (nouveau) |
| T-conditions-09 | `getValeurCalendrier` — jour numérique + année | conditions-utils.ts | branch | horloge déterministe ; `le jour vaut 5` ; `l'année dépasse 2000` | branche numérique calendrier (mapping jours) | temps-exemples-wiki.spec.ts (étendre F068) |
| T-conditions-10 | `siEstVraiSansLien` — défauts « verbe pas supporté » (compteur, liste) | conditions-utils.ts | edge | `si le score contient 3` (verbe inadapté) | `ajouterErreurCondition` « verbe pas supporté » (2 types représentatifs) | conditions.spec.ts (étendre) |
| T-modeles-runtime-05 | `ContexteEcran.enrichisseurLiens` à l'ajout/remplacement | contexte-ecran.ts (br28) | branch | `enrichisseurLiens = h=>'['+h+']'` ; ajouter/remplacer/effacer | appliqué au contenu ajouté/remplacé ; pas sur chaîne vide | contexte-ecran.spec.ts |
| T-modeles-runtime-06 | `Evenement.toString` | evenement.ts (fn50) | unit | sans complément / +ceci / +ceci prép / +ceci+cela | reconstruit `sauter` / `prendre épée` / `aller vers nord` / `mettre clé dans coffre` | evenement.spec.ts (nouveau) |
| T-modeles-runtime-07 | `Intitule` — nom (normalisation), motsCles (lazy), toString | intitule.ts (br63) | unit | `'Épée Rouillée'` ; avec/sans GroupeNominal | nom normalisé ; toString fallback ; 2 branches motsCles | intitule.spec.ts (nouveau) |
| T-modeles-runtime-08 | `ProprieteJeu.getDe` (de/d') + **BUG B11** accent | propriete-jeu.ts (br25) | edge/guard | `'maison'`→`de ` ; `'arbre'`→`d'` ; `'écu'`→`de ` (B11) | élision ASCII ; fige `de écu` (regression-guard B11) | propriete-jeu.spec.ts (nouveau) |
| T-modeles-runtime-09 | `ProprieteJeu.toString` (4 variantes + default) | propriete-jeu.ts (fn33) | branch | `nombreDeClasseAttributs` (porte, ouvert) ; `inconnu` | `nombre de porte ouvert` ; default→`???!` | propriete-jeu.spec.ts |
| T-modeles-runtime-11 | `ElementJeu` — quantite/unite null-quand-absent + set crée la propriété | element-jeu.ts (fn71) | branch | objet sans propriété ; getter→null ; set 5 puis 9 | null absent ; set crée puis met à jour (2 branches) | element-jeu-accesseurs.spec.ts |
| T-modeles-runtime-12 | `Jeu.declenchementsFuturs` (calcul tempsMs) | jeu.ts (fn50) | unit | `ProgrammationTemps` durée 10000, 3s écoulées | `tempsMs` ≈ 6000-7000 ; liste vide si aucune | jeu-declenchements-futurs.spec.ts (nouveau) |
| T-modeles-runtime-13 | `LecteurAudio` — branches audio désactivé (jouer/arrêter) | lecteur-audio.ts (br27) | branch | `activerAudio=false` ; `jouer('son.mp3')` ; `arreter(false)` | `succes===false` + message « audio désactivé » (lecture réelle hors scope) | lecteur-audio.spec.ts (nouveau) |

#### P2 — feature-lens / abreviations-debogage (résiduel)

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-feature-lens-04 | `continuer l'action après.` sans `continuer` → remplacement total | commandeur.tour.ts | edge | règle après aller dans crypte : `dire "Cinématique."` seul | sortie « Cinématique. » mais **pas** la description du lieu | F082-continuer-action.spec.ts |
| T-feature-lens-07 | propriété personnalisée de type **TEXTE** : condition `est "valeur"` + affichage | conditions-utils.ts | branch | `Sa couleur est "bronze".` ; `si la couleur de ceci est "bronze"` + `[p couleur ceci]` | « C'est du bronze. » + « Teinte : bronze. » | proprietes-texte.spec.ts (nouveau) |
| T-feature-lens-08 | `[initialement]…[puis]…[fin]` — bascule intact→modifié après manipulation | instruction-dire-contenu.ts | branch | aperçu `[initialement]neuf[puis]froissé[fin]` ; regarder, prendre, regarder | « neuf » puis « froissé » (cf. dédup §5) | texte.spec.ts (étendre) |
| T-feature-lens-09 | `[au hasard]texte[ou]texte[fin]` — rotation texte sous graine | instruction-dire-contenu.ts | feat | action `dire "[au hasard]Pile.[ou]Face.[fin]"` ; graine fixée | séquence reproductible ; chaque rendu exactement Pile./Face. (cf. dédup §5) | hasard-exemples-wiki.spec.ts (étendre) |
| T-feature-lens-10 | « désactiver remplacement de la destination des déplacements » | param (à localiser) | feat | param + déplacement redirigé par une règle | param accepté (tamponErreurs vide) + désactive la redirection (**à grounder sur l'impl**) | regles-direction-deplacement.spec.ts (étendre) |
| T-debogage-abreviations-02 | `obtenirCommandeComplete` — `aller` + 2e mot direction abrégée | abreviations.ts (br30) | branch | `'a n'`→`aller au nord` ; `'aller ne'` ; `'a s-o'` | passe le 2e mot à `direction()` | abreviations.direction.spec.ts |
| T-debogage-abreviations-04 | `obtenirCommandeComplete` — abréviations scénario prioritaires sur builtin | abreviations.ts | branch | abréviation scénario `x`→`fouiller` ; `'x coffre'` | scénario bat le builtin (`x`→examiner) | abreviations.mots.spec.ts |
| T-debogage-abreviations-09 | `obtenirCommandeComplete` — **BUG B8** « l' » doublon ligne 76 | abreviations.ts | dead/guard | `'l' prendre'` (typographique + espace) | détermine si la voie pronom est prise (révèle B8) | abreviations.pronoms.spec.ts |
| T-debogage-abreviations-10 | `obtenirCommandeComplete` — « me/moi `<verbe>` » + « nouvelle partie »→« recommencer » | abreviations.ts | branch | `'me regarder'`→`regarder le joueur` ; `'nouvelle partie'`→`recommencer` | mapping me/moi + nouvelle-partie | abreviations.mots.spec.ts |
| T-debogage-abreviations-11 | `obtenirCommandeComplete` — « afficher aide `<sujet>` » insère « pour » | abreviations.ts | branch | `'aide prendre'` ; `'afficher aide prendre'` ; `'aide'` | « l'aide pour … » ; « l'aide » seul (normaliser doubles espaces) | abreviations.mots.spec.ts |
| T-debogage-abreviations-12 | `obtenirCommandeComplete` — `av/avancer`→`aller dedans`, corrections dedans/dehors | abreviations.ts | branch | `'av'`→`aller dedans` ; `'en dans le coffre'` ; `'sortir maintenant'` | corrections dedans/dehors | abreviations.mots.spec.ts |
| T-debogage-abreviations-15 | `Debogueur.deboguer` — erreurs (sujet introuvable + commande incomplète) | debogueur.ts (fn35) | edge | `deboguer licorne` ; `deboguer` sans sujet | « pas trouvé > aucune correspondance » ; « commande pas complète » | debogueur.inspection.spec.ts |
| T-debogage-abreviations-16 | `afficherDetailObjet` — objet dans inventaire / contenant (prépositions) | debogueur.ts | branch | livre sur table ; clé portée | « sur la table » ; « joueur » (inventaire) | debogueur.inspection.spec.ts |
| T-debogage-abreviations-17 | `deboguer` — correspondances multiples (length > 1) | debogueur.ts | branch | `grande boite` + `petite boite` ; `deboguer boite` | « 2 éléments trouvés » + les deux | debogueur.inspection.spec.ts |

---

### PHASE P3 — Faible valeur / défensif / investigation

À traiter en dernier (ou à ne pas traiter — pour plusieurs, le bon geste est *confirmer/supprimer* le code mort, pas écrire un test). Voir aussi §4 (code mort) et §5 (UI).

| ID | Cible | Source (cov) | Type | Esquisse | Assertion attendue | Spec |
|---|---|---|---|---|---|---|
| T-conditions-11 | `condition-multi.toString()` — **BUG B2** double-incrément | condition-multi.ts (br100 trompeur) | guard | `getConditionMulti('a vaut 1 et si b vaut 2 et si c vaut 3').toString()` | mentionne a, b ET c (`b` manquant aujourd'hui → révèle B2) | conditions.spec.ts (étendre) |
| T-memoire-temps-hasard-12 | `Declencheur` — type d'auditeur inconnu / cela seul (console.error) | declencheur.ts (br33) | edge | Auditeur de type hors {avant,apres,remplacer} ; événement cela-seul | console.error « type inconnu » / « pas sur cela uniquement » ; déclenchements vides | F082-declencheur-priorite.spec.ts |
| T-actions-tactile-09 | `scoreInfinitifExisteAvecCeciCela` — fallback accent-insensible + verbe similaire | actions-utils.ts (br46) | branch | action `pêcher ceci` ; `scoreInfinitifExisteAvecCeciCela('pecher',…)` | s1>0 (retrouvé malgré accent) ; verbe similaire→score>0 | F077-prepositions-action.spec.ts (étendre) |
| T-actions-tactile-07 | `expliquerRefusEtatElement` — états multiples (« visible et accessible ») | actions-utils.ts | branch | coffre invisible+inaccessible ; action `ceci est un objet visible et accessible` ; `crocheter le coffre` | branche `present`/`visible` (multi-états) | F083-refus-commande.spec.ts |
| T-actions-tactile-10 | `verbesAvecRegleCiblee` — type `remplacer` ciblant élément précis | verbes-elements-utils.ts (br86) | edge | `règle remplacer pousser le levier:` ; `listerGroupesVerbes(levier)` | groupe `pousser` → niveau `secondaire` | F062-interface-tactile.spec.ts (étendre) |
| T-analyseur-logique-18 | `ressembleInstruction` — code mort suspect (stub `return true`) | analyseur-v8.instructions.ts (fn67) | dead | grep des appelants | aucun appelant → supprimer ; sinon test de contrat (toujours true) | (investigation) |
| T-analyseur-logique-19 | `AnalyseurBetaInstructions.separerInstructions` — code mort | analyseur-beta.instructions.ts (absent du rapport) | dead | grep `AnalyseurBetaInstructions` = 0 appelant hors fichier | **aucun test** : supprimer le fichier (cf. §4a) | (suppression) |
| T-analyseur-logique-20 | `RegleBeta.intitule` & `ReactionBeta.intitule` — getters morts | regle-beta.ts / reaction-beta.ts (fn0/br0/st0) | dead | grep `new RegleBeta`/`new ReactionBeta` = 0 | **aucun test** : supprimer runtime, migrer le type (cf. §4a) | (suppression/migration) |
| T-modeles-runtime-15 | `inventaire.ts` — code mort suspect | inventaire.ts (fn0/st0) | dead | grep `new Inventaire` = 0 | **aucun test** : confirmer puis supprimer (cf. §4a) | (suppression) |
| T-eju-07 | `ElementsJeuUtils.possedeCapaciteActionCible` — match actionA/actionB (casse/espaces) + élément null | elements-jeu-utils.ts (br71) | unit | `possedeCapaciteActionCible(el,'ouvrir',null,'la porte')` ; actionB ; cible ≠ ; null | true si verbe∈{A,B} ET complément==cible (lowercase/trim) ; null→false sans crash | eju-capacite-action.spec.ts (nouveau) |
| T-ui-annexe-01 | `ApercuMondeComponent.construireArbreClasses` + `enfants()` | apercu-monde.component.ts (~0 fn) | unit | monde avec classes animal/chien/chat ; `ngOnChanges` | racines triées par nom ; `enfants(animal)===['chat','chien']` ; parent hors monde→racine | apercu-monde.component.spec.ts (nouveau) |
| T-ui-annexe-02 | `ApercuObjetComponent.etiquettes` | apercu-objet.component.ts (~0 fn) | unit | objet `ferme et verrouille` ; lire `etiquettes` | string[] des états actifs ; objet sans état→[] | apercu-objet.component.spec.ts (nouveau) |
| T-ui-annexe-03 | Specs visu-* triviaux → assertion de rendu réel | visu-objet/visu-lieu.component.ts (~0) | branch | TestBed + `@Input objet` ; `detectChanges()` | `nativeElement.textContent` contient le nom de l'objet/lieu | visu-objet/visu-lieu.component.spec.ts (étendre) |

---

## 4. Code mort suspecté / fichiers jamais exercés

⚠️ **Distinction critique.** « Absent du rapport de couverture » ≠ code mort. Une **interface TypeScript** ou un **DTO sans logique** n'a rien d'instrumentable : il est normal qu'il n'apparaisse pas dans le rapport, et il n'y a **rien à tester**. Plusieurs auteurs d'audit ont explicitement prévenu contre cette confusion.

### 4a. Code mort confirmé (ne pas tester — supprimer/migrer après vérification)

| Élément | Constat | Recommandation |
|---|---|---|
| `analyseur-beta.instructions.ts` (`AnalyseurBetaInstructions.separerInstructions`) | 0 appelant hors du fichier (grep récursif), **absent du rapport** = jamais chargé. Superseedé par `AnalyseurV8Controle` + `AnalyseurV8Instructions`. | **Supprimer le fichier** après confirmation. |
| `models/compilateur/regle-beta.ts` (`RegleBeta`) | Jamais instancié (`new RegleBeta` = 0). fn0/br0/st0. **MAIS** le *type* reste référencé (`jeu.regles: RegleBeta[]`, `contexte-separer-instructions.ts`). | Supprimer le **runtime** (constructeur + getter `intitule`) ; **migrer le type** vers v8/interfaces avant suppression du fichier. |
| `models/compilateur/reaction-beta.ts` (`ReactionBeta`) | Jamais instancié ; importé **comme type seulement**. Getter `intitule` mort. | Idem RegleBeta : supprimer runtime, migrer le type. |
| `models/jeu/inventaire.ts` (`Inventaire`) | fn0/br0/st0, **jamais construit** dans le moteur (2 champs, pas de logique). | Confirmer par grep `new Inventaire` puis **supprimer** la classe + son export. |
| `Verificateur.estNouveauBlocSecondaire` (verificateur.ts ~57-77) | Duplicata exact d'`estNouvelleRoutine`, jamais appelé (commenté dans `verifierRoutines`). | Supprimer la méthode. |
| `AnalyseurV8Instructions.ressembleInstruction` (~112-114) | Stub retournant **toujours true** ; contribue au fn67. | Confirmer 0 appelant (T-analyseur-logique-18) → supprimer ; sinon test de contrat avant refactor. |
| `Conjugaison.ir` (conjugaison.ts ~132-173) | **Code mort par bug B4** : `getTerminaisonVerbe2eGroupe` lit `Conjugaison.er`, donc la table `ir` n'est jamais lue. | **Corriger B4** (la table redevient vivante), puis T-langue-utils-pure-02 prouve qu'elle est consommée. |

### 4b. Branche fonctionnellement morte (à corriger, pas supprimer)

| Élément | Constat | Recommandation |
|---|---|---|
| `analyseur.type.ts` ~52 — `ctxAnalyse.erreurs.push();` | **Bug B1** : `push()` vide (no-op). La branche « parent inconnu » est *couverte* (br100) mais **inerte** : aucune erreur émise. Piège « couverture élevée non testée ». | T-analyseur-monde-08 *pin* le comportement actuel + FIXME ; corriger pour émettre l'erreur. |

### 4c. NE SONT PAS du code mort (interfaces / DTO / données vivantes — ne rien proposer)

| Élément | Pourquoi il est listé ici | Couverture honnête |
|---|---|---|
| `models/jouer/cadre-condition.ts` | DTO, instancié 5× dans `instruction-dire.ts`. Absent du rapport car aucune logique. | Couvert via T-conditions-04 (StatutCondition empile des CadreCondition). |
| `utils/jeu/instruction-handler.ts` | Simple **interface TS** (aucun code exécutable). | Rien à tester. |
| `models/jeu/regle-actions-tactiles.ts` | Interface TS + table de données vivante `RACCOURCIS_ACTIONS_TACTILES`. | Couvert via `ActionsTactilesUtils` (F062 T224/T227). |
| `models/jeu/element-liste-lecture.ts` | Data-holder construit par `LecteurAudio.jouerALaSuite` (chemin audio désactivé en test). fn0 normal. | Hors scope unitaire. |
| `utils/jeu/correspondance.ts` | Classe de données pure (champs + nbCor), fn100/br100/st100. | Rien à tester. |
| `gn-derivees.ts` (br0/4) | Gardes défensives `throw` au chargement du module ; helpers non exportés. | P3 acceptable non couvert (un export test-only pour gain quasi nul — **ne pas gonfler**). |
| `peuplerLeMonde` console.error « classe racine pas prise en charge » | Plausiblement inatteignable (classes racines connues traitées avant). | Ne pas inventer de test. |
| `forcerFermetureRoutine` default (throw type inconnu) | Non atteignable via DSL valide. | Ne pas forcer. |

---

## 5. Annexe UI (P3)

**Culture du repo confirmée : on teste le moteur, pas les composants.** Le lecteur (`lecteur.component.ts`, 3570 LOC, fn44) et le magnéto sont couverts par leurs specs dédiés (`enregistrement-rec*`, F056/F057/F058, F081) ; le reste du rendu est couplé à `ContextePartie`/`Jeu` compilé/timers → gros effort, faible ROI. `carte-scenario.component.ts` a un **% bas trompeur** : sa logique clé (débordement/troncature/toggle) est finement assertée (F060-T021/22/23) ; le reste est du SVG cosmétique. **Ne pas prioriser.**

**Composants sans aucun spec** (présentation pure, template-bound) : tous les `ui/apercu/*` (apercu-action, -condition, -element-generique, -instruction, -lieu, -propriete-jeu, -reaction, -regle, -sujet) et `ui/visualisation/*` (visu-detail-objet, visualisation). `visu-lieu`/`visu-objet` ont un spec **trivial** (`should create` seul). Aucun n'est code mort (tous référencés dans leurs modules).

**Seules 3 propositions à vrai ROI** (déjà en §3 P3) : T-ui-annexe-01 (`ApercuMondeComponent` — seule logique d'arbre déterministe, branche « parent hors monde → racine »), T-ui-annexe-02 (`ApercuObjetComponent.etiquettes`, getter pur), T-ui-annexe-03 (durcir les stubs `visu-*` triviaux par une assertion de rendu DOM via TestBed).

---

## 6. Annexe méthodologie + couverture par fichier

### 6a. Comment lire ce plan

- **`directlyAsserted`** = il existe une assertion qui décrit le contrat de la fonction (input→output, ou `CodeMessage`/état muté). C'est l'objectif.
- **« traversé incidemment »** = du code exécuté par un test d'intégration sans assertion sur sa logique propre → compte dans le `%` mais ne protège de rien.
- Pour le code **piloté par scénario** (analyseurs, instructions) non appelable en unitaire pur, le pattern (déjà utilisé par F012/F056) : compiler un scénario **malformé** via `CompilateurV8.analyserScenarioEtActions(sc, actions, true)` puis asserter `rc.messages` avec le **`CodeMessage` précis**. C'est ce qui transforme « traversé » en « asserté ».
- Pour les **fonctions pures** (langue-utils, regex, pile-conditions, getters de modèles) : import + assertion directe, **sans** compiler de jeu — c'est le sweet spot.

### 6b. Tableau de couverture — les ~40 fichiers les plus faibles

Valeurs issues des audits (`fn`/`br`/`st`). « ~0 » = quasi nulle ; « absent » = absent du rapport de couverture (jamais exercé).

| Fichier source | fn | br | st | Note |
|---|---|---|---|---|
| `utils/jeu/instruction-charger.ts` | 40 | **0** | 11 | aucune branche couverte |
| `utils/jeu/aleatoire-utils.ts` | 100 | **0** | 85 | br0 — pivot replay |
| `utils/compilation/analyseur/analyseur.capacite.ts` | 100 | **0** | 57 | « Il permet de » jamais exercé |
| `utils/jeu/instruction-jouer-arreter.ts` | 67 | **8** | 35 | audio non testable |
| `utils/jeu/instruction-flux.ts` | 56 | **19** | 30 | interrompre/annuler/commencer |
| `utils/commun/positions-utils.ts` | 33 | 33 | 22 | pures, non testées |
| `models/jeu/localisation.ts` | 100 | 33 | 77 | switch 12 cas + throw |
| `models/jeu/propriete-jeu.ts` | 33 | 25 | 46 | toString + getDe |
| `utils/jeu/instruction-afficher.ts` | 27 | 29 | 28 | écran + effacer |
| `utils/jeu/debogueur.ts` | 35 | 35 | 44 | afficherDetail* jamais assertés |
| `utils/jeu/conjugaison.ts` | 90 | **35** | 54 | 2e groupe cassé (B3/B4) |
| `utils/compilation/analyseur/analyseur.attributs.ts` | 100 | **36** | 64 | 0 assertion directe |
| `models/jouer/contexte-ecran.ts` | 50 | 28 | 46 | machine à états pure |
| `models/jeu/lecteur-audio.ts` | 50 | 27 | 43 | branches audio-off seules testables |
| `models/jeu/lieu.ts` | 100 | 43 | 89 | dedup ajouterVoisin |
| `models/jeu/liste.ts` | 83 | 43 | 48 | mixte/formats non assertés |
| `utils/jeu/instruction-changer.ts` | 87 | **54** | 56 | 898 LOC, + de branches absolues |
| `utils/jeu/instruction-deplacer-copier.ts` | 78 | 55 | 73 | quantité/états |
| `utils/jeu/instructions-utils.ts` | 87 | 55 | 71 | trouverCibleSpeciale |
| `utils/commun/string.utils.ts` | 67 | 46 | 48 | pure, 0 assertion directe |
| `utils/jeu/actions-utils.ts` | 83 | **46** | 58 | 169/370 branches — arbre de refus |
| `utils/compilation/analyseur/analyseur.position.ts` | 75 | **57** | 71 | 0 assertion directe |
| `utils/jeu/instruction-dire-apercu-statut.ts` | 64 | 52 | 47 | direction + matrice statut |
| `utils/jeu/liste-etats.ts` | 83 | 52 | 76 | transitivité implications |
| `utils/jeu/conditions-utils.ts` | 92 | **58** | 62 | **211 branches — plus gros trou** |
| `utils/jeu/instruction-dire-numerique.ts` | 81 | 58 | 78 | résiduel |
| `models/jouer/evenement.ts` | 50 | 58 | 93 | toString |
| `utils/jeu/instruction-systeme.ts` | 57 | 42 | 58 | clamp/tester |
| `utils/compilation/analyseur/analyseur-v8.ts` | 100 | **63** | 74 | dispatch racine |
| `models/jeu/intitule.ts` | 100 | 63 | 85 | motsCles lazy |
| `utils/jeu/instruction-dire-propriete.ts` | 67 | 62 | 62 | résiduel |
| `utils/jeu/commandeur.ts` | 74 | 64 | 62 | désambiguïsation |
| `utils/compilation/analyseur/analyseur-v8.instructions.ts` | 67 | 62 | 67 | dispatch instructions |
| `models/jouer/contexte-tour.ts` | 90 | 53 | 89 | valeurs + format erreur |
| `utils/compilation/compilateur-commun-utils.ts` | 100 | 66 | 85 | erreurs peuplerLeMonde |
| `utils/jeu/instruction-dire-format.ts` | 100 | 67 | 90 | résiduel |
| `utils/jeu/instruction-dire-contenu.ts` | 100 | 69 | 84 | prépositions sur/sous |
| `utils/compilation/generateur.ts` | 90 | 72 | 83 | 267/371 br — états/localisation |
| `utils/jeu/instruction-dire.ts` | 93 | 73 | 79 | 89 br — au hasard/erreurs |
| `utils/commun/elements-jeu-utils.ts` | 84 | 71 | 77 | 374/530 br — recherche/intitulé |
| `utils/jeu/declencheur.ts` | 89 | **33** | 52 | jamais instancié en spec |
| `utils/commun/tableau-utils.ts` | — | — | — | **absent** du rapport |
| `utils/commun/texte-utils.ts` | 100 | 100 | 100 | **100 % trompeur** (0 assertion) |
| `models/compilateur/condition-multi.ts` | 100 | 100 | 100 | **br100 trompeur** (toString bug B2) |
| `utils/jeu/pile-conditions-utils.ts` | 100 | 89 | 100 | 0 test direct (incident) |

---

## 7. Cross-références et dédoublonnage inter-tranches

Plusieurs propositions de tranches différentes touchent la même fonctionnalité — **un seul test à écrire**, croisé ici (ne pas dupliquer, ne pas non plus écarter une facette) :

- **`[au hasard]` (balise texte)** : T-instruction-dire-09 (cœur `calculerCrochetsConditions`, PRNG seedé) **≡** T-feature-lens-09 (vue fonctionnelle, rotation texte). Écrire **un** test seedé ; T-feature-lens-09 sert de cas wiki si besoin.
- **Déterminisme `AleatoireUtils`** : T-memoire-temps-hasard-07 + T-memoire-temps-hasard-08 (contrat snapshot/restore + gardes) sous-tend le **seeding** requis par T-conditions-07, T-instruction-dire-09, T-feature-lens-09. Écrire ces deux-là d'abord (ils fournissent l'infra), puis les autres s'appuient dessus.
- **`[initialement]…[puis]`** : T-feature-lens-08 (bascule intact→modifié au runtime) — distinct de F050 (`[1ère fois]`/`[puis]`, déjà couvert). Un seul test, dans `texte.spec.ts`.
- **Synonyme d'action** : F009 asserte l'**enregistrement** ; T-feature-lens-05 asserte le **dispatch end-to-end**. Complémentaires, pas redondants.

⚠️ **Faux jumeaux — NE PAS fusionner** : `Generateur.getLocalisation`/`getOpposePosition` (T-compilation-pipeline-05/06) et `Localisation.getLocalisation`/toString (T-modeles-runtime-02) sont **deux classes différentes** (`Generateur` statique de compilation vs modèle `Localisation`). Deux tests distincts, deux fichiers spec distincts.

---

## 8. Comment implémenter

### Conventions du repo (obligatoires)

- **Harnais intégration** : `TestUtils.genererEtCommencerLeJeu(scenario, verbeux=false)` compile un scénario DSL et démarre une partie ; piloter via `ctx.com.executerCommande(...)` ; asserter sur `sortie`, `ctx.jeu.tamponErreurs`, `ctx.jeu.tamponConseils`. (`TestUtils.genererLeJeu` pour obtenir le `Jeu` sans démarrer.)
- **`tamponConseils`** n'est rempli qu'en mode débogueur (exposé par `TestUtils`) — l'utiliser pour les tests de conseils auteur (T-compilation-pipeline-08).
- **Scénarios = template literals** (backticks), jamais de concaténation `'…' + '…'`.
- **Pas de chiffres dans les noms d'éléments** (regex parseur) : écrire en lettres (`trois fleches`, `compartiment sept`). Les chiffres de quantité (`Il y a 5 …`) sont OK.
- **Apostrophe U+2019** (`'`) dans les phrases françaises des scénarios et des assertions de sortie ; le **code source** reste en U+0027. ⚠️ Attention aux regex à apostrophe **en PowerShell**.
- **Verbes d'action à l'infinitif** er/ir/re ; jamais `action init:` mais `action initialiser:`.
- **Nommage des tests** : IDs `[F0XX-TNNN]` (F = groupe de fonctionnalité, T = séquence). Specs sous `webapp/donjon/projects/donjon/src/lib/tests/`.
- **Lancer un seul spec** (beaucoup plus rapide que la suite) :
  ```
  ng test donjon --include="**/<fichier>.spec.ts" --watch=false --browsers=ChromeHeadless
  ```

### ⚠️ Déconfliction des numéros F0XX

Les buckets ont proposé des numéros **en collision** : F082 (declencheur **et** continuer-action), F083 (actions-tactile **et** aléatoire **et** langue-utils). Le plus haut groupe **en usage** est F081. **Assigner des numéros canoniques au moment de l'implémentation** ; suggestion de répartition pour éviter les collisions :

| Sujet | Spec(s) | Numéro suggéré |
|---|---|---|
| Déclencheur priorité | F082-declencheur-priorite | F082 |
| Continuer l'action | F082-continuer-action | **F084** (renommer) |
| Scoring/refus action | F083-resolution-action-scoring, F083-refus-commande | F083 |
| Aléatoire | F083-aleatoire | **F085** (renommer) |
| Conjugaison/langue | conjugaison/mot-utils/string/phrase/tableau/positions/texte-utils | unitaires purs (pas de F0XX requis, ou **F086**) |

### Pièges d'implémentation signalés par les audits

1. **Vérifier les libellés exacts** (apostrophes typographiques, « guillemets », accents) **dans le source** avant d'écrire les regex/`toContain` d'assertion — les messages de refus sont **résolus/conjugués** avant d'atterrir dans `.sortie` ; ne **pas** coller les templates bruts. **Capturer la vraie sortie une fois**, puis ancrer sur le littéral plain-French stable.
2. **Vérifier les noms de membres** avant usage : `ResultatAnalysePhrase.pronomDemontratifTypeAttribut` (orthographe telle quelle), champs de `Capacite`, `Genre`, `PositionSujetString`, `EInstructionControle`, `ObligatoireFacultatif`, `ChoixEcran`, `PrepositionSpatiale`, `ELocalisation`.
3. **Bugs (B1-B11)** : écrire l'assertion sur le **comportement correct** → le test est ROUGE jusqu'au fix moteur (regression-guard). Pour B8/B9 (abréviations) et T-tour-01/T-commandeur-03 : **caractériser d'abord** (exécuter, figer le réel) car le comportement attendu n'est pas évident depuis le code seul.
4. **Re-soumettre une commande après QCM** : fixer `ctx…questions.QcmX.Reponse` puis `com.setCorrectionCommande(ctxPrecedent)` avant de ré-exécuter (mécanisme `correctionCommandeEnCours`).
5. **État statique partagé** (`AleatoireUtils.rand`, `HorlogeUtils`, `Declencheur` data) : `reinitialiser`/`reset` entre `it()` (cf. pattern `beforeEach HorlogeUtils.reinitialiser` de F057) pour éviter les fuites d'état.
6. **Données-dépendantes** (T-analyseur-logique-10 `motsReservesRoutine`, T-actions-tactile-04 `dictionnaireVerbes`/`ressemblanceMots`) : lire la source pour choisir un mot réellement présent, sinon le test atterrit silencieusement dans une autre branche.
7. **Audio = crash Karma headless** : ne **jamais** asserter une lecture audio réelle (cf. F062-T009). Cibler uniquement les branches non-audio (sécurité nom fichier, parsing en boucle/N fois, `arreter l'action`, `activerAudio=false`).
8. **`ContexteAnalyse` vs `ContexteAnalyseV8`** : les helpers de base prennent `ContexteAnalyse` (V8 en hérite) ; les messages structurés (`CodeMessage`) ne sont que sur V8 — adapter `erreurs[]` (string) vs `messages[]` (structuré).
9. **`inclure "X.djn"`** : résolution pré-compilation côté `lecteur.component.ts`, **non atteignable** via `TestUtils` (qui compile une string unique) — hors scope unitaire, à tester via un harnais dédié au resolver.
10. **T-feature-lens-10** (« désactiver remplacement de la destination ») : sketch comportemental **à grounder sur l'impl** (paramètre non lu) ; au minimum un test d'acceptation d'analyse (`tamponErreurs` vide) est sûr.

---

## 9. Vérification indépendante des bugs (Claude Code, 2026-06-20)

Les bugs signalés par l'audit ont été **recontrôlés directement dans le source** (relecture ligne à ligne). **8 sur 11 confirmés**, 3 non revérifiés (mais cohérents avec le même motif de copier-coller) :

| # | Statut | Constat sur le source |
|---|---|---|
| B1 | ✅ confirmé | `analyseur.type.ts:52` → `ctxAnalyse.erreurs.push();` (push **sans argument**). |
| B2 | ✅ confirmé | `condition-multi.ts:25-31` → `index++` dans l'en-tête **et** ligne 30 (double incrément) ; condition `length - 2` suspecte. |
| B3 | ✅ confirmé | `conjugaison.ts:503,506` → `Notification.length` (global navigateur ≈ 1) au lieu de `infinitifSansSe.length`. |
| B4 | ✅ confirmé | `conjugaison.ts:369` → `const tabTerminaison = Conjugaison.er;` dans `getTerminaisonVerbe2eGroupe` (devrait être `.ir`). |
| B5 | ⏳ à confirmer | `commandeur.ts` (~267) — non revérifié ; à caractériser à l'implémentation. |
| B6 | ⏳ à confirmer | `commandeur.tour.ts` (~159) — non revérifié ; à caractériser à l'implémentation. |
| B7 | ✅ confirmé | `actions-utils.ts:156` → `ceciCommande.intitule` utilisé **2×** (2e devrait viser `cela`). |
| B8 | ✅ confirmé | `abreviations.ts:76` → `mots[0] === "l'" || mots[0] === "l'"` (deux fois U+0027) ; la variante typographique `l’` (U+2019) n'est pas gérée, contrairement à `m'`/`m’` (l. 58). |
| B9 | ✅ confirmé | `abreviations.ts:60-61` → la branche `s’`/`s'` assigne le préfixe `"m’ "` (copier-coller depuis la branche `m'`). |
| B10 | ✅ confirmé | `element-jeu.ts:152,156` → `this.proprietes.find(x => x.nom == 'description').nbAffichage` **sans `?.`** → exception si pas de propriété `description`. |
| B11 | ⏳ à confirmer | `propriete-jeu.ts` (`getDe`) — fonction localisée (l. 112+) mais regex d'élision non inspectée ; à confirmer à l'implémentation. |

**Conséquence pratique** : prioriser les regression-guards des bugs **confirmés** (B1-B4, B7-B10) — comportement correct asserté, donc test ROUGE jusqu'au fix moteur.

### Calibration des propositions (spot-check Claude)

- **Cibles « code » (symboles nommés) = fiables.** Vérification : tous les symboles cités existent bien dans le source (`Conjugaison.getGroupe/verbeDans2eGroupe/getRadical/ir/getParticipePasse`, `Commandeur.executerCommande/essayerLaCommande/chercherParmiLesActions`, `AnalyseurV8Controle.traiterInstructionSi/Choisir`, `MotUtils.getPluriel`…). Les propositions des 13 tranches « code » sont donc bien ancrées.
- **⚠️ Étiquette `feature-no-spec` (tranche feature-lens) à relire — sur-estimée.** Spot-check : les features visées ont **déjà des specs proches** (`continuer l'action` → `analyse.instructions.spec` ×4 ; `[au hasard]` → `validateur-textes-dynamiques` ×5 ; `synonyme d'action` → `analyseur.synonymes` ×62 + `synonymes-auto` ×45 ; `[initialement]` → `jeu-de-base`/`F080`). Les propositions T-feature-lens-* ciblent vraisemblablement un comportement **plus fin** (ordre d'affichage runtime avant/après, dispatch bout-en-bout du synonyme) souvent **non asserté**, mais la mention « aucun spec » est trop forte. **Avant d'implémenter un T-feature-lens-*, grep le spec voisin** : s'il couvre déjà le cas, requalifier en `edge-case`/`untested-branch` ou abandonner. Risque de doublon réel sur ce lot uniquement.

