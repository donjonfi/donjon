import { ElementRef } from "@angular/core";

import { LecteurComponent } from "../../public-api";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";

import { actions } from "./scenario_actions";

/**
 * Action « annuler » — restauration RÉELLE de l'état du jeu.
 *
 * `annuler` ne revient pas en arrière tout seul : la commande lève une interruption
 * `annulerTour`, le lecteur tronque la sauvegarde (`enleverToursDeJeux(1 + N)`) et
 * émet `nouvellePartieOuAnnulerTour(sauvegarde)`. En production, le composant parent
 * (jouer.component / editeur.component) recompile le scénario, réinjecte la
 * sauvegarde tronquée et réassigne `[jeu]` → un nouveau `ngOnChanges` relance la
 * partie et rejoue la sauvegarde (auto-triche), ce qui reconstruit l'état d'avant.
 *
 * Ce harnais reproduit ce reload parent (la souscription à
 * `nouvellePartieOuAnnulerTour`), seul maillon absent en test unitaire — c'est ce
 * qui manquait aux cas `xit` de enregistrement-rec-magneto-choix-nav.spec.ts.
 */
describe("Action annuler — restauration réelle de l'état (reload parent simulé)", () => {

  // Les lecteurs créés planifient des setTimeout (affichage, scroll) qui peuvent
  // se déclencher après le test : on les neutralise en afterEach.
  const lecteursCrees: any[] = [];
  afterEach(() => {
    while (lecteursCrees.length) {
      const l = lecteursCrees.pop();
      l.enregistrementActif = false;
      l.enregistrementEnCours = null;
    }
  });

  /**
   * Instancie un lecteur complet (cycle de vie réel, sans DOM) et le câble au reload
   * parent : à chaque `nouvellePartieOuAnnulerTour`, on recompile le scénario, on
   * réinjecte la sauvegarde émise et on relance `ngOnChanges` — la copie conforme de
   * `onNouvellePartieOuAnnulerTour` des apps donjon-jouer / donjon-creer.
   */
  function creerLecteur(scenario: string): LecteurComponent {
    const genererJeu = () =>
      Generateur.genererJeu(CompilateurV8.analyserScenarioEtActions(scenario, actions, false));

    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement("div")));
    spyOn(lecteur as any, "scrollSortie");
    spyOn(lecteur as any, "focusCommande");
    spyOn(lecteur as any, "definirIFID");
    spyOn(lecteur as any, "verifierChrono");
    spyOn(lecteur as any, "verifierTamponErreurs");
    spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques");

    lecteur.nouvellePartieOuAnnulerTour.subscribe((sauvegarde: any) => {
      const jeu = genererJeu();
      if (sauvegarde) { jeu.sauvegarde = sauvegarde; }
      lecteur.jeu = jeu;
      lecteur.ngOnChanges({});
    });

    lecteur.jeu = genererJeu();
    lecteur.ngOnChanges({});
    lecteursCrees.push(lecteur);
    return lecteur;
  }

  /** Joue une commande comme la touche Entrée du lecteur (pipeline complet + sauvegarde). */
  function jouer(lecteur: any, commande: string): void {
    lecteur.commande = commande;
    lecteur.validationCommande();
  }

  /** Objet courant (après un éventuel reload, l'instance de jeu a changé). */
  function objet(lecteur: any, nomEpithete: string) {
    return lecteur.jeu.objets.find((o: any) => o.intitule?.nomEpithete === nomEpithete);
  }

  /** Lieu courant du joueur. */
  function lieuCourant(lecteur: any): string {
    return lecteur.partie.eju.curLieu.nom;
  }

  const SCENARIO =
    `Le salon est un lieu.
Sa description est "Un salon tranquille.".
La pomme est un objet vu dans le salon.
Le coffre est un contenant ouvrable, fermé et vu dans le salon.
Le jardin est un lieu au nord du salon.
Sa description est "Un jardin fleuri.".
`;

  it("[F081-T001] le harnais reload se déclenche : annuler régénère une nouvelle partie", () => {
    const lecteur = creerLecteur(SCENARIO) as any;
    const jeuAvant = lecteur.jeu;
    jouer(lecteur, "prendre la pomme");
    jouer(lecteur, "annuler");
    // le reload a bien recréé un jeu neuf (instance différente)
    expect(lecteur.jeu).not.toBe(jeuAvant);
    expect(lecteur.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F081-T002] annuler « prendre la pomme » : la pomme revient dans le salon", () => {
    const lecteur = creerLecteur(SCENARIO) as any;
    const salonId = lecteur.jeu.lieux.find((l: any) => l.nom === "salon").id;
    const joueurId = lecteur.jeu.joueur.id;

    jouer(lecteur, "prendre la pomme");
    expect(objet(lecteur, "pomme").position?.cibleId)
      .withContext("après prise, la pomme est sur le joueur").toEqual(joueurId);

    jouer(lecteur, "annuler");
    expect(objet(lecteur, "pomme").position?.cibleId)
      .withContext("après annuler, la pomme est de retour dans le salon").toEqual(salonId);
  });

  it("[F081-T003] annuler un déplacement : le joueur revient dans le salon", () => {
    const lecteur = creerLecteur(SCENARIO) as any;
    expect(lieuCourant(lecteur)).toEqual("salon");

    jouer(lecteur, "aller au nord");
    expect(lieuCourant(lecteur)).withContext("après déplacement").toEqual("jardin");

    jouer(lecteur, "annuler");
    expect(lieuCourant(lecteur)).withContext("après annuler").toEqual("salon");
  });

  it("[F081-T004] annuler un changement d'état : le coffre se referme", () => {
    const lecteur = creerLecteur(SCENARIO) as any;
    const et = lecteur.jeu.etats;

    jouer(lecteur, "ouvrir le coffre");
    expect(objet(lecteur, "coffre").etats).withContext("coffre ouvert").toContain(et.ouvertID);
    expect(objet(lecteur, "coffre").etats).not.toContain(et.fermeID);

    jouer(lecteur, "annuler");
    expect(objet(lecteur, "coffre").etats).withContext("coffre refermé").toContain(et.fermeID);
    expect(objet(lecteur, "coffre").etats).not.toContain(et.ouvertID);
  });

  it("[F081-T005] annuler n'annule qu'un seul tour (granularité)", () => {
    const lecteur = creerLecteur(SCENARIO) as any;
    const salonId = lecteur.jeu.lieux.find((l: any) => l.nom === "salon").id;
    const joueurId = lecteur.jeu.joueur.id;
    const et = lecteur.jeu.etats;

    jouer(lecteur, "prendre la pomme");
    jouer(lecteur, "ouvrir le coffre");
    jouer(lecteur, "annuler"); // n'annule que l'ouverture du coffre

    expect(objet(lecteur, "coffre").etats)
      .withContext("le coffre est refermé (dernier tour annulé)").toContain(et.fermeID);
    expect(objet(lecteur, "pomme").position?.cibleId)
      .withContext("la pomme reste prise (tour antérieur conservé)").toEqual(joueurId);
    expect(objet(lecteur, "pomme").position?.cibleId).not.toEqual(salonId);
  });

});
