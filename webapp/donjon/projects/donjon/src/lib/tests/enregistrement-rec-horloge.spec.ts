import { ElementRef } from "@angular/core";

import { FichierEnregistrement, LecteurComponent } from "../../public-api";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { ProgrammationTemps } from "../models/jeu/programmation-temps";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

/**
 * Magnéto — déterminisme de l'horloge au replay + saisie d'heure pour une lecture
 * non enregistrée (instruction ajoutée/modifiée).
 */
describe("Enregistrement (.rec) — magnéto : horloge déterministe", () => {

  const lecteursCrees: any[] = [];
  afterEach(() => {
    while (lecteursCrees.length) {
      const l = lecteursCrees.pop();
      l.enregistrementActif = false;
      l.enregistrementEnCours = null;
    }
    HorlogeUtils.terminerRejeu();
    HorlogeUtils.reinitialiser();
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
    lecteursCrees.push(lecteur);
    return lecteur;
  }

  const scenario = `La salle est un lieu.
action tester:
  dire "il est [heure]h".
fin action
` + actions;

  function enregistrerTester(): FichierEnregistrement {
    const jeuRec = TestUtils["genererLeJeu"](scenario, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "tester";
    (lecteurRec as any).validationCommande();
    return (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
  }

  it("[F050-MAG-HOR-T001] la lecture d'heure est capturée dans l'étape et rejouée sans divergence", () => {
    const fichier = enregistrerTester();
    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "tester");
    expect(etapeC).withContext("c:tester capturée").toBeDefined();
    expect(etapeC!.horloge).withContext("la lecture d'heure est stockée dans l'étape").toBeDefined();
    expect(etapeC!.horloge!.length).toBe(1);

    // Replay : l'étape doit reproduire exactement la même sortie (même heure), sans divergence.
    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence).withContext("aucune divergence : l'heure rejouée == heure enregistrée").toBeNull();
    expect(lecteur.magnetoSaisieHorloge).withContext("pas de saisie : la lecture était enregistrée").toBeNull();
  });

  it("[F050-MAG-HOR-T002] lecture d'heure non enregistrée → saisie d'heure ; confirmer inscrit l'heure dans l'étape", () => {
    const fichier = enregistrerTester();
    const etapeC = fichier.etapes.find(e => e.type === "c" && e.valeur === "tester")!;
    // Simuler une instruction ajoutée/modifiée qui lit l'horloge sans valeur enregistrée.
    delete etapeC.horloge;

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    lecteur.magnetoPasSuivant();

    // Le magnéto se met en pause et demande l'heure.
    expect(lecteur.magnetoSaisieHorloge).withContext("saisie d'heure ouverte").not.toBeNull();
    expect(lecteur.magnetoSaisieHorloge!.inputs.length).toBe(1);

    // L'auteur fixe une heure puis valide.
    lecteur.magnetoSaisieHorloge!.inputs[0] = "2020-01-01T08:30:00";
    const idxAvantConfirmation = lecteur.magnetoIdx;
    spyOn(lecteur as any, "magnetoRecommencer"); // le reload est piloté par le parent (hors test)
    lecteur.magnetoConfirmerSaisieHorloge();

    // la position courante est mémorisée pour ré-avancer après le rejeu (pas de retour à l'intro)
    expect(lecteur.magnetoIdxRejeuCible).toBe(idxAvantConfirmation);

    // L'heure choisie est inscrite dans l'étape (epoch ms) ; la saisie est refermée ;
    // l'étape est marquée pour recalcul de sa sortie au rejeu.
    expect(lecteur.magnetoSaisieHorloge).toBeNull();
    expect(etapeC.horloge).toBeDefined();
    expect(etapeC.horloge!.length).toBe(1);
    expect(etapeC.horloge![0]).toBe(new Date("2020-01-01T08:30:00").getTime());
    const idxC = lecteur.enregistrementEnCours!.etapes.indexOf(etapeC);
    expect(lecteur.magnetoIdxSortieARecalculer.has(idxC)).toBeTrue();
  });

  it("[F050-MAG-HOR-T004] sortie attendue recalculée avec l'heure fournie au rejeu (pas de divergence)", () => {
    const fichier = enregistrerTester();
    const etapeC = fichier.etapes.find(e => e.valeur === "tester")!;
    // L'auteur a fourni une heure (8h) différente de l'heure réelle d'enregistrement ; la sortie
    // stockée est encore l'ancienne (réelle). On marque l'étape pour recalcul.
    etapeC.horloge = [new Date(2020, 0, 1, 8, 0, 0).getTime()];
    etapeC.sortie = "il est 99h"; // ancienne sortie, volontairement fausse

    const jeuReplay = TestUtils["genererLeJeu"](scenario, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    const idxC = fichier.etapes.indexOf(etapeC);
    lecteur.magnetoIdxSortieARecalculer.add(idxC);

    lecteur.magnetoPasSuivant(); // rejoue c:tester avec 8h

    // Pas de divergence : la sortie a été recalculée et acceptée.
    expect(lecteur.magnetoDivergence).toBeNull();
    expect(etapeC.sortie).toContain("il est 8h");
    expect(lecteur.magnetoIdxSortieARecalculer.has(idxC)).toBeFalse(); // consommé
  });

  it("[F050-MAG-HOR-T003] insérer une commande qui lit l'horloge : l'heure est capturée dans la nouvelle étape + saisie proposée", () => {
    const scn = `La salle est un lieu.
action attendre:
  dire "ok".
fin action
action consulter:
  dire "il est [heure]h".
fin action
` + actions;

    // Enregistrement initial : une seule commande neutre « attendre ».
    const jeuRec = TestUtils["genererLeJeu"](scn, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "attendre";
    (lecteurRec as any).validationCommande();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    // Replay : jouer c:attendre, puis INSÉRER « consulter » (qui lit l'horloge) après.
    const jeuReplay = TestUtils["genererLeJeu"](scn, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    lecteur.magnetoPasSuivant(); // joue c:attendre
    lecteur.magnetoEntrerInsertion("apres");
    lecteur.magnetoSaisieCommande = "consulter";
    lecteur.magnetoValiderSaisie();

    // 1) l'heure lue est sauvegardée à côté de la nouvelle commande
    const etapeConsulter = lecteur.enregistrementEnCours!.etapes.find(e => e.valeur === "consulter");
    expect(etapeConsulter).withContext("la commande insérée est dans l'enregistrement").toBeDefined();
    expect(etapeConsulter!.horloge).withContext("l'heure est capturée dans la nouvelle étape").toBeDefined();
    expect(etapeConsulter!.horloge!.length).toBe(1);

    // 2) on demande à l'auteur de fournir/ajuster l'heure
    expect(lecteur.magnetoSaisieHorloge).withContext("saisie d'heure proposée").not.toBeNull();
    expect(lecteur.magnetoSaisieHorloge!.inputs.length).toBe(1);
  });

  it("[F050-MAG-HOR-T008] insérer une commande qui programme une routine : la routine est forcée (étape 'd' + sortie)", () => {
    const scn = `La salle est un lieu.
routine bip:
  dire "DING".
fin routine
action attendre:
  dire "ok".
fin action
action armer:
  exécuter la routine bip dans 3 secondes.
fin action
` + actions;

    // Enregistrement initial : une commande neutre.
    const jeuRec = TestUtils["genererLeJeu"](scn, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "attendre";
    (lecteurRec as any).validationCommande();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    // Replay : jouer c:attendre, puis INSÉRER « armer » (qui programme la routine bip).
    const jeuReplay = TestUtils["genererLeJeu"](scn, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    lecteur.magnetoPasSuivant(); // joue c:attendre
    lecteur.magnetoEntrerInsertion("apres");
    lecteur.magnetoSaisieCommande = "armer";
    lecteur.magnetoValiderSaisie();

    // La commande insérée est dans l'enregistrement.
    const etapes = lecteur.enregistrementEnCours!.etapes;
    const idxArmer = etapes.findIndex(e => e.type === 'c' && e.valeur === "armer");
    expect(idxArmer).withContext("commande insérée présente").toBeGreaterThanOrEqual(0);

    // La routine programmée est forcée : une étape 'd' « bip » apparaît juste après, avec sa sortie.
    const etapeD = etapes.find(e => e.type === 'd' && e.valeur === "bip");
    expect(etapeD).withContext("routine forcée présente en étape 'd'").toBeDefined();
    expect(etapes.indexOf(etapeD!)).withContext("'d' juste après la commande").toBe(idxArmer + 1);
    expect(etapeD!.sortie ?? "").withContext("sortie de la routine capturée").toContain("DING");
  });

  it("[F050-MAG-HOR-T005] avancerAutoJusqua ré-avance le replay jusqu'à la cible (continuer, pas rester sur l'intro)", () => {
    const scn = `La salle est un lieu.
action attendre:
  dire "ok".
fin action
` + actions;

    // Enregistrement de deux commandes neutres.
    const jeuRec = TestUtils["genererLeJeu"](scn, false);
    const lecteurRec = instancierLecteur(jeuRec, undefined);
    (lecteurRec as any).commande = "attendre"; (lecteurRec as any).validationCommande();
    (lecteurRec as any).commande = "attendre"; (lecteurRec as any).validationCommande();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    const jeuReplay = TestUtils["genererLeJeu"](scn, false);
    const lecteur = instancierLecteur(jeuReplay, fichier);
    const cible = fichier.etapes.length; // fin
    expect(lecteur.magnetoIdx).toBeLessThan(cible);

    (lecteur as any).avancerAutoJusqua(cible);

    // le curseur a bien progressé (les 2 commandes rejouées), sans rester bloqué au départ
    expect(lecteur.magnetoIdx).toBeGreaterThanOrEqual(2);
    expect(lecteur.magnetoDivergence).toBeNull();
  });

  it("[F050-MAG-HOR-T006] verifierChrono ne déclenche pas une routine programmée pendant un replay (anti double-exécution)", () => {
    const scn = `La salle est un lieu.
routine bip:
  dire "DING".
fin routine
` + actions;
    const jeu = TestUtils["genererLeJeu"](scn, false) as any;

    // Lecteur SANS espionner verifierChrono (on veut l'exécuter pour de vrai).
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement("div")));
    lecteur.jeu = jeu;
    spyOn(lecteur as any, "scrollSortie");
    spyOn(lecteur as any, "focusCommande");
    spyOn(lecteur as any, "definirIFID");
    spyOn(lecteur as any, "verifierTamponErreurs");
    spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques");
    lecteur.ngOnChanges({});
    lecteursCrees.push(lecteur);

    // Une routine est programmée et échue, ET on est en replay (restaurationPartieEnCours).
    const prog = new ProgrammationTemps("bip", 1);
    prog.debutTemps = 0; // échu depuis longtemps
    jeu.programmationsTemps.push(prog);
    (lecteur as any).partie.ins.restaurationPartieEnCours = true;

    const spyRoutine = spyOn(lecteur as any, "traiterProchaineRoutine");
    (lecteur as any).verifierChrono();
    jeu.termine = true; // stopper la boucle setTimeout rescheduled

    // Pendant le replay, le chrono ne déclenche PAS la routine (la programmation reste en place).
    expect(spyRoutine).not.toHaveBeenCalled();
    expect(jeu.programmationsTemps.length).toBe(1);
  });

  it("[F050-MAG-HOR-T007] l'auto-triche (reload post-Précédent) conserve restaurationPartieEnCours tant que le magnéto est actif", () => {
    const scn = `La salle est un lieu.\n` + actions;
    const jeu = TestUtils["genererLeJeu"](scn, false) as any;
    const lecteur = instancierLecteur(jeu, undefined);
    jeu.sauvegarde = { type: "sauvegarde", etapesSauvegarde: ["g:0.5"], horlogesSauvegarde: [null], graine: "0.5", declenchementsFuturs: [] } as any;

    // Cas magnéto actif : le flag doit RESTER posé après l'auto-triche, sinon le « Suivant »
    // suivant reprogrammerait réellement les routines.
    (lecteur as any).enregistrementActif = true;
    (lecteur as any).partie.ins.restaurationPartieEnCours = true;
    (lecteur as any).lancerAutoTriche();
    expect((lecteur as any).partie.ins.restaurationPartieEnCours).withContext("flag conservé en magnéto").toBeTrue();

    // Cas hors magnéto (triche auto classique) : le flag est bien levé en fin de triche.
    (lecteur as any).enregistrementActif = false;
    jeu.sauvegarde = { type: "sauvegarde", etapesSauvegarde: ["g:0.5"], horlogesSauvegarde: [null], graine: "0.5", declenchementsFuturs: [] } as any;
    (lecteur as any).lancerAutoTriche();
    expect((lecteur as any).partie.ins.restaurationPartieEnCours).withContext("flag levé hors magnéto").toBeFalse();
  });
});
