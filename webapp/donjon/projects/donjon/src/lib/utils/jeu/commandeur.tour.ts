import { ContexteTour, PhaseTour } from "../../models/jouer/contexte-tour";
import { TypeContexte } from "../../models/jeu/interruption";

import { ActionCeciCela } from "../../models/compilateur/action";
import { ConditionsUtils } from "./conditions-utils";
import { ContexteCommande } from "../../models/jouer/contexte-commande";
import { Declencheur } from "./declencheur";
import { Evenement } from "../../models/jouer/evenement";
import { Instructions } from "./instructions";
import { InterruptionsUtils } from "./interruptions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Resultat } from "../../models/jouer/resultat";
import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";
import { ClasseUtils } from "../commun/classe-utils";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementJeu } from "../../models/jeu/element-jeu";

export class CommandeurTour {

  /** Conditions Utils */
  private cond: ConditionsUtils;
  private eju: ElementsJeuUtils;

  constructor(
    private jeu: Jeu,
    private ins: Instructions,
    private dec: Declencheur,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
  }

  public demarrerNouveauTour(commande: ContexteCommande) {
    // créer le contexte du tour
    const contexteTour = new ContexteTour(commande.actionChoisie.ceci, commande.actionChoisie.cela);
    contexteTour.commande = commande;

    this.executerLaPhaseSuivante(contexteTour);
  }

  public continuerLeTourInterrompu(tour: ContexteTour): string {
    //  console.warn("@@ continuer le tour interrompu @@ reste=", tour.reste);

    // on a déjà affiché la sortie de la partie précédente de la commande donc on peut la vider
    tour.commande.sortie = "";

    // terminer les instructions de la phase interrompue
    // TODO: nombre de déclenchements s’il s’agit d’une règle
    const resultatReste = this.ins.executerInstructions(tour.reste, tour, tour.commande.evenement, undefined);
    tour.commande.sortie += resultatReste.sortie;

    if (tour.phase == PhaseTour.avant_interrompu && resultatReste.arreterApresRegle) {
      tour.phase = PhaseTour.fin;
    } else if (tour.phase == PhaseTour.apres_interrompu && !resultatReste.terminerApresRegle) {
      tour.phase = PhaseTour.fin;
    } else if (tour.phase == PhaseTour.prerequis && resultatReste.refuse) {
      tour.phase = PhaseTour.fin;
    }

    // si le déroulement a été interrompu
    if (resultatReste.interrompreBlocInstruction) {
      this.creerInterruptionTour(tour, resultatReste);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }

    // retourner la suite de la sortie de la commande
    return tour.commande.sortie;
  }

  /** Exécuter la phase suivante du tour. */
  private executerLaPhaseSuivante(tour: ContexteTour) {
    switch (tour.phase) {
      // DÉBUT
      case PhaseTour.debut:
        // passer à la phase « avant »  
        tour.phase = PhaseTour.avant;
        this.executerPhaseAvant(tour);
        break;
      // AVANT
      case PhaseTour.avant:
      case PhaseTour.avant_interrompu:
        // passer à la phase « prérequis » (refuser)
        tour.phase = PhaseTour.prerequis;
        this.executerPhasePrerequis(tour);
        break;
      // PRÉREQUIS (REFUSER)
      case PhaseTour.prerequis:
        // passer à la phase « exécuter »
        tour.phase = PhaseTour.execution;
        this.executerPhaseExecution(tour);
        break;
      // EXÉCUTION (EXÉCUTER)
      case PhaseTour.execution:
        // passer à la phase « après »
        tour.phase = PhaseTour.apres;
        this.executerPhaseApres(tour);
        break;
      // APRÈS
      case PhaseTour.apres:
      case PhaseTour.apres_interrompu:
        // passer à la phase « terminer »
        tour.phase = PhaseTour.epilogue;
        this.executerPhaseEpilogue(tour);
        break;
      case PhaseTour.apres_a_traiter_apres_terminer:
        // passer à la phase « terminer »
        tour.phase = PhaseTour.terminer_avant_traiter_apres;
        this.executerPhaseEpilogue(tour);
        break;
      case PhaseTour.continuer_apres:
      case PhaseTour.continuer_apres_interrompu:
        // ajouter les erreurs à la sortie
        tour.erreurs.forEach(erreur => {
          tour.commande.sortie += `{+${erreur}+}{n}`
        });
        // passer à la phase « fin »
        tour.phase = PhaseTour.fin;
        break;
      // ÉPLILOGUE (TERMINER)
      case PhaseTour.epilogue:
        // ajouter les erreurs à la sortie
        tour.erreurs.forEach(erreur => {
          tour.commande.sortie += `{+${erreur}+}{n}`
        });
        // passer à la phase « fin »
        tour.phase = PhaseTour.fin;
        break;
      case PhaseTour.terminer_avant_traiter_apres:
        tour.phase = PhaseTour.continuer_apres;
        this.executerPhaseApres(tour);
        break;
      // FIN
      case PhaseTour.fin:
        this.executerPhaseFin(tour);
        break;

      default:
        console.error("Phase inconnue:", tour.phase);
        break;
    }
  }

