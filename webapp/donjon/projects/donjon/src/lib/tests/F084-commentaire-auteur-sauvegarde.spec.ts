import { ElementRef } from "@angular/core";

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { LecteurComponent } from "../../public-api";
import { TestUtils } from "../utils/test-utils";
import { Generateur } from "../utils/compilation/generateur";
import { Sauvegarde } from "../models/jouer/sauvegarde";
import { CommandesUtils } from "../utils/jeu/commandes-utils";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { actions } from "./scenario_actions";

/**
 * Commentaires du joueur à l'auteur (« *… » / « @… ») et propreté du fichier sauvegarde.
 *
 * Couvre :
 *  - décomposition d'une étape de sauvegarde sur le PREMIER « : » seulement
 *    (un commentaire peut contenir des « : », ils étaient perdus au rejeu triche/magnéto) ;
 *  - round-trip commentaire → étape 'c' → .rec ;
 *  - omission des lectures d'horloge vides à l'écriture du fichier (.sol/.sav), sans casser
 *    l'alignement du tableau vivant utilisé par `annuler` (`enleverToursDeJeux`).
 */

function preparer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", false);
  return ctx;
}

/** Instancier un lecteur (comme les specs magnéto), éventuellement en restauration de `jeu.sauvegarde`. */
function instancierLecteur(jeu: any, restaurerSauvegarde = false): LecteurComponent {
  const lecteur = new LecteurComponent(document, new ElementRef(document.createElement("div")));
  lecteur.jeu = jeu;
  spyOn(lecteur as any, "scrollSortie");
  spyOn(lecteur as any, "focusCommande");
  spyOn(lecteur as any, "definirIFID");
  spyOn(lecteur as any, "verifierChrono");
  spyOn(lecteur as any, "verifierTamponErreurs");
  spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques");
  if (restaurerSauvegarde) {
    lecteur.restaurerProchainJeu();
  }
  lecteur.ngOnChanges({});
  lecteursCrees.push(lecteur);
  return lecteur;
}

/** Entrer une commande dans le lecteur comme le ferait le joueur. */
function jouerCommande(lecteur: LecteurComponent, commande: string): void {
  (lecteur as any).commande = commande;
  (lecteur as any).validationCommande();
}

/** Jouer un tour comme le fait `envoyerCommande` : étape poussée, commande exécutée, sortie (et horloge) enregistrées. */
function jouerEtape(ctx: ContextePartie, commande: string): void {
  ctx.ajouterCommandeDansSauvegarde(commande);
  const sortie = ctx.com.executerCommande(commande, false).sortie;
  ctx.enregistrerSortieEtapeCourante(sortie ?? '');
}

const lecteursCrees: LecteurComponent[] = [];

