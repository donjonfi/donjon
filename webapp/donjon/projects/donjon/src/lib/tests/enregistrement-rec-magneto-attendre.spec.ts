import { ElementRef } from "@angular/core";

import { FichierEnregistrement, LecteurComponent } from "../../public-api";
import { TypeInterruption } from "../models/jeu/interruption";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

/**
 * Magnéto — bypass d'`attendre touche` pendant le replay.
 *
 * Symptôme reporté : « quand j'ai une commande [qui contient] attendre touche,
 * le magnéto est sensé afficher directement ce qui suit, or ici il attend qu'on
 * clique sur Suivant ».
 *
 * Couvre 3 cas :
 *   T001 — c: dont le corps contient `attendre touche` ;
 *   T002 — c: déclenche une règle après qui contient `attendre touche` ;
 *   T003 — d: (routine forcée par l'enregistrement) qui contient `attendre touche`.
 */
describe("Enregistrement (.rec) — magnéto : bypass d'attendre touche", () => {

  const lecteursCreés: any[] = [];
  afterEach(() => {
    while (lecteursCreés.length) {
      const l = lecteursCreés.pop();
      l.enregistrementActif = false;
      l.enregistrementEnCours = null;
    }
  });

  function instancierLecteur(jeu: any, fichier?: FichierEnregistrement): LecteurComponent {
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement("div")));
    lecteur.jeu = jeu;
    spyOn(lecteur as any, "scrollSortie");
    spyOn(lecteur as any, "focusCommande");
    spyOn(lecteur as any, "definirIFID");
    spyOn(lecteur as any, "verifierChrono");
    spyOn(lecteur as any, "verifierTamponErreurs");
    spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques");
    if (fichier) {
      (lecteur as any).enregistrementEnCours = fichier;
      (lecteur as any).enregistrementEnAttente = true;
    }
    lecteur.ngOnChanges({});
    lecteursCreés.push(lecteur);
    return lecteur;
  }

  // ============================================================
  //  T001 — action qui contient `attendre touche`
  // ============================================================

  it("[F050-MAG-ATT-T001] c: action contient `attendre touche` : replay auto-bypass, pas d'interruption pendante après Pas suivant", () => {
    const scenario = `La salle est un lieu.
action tester:
  dire "Premiere partie.".
  attendre touche.
  dire "Deuxieme partie apres touche.".
fin action
` + actions;

    // Recording : simuler un utilisateur qui exécute « tester » puis presse une touche.
    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "tester";
    (lecteurRec as any).validationCommande();
    // Après validationCommande, attendre touche devrait être pendant → bypass via helper.
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    // Sanity : l'étape c:tester capturée ; la sortie contient les 2 parties.
    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "tester");
    expect(etapeC).withContext("c:tester capturée").toBeDefined();
    expect(etapeC!.sortie ?? "").withContext("sortie c:tester doit contenir première partie").toContain("Premiere partie");
    expect(etapeC!.sortie ?? "").withContext("sortie c:tester doit contenir post-touche (bypass déjà fait au recording)").toContain("Deuxieme partie");

    // Replay
    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant(); // joue c:tester

    expect(lecteur.magnetoDivergence)
      .withContext("aucune divergence : le bypass doit produire la même sortie qu'au recording")
      .toBeNull();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext("attendre touche doit avoir été auto-consommée par le magnéto")
      .not.toBe(TypeInterruption.attendreTouche);
  });

  // ============================================================
  //  T002 — règle après qui contient `attendre touche`
  // ============================================================

  it("[F050-MAG-ATT-T002] c: déclenche règle après contenant `attendre touche` : replay auto-bypass", () => {
    const scenario = `La salle est un lieu.
La bille est un objet vu ici.
règle après prendre la bille:
  dire "Touche pour continuer.".
  attendre touche.
  dire "La suite.".
fin règle
` + actions;

    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "prendre bille";
    (lecteurRec as any).validationCommande();
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "prendre bille");
    expect(etapeC).withContext("c:prendre bille capturée").toBeDefined();

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence)
      .withContext("aucune divergence sur c:prendre bille")
      .toBeNull();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext("attendre touche dans règle après doit être bypassé")
      .not.toBe(TypeInterruption.attendreTouche);
  });

  // ============================================================
  //  T003 — étape d: (routine forcée via .rec) contenant `attendre touche`
  //  Cas le plus problématique : sans le fix, executerEtapeDeclenchement
  //  laisse l'attendreTouche pendante en fin d'étape → magnéto figé.
  // ============================================================

  it("[F050-MAG-ATT-T003] étape d: routine forcée contenant `attendre touche` : replay auto-bypass", () => {
    // Bug : `executerEtapeDeclenchement` n'appelait pas
    // `terminerInterruptionsBloquantesPourMagneto` après `traiterProchaineRoutine`.
    // Conséquence : une routine programmée (chrono, post-action) déclenchée pendant
    // le replay laissait son `attendre touche` pendant → le magnéto se retrouvait avec
    // `interruptionEnCours = attendreTouche` en fin de Pas suivant, et l'utilisateur
    // devait cliquer Suivant pour avancer (alors que la sortie attendue stockée dans
    // l'étape d couvre déjà le post-touche).
    const scenario = `La salle est un lieu.
routine routine_attente:
  dire "Routine debut.".
  attendre touche.
  dire "Routine fin.".
fin routine
` + actions;

    // .rec : c:attendre est jouée en premier (pour sortir de l'intro), puis d:routine_attente
    // est forcée. La sortie attendue de la d: couvre la totalité (pre + post touche).
    const fichier = Object.assign(new FichierEnregistrement(), {
      type: 'enregistrement',
      version: 1,
      scenario: '',
      graine: 'g',
      declenchementsFuturs: [],
      sortieIntro: '',
      etapes: [
        { type: 'g', valeur: 'g' },
        { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
        { type: 'd', valeur: 'routine_attente', sortie: 'Routine debut.{N}Routine fin.{N}' },
      ],
    }) as FichierEnregistrement;

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant(); // c:attendre (sort de l'intro)
    lecteur.magnetoPasSuivant(); // d:routine_attente (live)

    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext("attendre touche d'une routine forcée doit être auto-consommée — sinon Suivant requis")
      .not.toBe(TypeInterruption.attendreTouche);
  });

  it("[F050-MAG-ATT-T005] c: avec attendre touche en milieu d'action : la chute (continuation) doit apparaître à l'écran après le bypass", () => {
    // Reproduit la plainte utilisateur :
    //   > raconter une blague
    //   Voici une blague :
    //   Un geek ne s'ennuie pas…
    //   Appuyez sur une touche…
    //   > x boussole          ← la CHUTE manque entre ces 2 lignes
    // Cause potentielle : terminerInterruption(undefined) appelée par le bypass ne ré-injecte
    // pas la suite à l'écran (alors qu'elle l'ajoute bien à derniereSortieEnregistree).
    const scenario = `La salle est un lieu.
La boussole est un objet vu ici.
action raconter:
  dire "Voici une blague :".
  dire "Un geek ne s'ennuie pas...".
  attendre touche.
  dire "Il a un programme charge !".
fin action
` + actions;

    // Recording côté production : utilisateur exécute la commande puis presse une touche
    // (équivalent fonctionnel : terminerInterruption(undefined) qui résout l'attente).
    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "raconter";
    (lecteurRec as any).validationCommande();
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "raconter");
    expect(etapeC!.sortie ?? "").withContext("recording : la chute fait partie du sortie de c:raconter")
      .toContain("Il a un programme charge");

    // Replay
    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence).withContext("aucune divergence").toBeNull();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext("attendre touche bypassée")
      .not.toBe(TypeInterruption.attendreTouche);

    // L'écran de jeu doit contenir la chute post-touche.
    const ecran = (lecteur as any).partie.ecran.ecran as string;
    expect(ecran).withContext("la chute doit être visible à l'écran après le bypass de l'attendre touche")
      .toContain("Il a un programme charge");
  });

  it("[F050-MAG-ATT-T006] flux utilisateur : raconter (avec touche) puis x boussole — chute visible AVANT le 2e prompt", () => {
    // Reproduit fidèlement le rapport utilisateur :
    //   > raconter une blague   → "Voici" + "Un geek" + "Appuyez..." + CHUTE
    //   > x boussole            ← le « > x boussole » ne doit PAS arriver avant la chute
    const scenario = `Le carrefour est un lieu.
La boussole est un objet vu ici.
Sa description est "Une boussole tordue.".
action raconter:
  dire "Voici une blague :".
  dire "Un geek ne s'ennuie pas...".
  attendre touche.
  dire "Il a un programme charge !".
fin action
` + actions;

    // Recording réaliste (raconter + touche + x boussole).
    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "raconter";
    (lecteurRec as any).validationCommande();
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto(); // = touche utilisateur
    (lecteurRec as any).commande = "x boussole";
    (lecteurRec as any).validationCommande();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    // Replay
    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant(); // c:raconter
    lecteur.magnetoPasSuivant(); // c:x boussole

    expect(lecteur.magnetoDivergence).withContext("aucune divergence sur les 2 étapes").toBeNull();

    // Vérification clé : la chute doit apparaître AVANT « > x boussole » dans le contenu de l'écran.
    const ecran = (lecteur as any).partie.ecran.ecran as string;
    const idxChute = ecran.indexOf("Il a un programme charge");
    const idxXBoussole = ecran.indexOf("&gt; x boussole");
    const idxXBoussoleAlt = ecran.indexOf("> x boussole");
    const idxCmd2 = idxXBoussole >= 0 ? idxXBoussole : idxXBoussoleAlt;

    expect(idxChute)
      .withContext(`la chute doit être présente à l'écran. Contenu écran : ${ecran.slice(0, 800)}`)
      .toBeGreaterThanOrEqual(0);
    if (idxCmd2 >= 0) {
      expect(idxChute)
        .withContext("la chute doit précéder l'affichage de la commande suivante")
        .toBeLessThan(idxCmd2);
    }
  });

  // ============================================================
  //  T007 — `@@attendre touche@@` INLINE dans un dire (sortie utilisateur ressources/magneto_blague.djn)
  //  Mécanisme différent : split de la sortie via resteDeLaSortie (pas une vraie interruption).
  // ============================================================

  it("[F050-MAG-ATT-T007] dire contenant `@@attendre touche@@` inline : la chute doit s'afficher en magnéto (sans clic Suivant)", () => {
    // Reproduit exactement ressources/scenarios/tests/magneto_blague.djn + .rec.
    // Le `@@attendre touche@@` est un marqueur INLINE dans la string du dire — ce N'EST PAS
    // l'instruction `attendre touche.` (qui crée une interruption). C'est traité via
    // resteDeLaSortie / afficherSuiteSortie côté lecteur. Mon bypass via
    // terminerInterruptionsBloquantesPourMagneto ne couvrait pas ce mécanisme.
    const scenario = `le cirque est un lieu.
la clé est un objet ici.

action blaguer:
  dire "Quel est le comble pour un chien??@@attendre touche@@Faire wouaf!".
fin action
` + actions;

    // .rec capturé tel quel par l'utilisateur (cf. ressources/scenarios/tests/magneto_blague.rec).
    const fichier = Object.assign(new FichierEnregistrement(), {
      type: 'enregistrement',
      version: 30800,
      declenchementsFuturs: [],
      graine: '0.06410838060696855',
      etapes: [
        { type: 'g', valeur: '0.06410838060696855' },
        { type: 'c', valeur: 'x clé', sortie: 'C’est une clé.{N}' },
        { type: 'c', valeur: 'blaguer', sortie: 'Quel est le comble pour un chien??@@attendre touche@@Faire wouaf!{N}' },
        { type: 'c', valeur: 'x clé', sortie: 'C’est une clé.{N}' },
      ],
      sortieIntro: '{_{*Le cirque*}_}{n}Vous êtes dans le cirque.{N}{U}Vous apercevez une clé.{N}{P}Il n’y a pas de sortie.{N}',
    }) as FichierEnregistrement;

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant(); // c:x clé
    lecteur.magnetoPasSuivant(); // c:blaguer — produit la blague + chute

    expect(lecteur.magnetoDivergence)
      .withContext("aucune divergence sur c:blaguer")
      .toBeNull();

    // Le « resteDeLaSortie » NE doit PAS rester pendant : sinon le magnéto bloque l'utilisateur
    // en attente d'un appui de touche pour afficher la chute.
    expect((lecteur as any).resteDeLaSortie?.length ?? 0)
      .withContext("resteDeLaSortie doit être vide en magnéto — la chute doit déjà être affichée")
      .toBe(0);

    // La chute « Faire wouaf! » doit être dans le contenu écran.
    const ecran = (lecteur as any).partie.ecran.ecran as string;
    expect(ecran)
      .withContext("la chute inline (post-@@attendre touche@@) doit être visible à l'écran")
      .toContain("Faire wouaf!");

    // Et elle doit précéder la 3e commande quand on enchaîne.
    lecteur.magnetoPasSuivant(); // c:x clé (3e étape)
    const ecran2 = (lecteur as any).partie.ecran.ecran as string;
    const idxChute = ecran2.indexOf("Faire wouaf!");
    const idxCmd3 = Math.max(ecran2.indexOf("&gt; x clé", idxChute), ecran2.indexOf("> x clé", idxChute));
    expect(idxChute).toBeGreaterThanOrEqual(0);
    if (idxCmd3 >= 0) {
      expect(idxChute).withContext("la chute doit précéder le prompt de la commande suivante").toBeLessThan(idxCmd3);
    }
  });

  it("[F050-MAG-ATT-T005b] c: → routine contenant `attendre touche` : la chute doit apparaître à l'écran", () => {
    // Variante de T005 : la blague est implémentée via une routine appelée depuis l'action.
    // typeContexte de l'interruption = `routine` (au lieu de `tour`) → continuerRoutineInterrompue
    // au lieu de continuerLeTourInterrompu. À vérifier que la chute remonte aussi à l'écran.
    const scenario = `La salle est un lieu.
La boussole est un objet vu ici.
routine raconter_blague:
  dire "Voici une blague :".
  dire "Un geek ne s'ennuie pas...".
  attendre touche.
  dire "Il a un programme charge !".
fin routine
action raconter:
  exécuter la routine raconter_blague.
fin action
` + actions;

    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "raconter";
    (lecteurRec as any).validationCommande();
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "raconter");
    expect(etapeC!.sortie ?? "").withContext("recording : la chute fait partie du sortie de c:raconter (via routine)")
      .toContain("Il a un programme charge");

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence).withContext("aucune divergence").toBeNull();
    const ecran = (lecteur as any).partie.ecran.ecran as string;
    expect(ecran).withContext("la chute (via routine) doit être visible à l'écran après le bypass")
      .toContain("Il a un programme charge");
  });

  it("[F050-MAG-ATT-T004] étape d: en intro contenant `attendre touche` : init magnéto bypass aussi", () => {
    // Cas variant : la d: est forcée en intro par avancerJusquAEtapeJouable, qui appelle
    // traiterProchaineRoutine et laisse l'attendre touche pendante. initialiserMagneto doit
    // re-consommer ces interruptions après l'avancement intro, sinon le magnéto démarre déjà
    // bloqué sur la touche.
    const scenario = `La salle est un lieu.
routine routine_attente:
  dire "Routine debut.".
  attendre touche.
  dire "Routine fin.".
fin routine
` + actions;

    const fichier = Object.assign(new FichierEnregistrement(), {
      type: 'enregistrement',
      version: 1,
      scenario: '',
      graine: 'g',
      declenchementsFuturs: [],
      sortieIntro: 'Routine debut.{N}Routine fin.{N}',
      etapes: [
        { type: 'g', valeur: 'g' },
        { type: 'd', valeur: 'routine_attente', sortie: 'Routine debut.{N}Routine fin.{N}' },
        { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      ],
    }) as FichierEnregistrement;

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);

    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext("après init, plus aucune attendreTouche pendante — sinon le 1er Pas suivant ne peut être cliqué")
      .not.toBe(TypeInterruption.attendreTouche);
  });

});