  private executerPhaseFin(tour: ContexteTour) {
    // si on a interagi avec un objet qui devait être vu, celui-ci est à présent familier.
    if (tour.commande.actionChoisie.action.ceci
       && tour.commande.actionChoisie.action.cibleCeci.epithete?.includes('vu')
      && ClasseUtils.heriteDe(tour.commande.actionChoisie.ceci.classe, EClasseRacine.element)) {
      this.jeu.etats.ajouterEtatElement(tour.commande.actionChoisie.ceci as ElementJeu, EEtatsBase.familier, this.eju);
    }
    if (tour.commande.actionChoisie.action.cela
      && tour.commande.actionChoisie.action.cibleCela.epithete?.includes('vu') 
      && ClasseUtils.heriteDe(tour.commande.actionChoisie.cela.classe, EClasseRacine.element)) {
      this.jeu.etats.ajouterEtatElement(tour.commande.actionChoisie.cela as ElementJeu, EEtatsBase.familier, this.eju);
    }
  }

  /** Exécuter la phase « avant » du tour. */
  private executerPhaseAvant(tour: ContexteTour) {
    // console.warn("@@ phase avant @@");

    // s’il s’agit d’une commande qui déplace le joueur, on remplit origine, destination et orientation
    if (tour.commande.actionChoisie.action.destinationDeplacement) {
      this.ins.determinerDeplacementVers(tour.commande.actionChoisie.action.destinationDeplacement, tour);
    }

    // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
    let resultatAvant = new Resultat(true, "", 0);
    // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score ou si règle générique
    const declenchementsAvant = this.dec.avant(tour.commande.evenement);

    // éxécuter les règles déclenchées
    for (let index = 0; index < declenchementsAvant.length; index++) {
      const declenchement = declenchementsAvant[index];
      const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions, tour, tour.commande.evenement, declenchement.declenchements);
      tour.commande.sortie += sousResultatAvant.sortie;
      resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
      resultatAvant.nombre += sousResultatAvant.nombre;
      resultatAvant.arreterApresRegle = resultatAvant.arreterApresRegle || sousResultatAvant.arreterApresRegle;
      // vérifier s’il y a une interruption
      if (sousResultatAvant.interrompreBlocInstruction) {
        InterruptionsUtils.definirProprietesInterruptionSousResultatAuResultat(resultatAvant, sousResultatAvant);
        if (declenchementsAvant.length > 1) {
          this.jeu.tamponConseils.push("Déclenchement règle avant: l’instruction choisir risque de ne pas fonctionner correctement si plusieurs règles « avant » se déclenchent pour le même évènement. Évènement: « " + tour.commande.evenement + " »");
        }
      }
      if (resultatAvant.arreterApresRegle) {
        break;
      }
    }