describe("Commentaire à l'auteur et sauvegarde", () => {

  afterEach(() => {
    while (lecteursCrees.length) {
      const l = lecteursCrees.pop() as any;
      l.enregistrementActif = false;
      l.enregistrementEnCours = null;
    }
    // éviter toute fuite d'état statique entre tests
    HorlogeUtils.terminerRejeu();
    HorlogeUtils.reinitialiser();
  });

  // ============================================================
  //  Décomposition d'une étape (unité)
  // ============================================================

  it("[F084-T001] découpe sur le premier « : » : le reste du commentaire est conservé", () => {
    expect(CommandesUtils.decomposerEtape("c:*orthographe: il manque un accent"))
      .toEqual({ type: 'c', valeur: "*orthographe: il manque un accent" });
    expect(CommandesUtils.decomposerEtape("c:@remarque : 2 portes ici : bizarre"))
      .toEqual({ type: 'c', valeur: "@remarque : 2 portes ici : bizarre" });
  });

  it("[F084-T002] étapes ordinaires inchangées", () => {
    expect(CommandesUtils.decomposerEtape("c:prendre clé")).toEqual({ type: 'c', valeur: "prendre clé" });
    expect(CommandesUtils.decomposerEtape("g:0.4274969835462339")).toEqual({ type: 'g', valeur: "0.4274969835462339" });
    expect(CommandesUtils.decomposerEtape("r:2")).toEqual({ type: 'r', valeur: "2" });
    expect(CommandesUtils.decomposerEtape("d:afficherScore avec 3")).toEqual({ type: 'd', valeur: "afficherScore avec 3" });
  });

  it("[F084-T003] étape sans séparateur : pas de valeur", () => {
    expect(CommandesUtils.decomposerEtape("c")).toEqual({ type: 'c', valeur: undefined });
  });

  // ============================================================
  //  Round-trip commentaire → sauvegarde → enregistrement
  // ============================================================

  it("[F084-T004] un commentaire avec « : » traverse la sauvegarde et le .rec sans perte", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    const commentaire = "*orthographe: il manque un accent à « clé »";
    ctx.ajouterCommandeDansSauvegarde(commentaire);

    const etape = ctx.etapesPartie[ctx.etapesPartie.length - 1];
    expect(CommandesUtils.decomposerEtape(etape).valeur).toBe(commentaire);

    const fichier = ctx.creerFichierEnregistrement();
    expect(fichier.etapes[fichier.etapes.length - 1].valeur).toBe(commentaire);
  });

  // ============================================================
  //  Horloges vides pas écrites dans le fichier
  // ============================================================

  it("[F084-T005] fichier : pas de tableau d'horloges quand aucune étape ne lit l'heure", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    ctx.ajouterCommandeDansSauvegarde("regarder");
    ctx.ajouterCommandeDansSauvegarde("*rien à signaler");

    const sauvegarde = ctx.creerSauvegardePourFichier();
    expect(sauvegarde.horlogesSauvegarde).toBeUndefined();
    expect(sauvegarde.horlogeIntro).toBeUndefined();
    // rien de « null » dans le fichier produit
    expect(JSON.stringify(sauvegarde)).not.toContain("null");
  });

  it("[F084-T006] fichier : jeu qui lit l'heure seulement en cours de partie → tableau complet et aligné", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      action tester:
        dire "il est [heure]h".
      fin action
    `);
    HorlogeUtils.reinitialiser();

    // étape 1 : commande qui ne lit pas l'heure
    jouerEtape(ctx, "regarder");
    // étape 2 : première lecture d'heure de la partie
    jouerEtape(ctx, "tester");
    // étape 3 : à nouveau sans lecture
    jouerEtape(ctx, "regarder");

    const sauvegarde = ctx.creerSauvegardePourFichier();
    // le tableau est conservé ENTIER (nulls compris) : l'index doit rester aligné sur les étapes
    expect(sauvegarde.horlogesSauvegarde?.length).toBe(sauvegarde.etapesSauvegarde.length);
    const idxTester = sauvegarde.etapesSauvegarde.indexOf("c:tester");
    expect(sauvegarde.horlogesSauvegarde?.[idxTester]?.length).toBe(1);
    expect(sauvegarde.horlogesSauvegarde?.[idxTester - 1]).toBeNull();
    expect(sauvegarde.horlogesSauvegarde?.[idxTester + 1]).toBeNull();
  });

  it("[F084-T008] fichier : lecture d'heure pendant l'intro seulement → horlogeIntro gardé, horloges par étape omises", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    HorlogeUtils.reinitialiser();
    // lecture d'heure avant la première commande (phase intro)
    HorlogeUtils.maintenant();
    ctx.enregistrerSortieEtapeCourante("intro");

    jouerEtape(ctx, "regarder");

    const sauvegarde = ctx.creerSauvegardePourFichier();
    expect(sauvegarde.horlogeIntro?.length).toBe(1);
    expect(sauvegarde.horlogesSauvegarde).toBeUndefined();
  });

  it("[F084-T009] reprise d'une sauvegarde sans horloge puis lecture d'heure : la nouvelle sauvegarde reste alignée", () => {
    const scenarioHeure = `La salle est un lieu.
action tester:
  dire "il est [heure]h".
fin action
` + actions;

    // --- partie 1 : aucune lecture d'heure → fichier sans horloges
    const jeu1 = TestUtils["genererLeJeu"](scenarioHeure, false);
    const lecteur1 = instancierLecteur(jeu1);
    jouerCommande(lecteur1, "regarder");
    jouerCommande(lecteur1, "i");
    const sauvegarde1 = (lecteur1 as any).partie.creerSauvegardePourFichier() as Sauvegarde;
    expect(sauvegarde1.horlogesSauvegarde).withContext("aucune horloge à écrire").toBeUndefined();

    // --- on repart de ce fichier (aller-retour JSON comme un vrai .sol)
    const fichier = JSON.parse(JSON.stringify(sauvegarde1)) as Sauvegarde;
    const jeu2 = TestUtils["genererLeJeu"](scenarioHeure, false);
    jeu2.sauvegarde = fichier;
    const lecteur2 = instancierLecteur(jeu2, true);

    // --- puis une commande qui lit l'heure, et on sauvegarde à nouveau
    jouerCommande(lecteur2, "tester");
    const sauvegarde2 = (lecteur2 as any).partie.creerSauvegardePourFichier() as Sauvegarde;

    expect(sauvegarde2.etapesSauvegarde).toContain("c:tester");
    expect(sauvegarde2.horlogesSauvegarde?.length)
      .withContext("tableau d'horloges aligné sur les étapes rejouées + la nouvelle")
      .toBe(sauvegarde2.etapesSauvegarde.length);
    const idxTester = sauvegarde2.etapesSauvegarde.indexOf("c:tester");
    expect(sauvegarde2.horlogesSauvegarde?.[idxTester]?.length).toBe(1);
    // les étapes restaurées (graine + commandes sans heure) restent à null
    expect(sauvegarde2.horlogesSauvegarde?.[0]).toBeNull();
    expect(sauvegarde2.horlogesSauvegarde?.[idxTester - 1]).toBeNull();
  });

  it("[F084-T007] sauvegarde vivante (annuler) : le tableau d'horloges reste complet et aligné", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    ctx.ajouterCommandeDansSauvegarde("regarder");
    ctx.ajouterCommandeDansSauvegarde("*rien à signaler");

    const sauvegarde: Sauvegarde = ctx.creerSauvegardeSolution();
    expect(sauvegarde.horlogesSauvegarde?.length).toBe(sauvegarde.etapesSauvegarde.length);

    // `enleverToursDeJeux` pop les deux tableaux en parallèle : ils doivent rester alignés.
    CommandesUtils.enleverToursDeJeux(1, sauvegarde);
    expect(sauvegarde.horlogesSauvegarde?.length).toBe(sauvegarde.etapesSauvegarde.length);
  });

});