    // si on a fait appel à l’instruction « arrêter l’action » / « refuser l’action »
    if (resultatAvant.arreterApresRegle === true) {
      // cloturer le tour
      tour.phase = PhaseTour.fin;
    }
    // si le déroulement a été interrompu
    if (resultatAvant.interrompreBlocInstruction) {
      tour.phase = PhaseTour.avant_interrompu; // on pourrait encore terminer dans la 2e partie de la règle.
      this.creerInterruptionTour(tour, resultatAvant);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }
  }

  /** Exécuter la phase « prérequis » (refuser) du tour. */
  private executerPhasePrerequis(tour: ContexteTour) {
    // console.warn("@@ phase prérequis @@");
    // PHASE PRÉREQUIS (vérifier l'action)
    let refus = false;
    let resultatPrerequis: Resultat | undefined;

    // version BETA
    if (tour.commande.actionChoisie.action.verificationsBeta?.length) {
      // parcourir les vérifications
      tour.commande.actionChoisie.action.verificationsBeta.forEach(verif => {
        if (verif.conditions.length == 1) {
          if (!refus && this.cond.siEstVrai(null, verif.conditions[0], tour, tour.commande.evenement, null)) {
            // console.warn("> commande vérifie cela:", verif);
            resultatPrerequis = this.ins.executerInstructions(verif.resultats, tour, tour.commande.evenement, null);
            tour.commande.sortie += resultatPrerequis.sortie;
            refus = true;
          }
        } else {
          console.error("action.verification: 1 et 1 seule condition possible par vérification. Mais plusieurs vérifications possibles par action.");
        }
      });
      // version V8
    } else if (tour.commande.actionChoisie.action.phasePrerequis?.length) {
      resultatPrerequis = this.ins.executerInstructions(tour.commande.actionChoisie.action.phasePrerequis, tour, tour.commande.evenement, undefined);
      tour.commande.sortie += resultatPrerequis.sortie;
      refus = resultatPrerequis.refuse;
    }

    // si la commande est refusée, terminer le tour
    if (refus) {
      // cloturer le tour
      tour.phase = PhaseTour.fin;
    }

    // si le déroulement a été interrompu
    if (resultatPrerequis?.interrompreBlocInstruction) {
      this.creerInterruptionTour(tour, resultatPrerequis);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }
  }

  /** Exécuter la phase « exécution » du tour. */
  private executerPhaseExecution(tour: ContexteTour) {
    // console.warn("@@ phase exécuter @@");
    // PHASE EXÉCUTER l’action

    // s’il s’agit d’une commande qui déplace le joueur, on remplit origine, destination et orientation
    // (on le fait à nouveau car la phase avant pourrait avoir changé des choses…)
    if (tour.commande.actionChoisie.action.destinationDeplacement) {
      this.ins.determinerDeplacementVers(tour.commande.actionChoisie.action.destinationDeplacement, tour);
    }

    // const resultatExecuter = this.executerAction(tour.commande.actionChoisie, tour, tour.commande.evenement);
    const resultatExecution = this.ins.executerInstructions(tour.commande.actionChoisie.action.phaseExecution, tour, tour.commande.evenement, undefined);
    tour.commande.sortie += resultatExecution.sortie;

    // si le déroulement a été interrompu
    if (resultatExecution.interrompreBlocInstruction) {
      this.creerInterruptionTour(tour, resultatExecution);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }
  }

  /** Exécuter la phase « après » du tour. */
  private executerPhaseApres(tour: ContexteTour) {
    // console.warn("@@ phase après @@");
    // ÉVÈNEMENT APRÈS la commande
    let resultatApres = new Resultat(true, "", 0);
    // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
    const declenchementsApres = this.dec.apres(tour.commande.evenement);


    // vérifier si la première instruction est un "continuer l'action avant"
    if (declenchementsApres.length) {
      let phaseTerminerActionAvantRegleApres = false;
      // éviter de faire le test 2x...
      if (tour.phase == PhaseTour.apres) {
        // tester si la première instruction est un "continuer l'action avant"
        for (let index = 0; index < declenchementsApres.length; index++) {
          const declenchement = declenchementsApres[index];
          if (declenchement.instructions.length > 0 && declenchement.instructions[0].instruction) {
            const premiereInstruction = declenchement.instructions[0].instruction;
            if (premiereInstruction.infinitif == 'continuer' &&
              premiereInstruction.sujet?.nom?.toLocaleLowerCase() == 'action' &&
              premiereInstruction.sujet?.epithete?.toLocaleLowerCase() == 'avant') {
              phaseTerminerActionAvantRegleApres = true;
            }
          }
        }
      }

      // si on doit terminer l'action avant la règle après, passer à la phase terminer, on reviendra ici après
      if (phaseTerminerActionAvantRegleApres) {
        tour.phase = PhaseTour.apres_a_traiter_apres_terminer;
        this.executerLaPhaseSuivante(tour);
        // sinon exécuter la règle après
      } else {
        // éxécuter les règles déclenchées
        for (let index = 0; index < declenchementsApres.length; index++) {
          const declenchement = declenchementsApres[index];
          const sousResultatApres = this.ins.executerInstructions(declenchement.instructions, tour, tour.commande.evenement, declenchement.declenchements);
          resultatApres.sortie += sousResultatApres.sortie;
          resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
          resultatApres.nombre += sousResultatApres.nombre;
          // resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || (sousResultatApres.terminerAvantRegle && !declenchement.estRegleActionQuelconque);
          // resultatApres.terminerAvantRegleGenerique = resultatApres.terminerAvantRegleGenerique || (sousResultatApres.terminerAvantRegle && declenchement.estRegleActionQuelconque);
          resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || (sousResultatApres.terminerApresRegle && !declenchement.estRegleActionQuelconque);
          resultatApres.terminerApresRegleGenerique = resultatApres.terminerApresRegleGenerique || (sousResultatApres.terminerApresRegle && declenchement.estRegleActionQuelconque);

          // vérifier s’il y a une interruption
          if (sousResultatApres.interrompreBlocInstruction) {
            InterruptionsUtils.definirProprietesInterruptionSousResultatAuResultat(resultatApres, sousResultatApres);
            if (declenchementsApres.length > 1) {
              this.jeu.tamponConseils.push("Déclenchement règle après: l’instruction choisir risque de ne pas fonctionner correctement si plusieurs règles « après » se déclenchent pour le même évènement.");
            }
          }
        } // fin exécution des instructions des règles après

        // sortie règle après
        tour.commande.sortie += resultatApres.sortie;

        // si on a été interrompu
        if (resultatApres.interrompreBlocInstruction) {
          if (tour.phase == PhaseTour.continuer_apres) {
            tour.phase = PhaseTour.continuer_apres_interrompu;
          } else {
            tour.phase = PhaseTour.apres_interrompu;
          }
          this.creerInterruptionTour(tour, resultatApres);
          //  - sinon on n'a pas été interrompu
        } else {

          // Normalement on n’exécute pas la phase « terminer » s’il y a une règle « après », sauf si demandé explicitement
          // ou si aucune sortie
          // => exécuter la phase « terminer » après règle « après » ?
          // rem: si règle générique demande de continuer, on le fait que si elle est toute seule sinon on tient compte des autres règles
          if (!resultatApres.sortie || resultatApres.terminerApresRegle || (resultatApres.terminerApresRegleGenerique && declenchementsApres.length == 1)) {
            //on est déjà en phase après, rien à faire pour passer en phase terminer.
          } else {
            // case normal: on passe directement en phase fin
            tour.phase = PhaseTour.fin;
          }
          this.executerLaPhaseSuivante(tour);
        }

      }

      // Pas de règle « après » : on exécute la phase suivante
    } else {
      // exécuter la phase suivante du tour
      // (on n'a pas pu être interrompu ici puisque pas de règle après donc pas d'instructions)
      this.executerLaPhaseSuivante(tour);
    }
  }

  /** Exécuter la phase « épilogue » (terminer) du tour. */
  private executerPhaseEpilogue(tour: ContexteTour) {
    // console.warn("@@ phase terminer @@");

    // PHASE TERMINER l'action (sans règle « après »)
    const resultatFinaliser = this.finaliserAction(tour.commande.actionChoisie, tour, tour.commande.evenement);
    tour.commande.sortie += resultatFinaliser.sortie;

    // si le déroulement a été interrompu
    if (resultatFinaliser.interrompreBlocInstruction) {
      this.creerInterruptionTour(tour, resultatFinaliser);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }
  }

  private finaliserAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.phaseEpilogue, contexteTour, evenement, undefined);
    return resultat;
  }

  private creerInterruptionTour(tour: ContexteTour, resultat: Resultat) {
    InterruptionsUtils.definirProprietesInterruptionResultatAuTour(tour, resultat);
    this.jeu.tamponInterruptions.push(InterruptionsUtils.creerInterruptionContexteTourOuRoutine(tour, TypeContexte.tour));
  }

}