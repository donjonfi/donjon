import { ContexteTour, PhaseTour } from '../../models/jouer/contexte-tour';
import { Interruption, TypeContexte } from '../../models/jeu/interruption';

import { ActionCeciCela } from '../../models/compilateur/action';
import { ActionsUtils } from './actions-utils';
import { AleatoireUtils } from './aleatoire-utils';
import { AnalyseurCommunUtils } from '../compilation/analyseur/analyseur-commun-utils';
import { CandidatCommande } from '../../models/jouer/candidat-commande';
import { ClasseUtils } from '../commun/classe-utils';
import { CommandeurDecomposer } from './commandeur.decomposer';
import { ConditionsUtils } from './conditions-utils';
import { ContexteCommande } from '../../models/jouer/contexte-commande';
import { Debogueur } from './debogueur';
import { Declencheur } from './declencheur';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Evenement } from '../../models/jouer/evenement';
import { Instructions } from './instructions';
import { InterruptionsUtils } from './interruptions-utils';
import { Jeu } from '../../models/jeu/jeu';
import { Objet } from '../../models/jeu/objet';
import { Resultat } from '../../models/jouer/resultat';
import { TypeEvenement } from '../../models/jouer/type-evenement';

export class Commandeur {

  /** Élements du jeu Utils */
  private eju: ElementsJeuUtils;
  /** Conditions Utils */
  private cond: ConditionsUtils;
  /** Actions Utils */
  private act: ActionsUtils;
  /** Débogueur */
  private deb: Debogueur;

  constructor(
    private jeu: Jeu,
    private ins: Instructions,
    private dec: Declencheur,
    private verbeux: boolean,
    private debogueurActif: boolean = false,
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.act = new ActionsUtils(this.jeu, this.verbeux);
    this.deb = new Debogueur(this.jeu, this.ins, this.verbeux);
  }

  /**
   * Décomposer la commande et renvoyer les candidats trouvés.
   */
  public decomposerCommande(commande: string): ContexteCommande {
    return CommandeurDecomposer.decomposerCommande(commande, this.eju, this.act);
  }

  /** Exécuter la commande */
  public executerCommande(commande: string): ContexteCommande {

    // COMPRENDRE LA COMMANDE
    // > décomposer la commande
    let ctxCmd = CommandeurDecomposer.decomposerCommande(commande, this.eju, this.act);

    // si on a réussi à décomposer la commande
    if (ctxCmd.candidats.length > 0) {

      // un seul candidat, c’est forcément lui
      if (ctxCmd.candidats.length == 1) {
        this.essayerLaCommande(0, ctxCmd);
      } else if (ctxCmd.candidats.length == 2) {

        // les 2 candidats ont le même score
        if (ctxCmd.candidats[0].score == ctxCmd.candidats[1].score) {
          this.jeu.tamponErreurs.push("commandeur: 2 candidats ont le même score pour la découpe de la commande. Par la suite je demanderai lequel choisir.");
          this.essayerLaCommande(0, ctxCmd);
          // si le premier candidat n’a pas été validé, essayer le 2e
          if (!ctxCmd.commandeValidee) {
            this.essayerLaCommande(1, ctxCmd);
          }
          // le premier candidat a un score plus élevé
        } else {
          this.essayerLaCommande(0, ctxCmd);
          // si le premier candidat n’a pas été validé, essayer le 2e
          if (!ctxCmd.commandeValidee) {
            this.essayerLaCommande(1, ctxCmd);
          }
        }
        // s’il y a plus de 2 candidats, c’est un cas qui n’est pas pris en charge (ça ne devrait pas arriver)
      } else {
        this.jeu.tamponErreurs.push("Commandeur: executerCommande: J’ai plus de 2 candidats, ça n’est pas prévu !");
      }
      // débogueur: changer le monde (uniquement si le débogueur est actif)
      // } else if (commande.match(/^déboguer (changer|déplacer|effacer|vider) /) && this.debogueurActif) {
    } else if (commande.match(/^déboguer (changer|déplacer|effacer|vider) /)) {

      let instructionDecomposee = AnalyseurCommunUtils.decomposerInstructionSimple(commande.slice('déboguer'.length).trim());

      // instruction simple a été trouvée
      if (instructionDecomposee?.infinitif.match(/^(changer|déplacer|effacer|vider)/)) {
        let instruction = AnalyseurCommunUtils.creerInstructionSimple(instructionDecomposee);
        let sousContexteTour = new ContexteTour(undefined, undefined);
        const resultat = this.ins.executerInstructions([instruction], sousContexteTour, undefined, undefined);
        if (resultat.succes) {
          ctxCmd.sortie = "Instruction appliquée.\n";
        } else {
          ctxCmd.sortie = "L’instruction n’a pas pu être appliquée.\n";
          sousContexteTour.erreurs.forEach(erreur => {
            ctxCmd.sortie += `{+${erreur}+}{n}`;
          });
        }
      } else {
        ctxCmd.sortie = "Désolé, cette instruction n’est pas prise en charge.\n";
      }
      // la commande n’a pas pu être décomposée
    } else {
      ctxCmd.sortie = "Désolé, je n'ai pas compris la commande « " + commande + " ».\n";
      ctxCmd.sortie += "Voici des exemples de commandes que je comprend :\n";
      ctxCmd.sortie += "{t}- {-aller vers le nord-} ou l’abréviation {-n-}\n";
      ctxCmd.sortie += "{t}- {-examiner le radiateur-} ou {-ex radiateur-}\n";
      ctxCmd.sortie += "{t}- {-prendre la cerise-} ou {-p cerise-}\n";
      ctxCmd.sortie += "{t}- {-parler avec le capitaine concernant le trésor perdu-}\n";
      ctxCmd.sortie += "{t}- {-interroger magicienne concernant bague-}\n";
      ctxCmd.sortie += "{t}- {-donner l’épée au forgeron-} ou {-do épée à forgeron-}\n";
      ctxCmd.sortie += "{t}- {-effacer l’écran-} ou {-ef-}\n";
      ctxCmd.sortie += "{t}- {-aide montrer-} ou {-? montrer-}\n";
    }
    return ctxCmd;
  }

  private chercherParmisLesActions(candidatCommande: CandidatCommande, ctx: ContexteCommande): void {

    let actionsCeciCela = this.act.trouverActionPersonnalisee(candidatCommande.els, candidatCommande.correspondCeci, candidatCommande.correspondCela);

    // =====================================================
    // A. VERBE PAS CONNU
    // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
    // =====================================================
    if (actionsCeciCela === null || actionsCeciCela.length === 0) {

      // ce candidat de commande n’a pas été validé

      const explicationRefu = this.act.obtenirRaisonRefuCommande(candidatCommande.els, candidatCommande.correspondCeci, candidatCommande.correspondCela);

      // correspondance CECI
      let ceciRefuse = null;
      if (candidatCommande.correspondCeci) {
        if (candidatCommande.correspondCeci.nbCor) {
          // élément
          if (candidatCommande.correspondCeci.elements.length) {
            ceciRefuse = candidatCommande.correspondCeci.elements[0];
            // compteur
          } else if (candidatCommande.correspondCeci.compteurs.length) {
            ceciRefuse = candidatCommande.correspondCeci.compteurs[0];
            // autre (direction)
          } else {
            ceciRefuse = candidatCommande.correspondCeci.localisation;
          }
          // non trouvé => intitulé
        } else {
          ceciRefuse = candidatCommande.correspondCeci?.intitule ?? null;
        }
      }

      // correspondance CELA
      let celaRefuse = null;
      if (candidatCommande.correspondCela) {
        if (candidatCommande.correspondCela.nbCor) {
          // élément
          if (candidatCommande.correspondCela.elements.length) {
            celaRefuse = candidatCommande.correspondCela.elements[0];
            // compteur
          } else if (candidatCommande.correspondCela.compteurs.length) {
            celaRefuse = candidatCommande.correspondCela.compteurs[0];
            // autre (direction)
          } else {
            celaRefuse = candidatCommande.correspondCela.localisation;
          }
          // non trouvé => intitulé
        } else {
          celaRefuse = candidatCommande.correspondCela.intitule;
        }
      }

      // Renvoyer l’explication du refu.
      const ctxRefu = new ContexteTour(ceciRefuse, celaRefuse);
      ctx.sortie = this.ins.dire.calculerTexteDynamique(explicationRefu, 0, undefined, ctxRefu, undefined, undefined);

      // regarder si de l’aide existe pour cet infinitif
      const aide = this.jeu.aides.find(x => x.infinitif === candidatCommande.els.infinitif);
      if (aide) {
        // Spécifier qu’une page d’aide existe pour la commande.
        ctx.sortie += "{u}{/Vous pouvez entrer « {-aide " + candidatCommande.els.infinitif + "-} » pour afficher l’aide de la commande./}";
      }

      // =============================================================================
      // C. PLUSIEURS ACTIONS SE DÉMARQUENT (on ne sait pas les départager)
      // =============================================================================
    } else if (actionsCeciCela.length > 1) {

      // ce candidat de commande ne peut pas être exécuté.
      ctx.sortie = "{+Erreur: plusieurs actions avec la même priorité trouvées (" + candidatCommande.els.infinitif + ").+}";

      // =============================================================================
      // D. UNE ACTION SE DÉMARQUE (ont a trouvé l’action)
      // =============================================================================
    } else {

      // la commande a été validée et sera exécutée
      ctx.commandeValidee = true;
      const candidatActionChoisi = actionsCeciCela[0];

      // il peut y avoir plusieurs correspondances avec le même score pour un objet.
      // Ex: il y a une pomme par terre et des pommes sur le pommier on on fait « prendre pomme ».
      // => Dans ce cas, on prend un élément au hasard pour que le jeu ne soit pas bloqué.
      let indexCeci = 0;
      let indexCela = 0;

      if (candidatActionChoisi.ceci?.length > 1) {
        ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + candidatCommande.ceciIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
        indexCeci = Math.floor(AleatoireUtils.nombre() * candidatActionChoisi.ceci.length);
      }
      if (candidatActionChoisi.cela?.length > 1) {
        ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + candidatCommande.celaIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
        indexCela = Math.floor(AleatoireUtils.nombre() * candidatActionChoisi.cela.length);
      }

      const actionChoisie = new ActionCeciCela(candidatActionChoisi.action, (candidatActionChoisi.ceci ? candidatActionChoisi.ceci[indexCeci] : null), (candidatActionChoisi.cela ? candidatActionChoisi.cela[indexCela] : null));

      const isCeciV2 = actionChoisie.ceci ? true : false;
      let ceciQuantiteV2 = candidatCommande.ceciQuantiteV1;
      // transformer « -1 » en la quantité de l’objet
      if (ceciQuantiteV2 === -1 && actionChoisie.ceci && ClasseUtils.heriteDe(actionChoisie.ceci.classe, EClasseRacine.objet)) {
        ceciQuantiteV2 = (actionChoisie.ceci as Objet).quantite;
      }

      const ceciNomV2 = isCeciV2 ? actionChoisie.ceci.nom : null;
      const ceciClasseV2 = (isCeciV2 ? actionChoisie.ceci.classe : null)

      const isCelaV2 = actionChoisie.cela ? true : false;
      let celaQuantiteV2 = candidatCommande.celaQuantiteV1;
      // transformer « -1 » en la quantité de l’objet
      if (celaQuantiteV2 === -1 && actionChoisie.cela && ClasseUtils.heriteDe(actionChoisie.cela.classe, EClasseRacine.objet)) {
        celaQuantiteV2 = (actionChoisie.cela as Objet).quantite;
      }
      const celaNomV2 = isCelaV2 ? actionChoisie.cela.nom : null;
      const celaClasseV2 = (isCelaV2 ? actionChoisie.cela.classe : null)

      // mettre à jour l'évènement avec les éléments trouvés
      ctx.evenement = new Evenement(
        TypeEvenement.action,
        // verbe
        actionChoisie.action.infinitif,
        // ceci
        isCeciV2, candidatCommande.els.preposition0, ceciQuantiteV2, ceciNomV2, ceciClasseV2,
        // cela
        isCelaV2, candidatCommande.els.preposition1, celaQuantiteV2, celaNomV2, celaClasseV2,
        // commande correspondante
        (actionChoisie.action.infinitif + (candidatCommande.els.preposition0 ? (" " + candidatCommande.els.preposition0) : '') + (actionChoisie.ceci ? (' {/' + actionChoisie.ceci.intitule + '/}') : '') + (candidatCommande.els.preposition1 ? (' ' + candidatCommande.els.preposition1) : '') + (actionChoisie.cela ? (' {/' + actionChoisie.cela.intitule + '/}') : ''))
      );

      ctx.actionChoisie = actionChoisie;

    }
  }

  private demarrerNouveauTour(commande: ContexteCommande) {
    // créer le contexte du tour
    const contexteTour = new ContexteTour(commande.actionChoisie.ceci, commande.actionChoisie.cela);
    contexteTour.commande = commande;

    this.executerLaPhaseSuivante(contexteTour);
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
        InterruptionsUtils.definirInterruptionSousResultat(resultatAvant, sousResultatAvant);
        if (declenchementsAvant.length > 1) {
          this.jeu.tamponConseils.push("Déclanchement règle avant: l’instruction choisir risque de ne pas fonctionner correctement si plusieurs règles « avant » se déclanchent pour le même évènement.");
        }
      }
      if (resultatAvant.arreterApresRegle) {
        break;
      }
    }

    // si on a fait appel à l’instruction « arrêter l’action »
    if (resultatAvant.arreterApresRegle === true) {
      // cloturer le tour
      tour.phase = PhaseTour.fin;
    }
    // si le déroulement a été interrompu
    if (resultatAvant.interrompreBlocInstruction) {
      InterruptionsUtils.definirInterruptionTour(tour, resultatAvant);
      tour.phase = PhaseTour.avant_interrompu; // on pourrait encore terminer dans la 2e partie de la règle.
      this.executerInterruption(tour);
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
      InterruptionsUtils.definirInterruptionTour(tour, resultatPrerequis);
      this.executerInterruption(tour);
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
      InterruptionsUtils.definirInterruptionTour(tour, resultatExecution);
      this.executerInterruption(tour);
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
            InterruptionsUtils.definirInterruptionSousResultat(resultatApres, sousResultatApres);
            if (declenchementsApres.length > 1) {
              this.jeu.tamponConseils.push("Déclanchement règle après: l’instruction choisir risque de ne pas fonctionner correctement si plusieurs règles « après » se déclanchent pour le même évènement.");
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
          InterruptionsUtils.definirInterruptionTour(tour, resultatApres);
          this.executerInterruption(tour);
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

    // // s’il restait à afficher la sortie de la règle « après » (commande « terminer avant »)
    // if (tour.phase == PhaseTour.terminer_avant_sortie_apres) {
    //   tour.commande.sortie += tour.resultatRegleApres.sortie;
    //   tour.resultatRegleApres = undefined;
    // }

    // si le déroulement a été interrompu
    if (resultatFinaliser.interrompreBlocInstruction) {
      InterruptionsUtils.definirInterruptionTour(tour, resultatFinaliser);
      this.executerInterruption(tour);
    } else {
      // sinon on passe à la phase suivante du tour.
      this.executerLaPhaseSuivante(tour);
    }
  }



  private executerInterruption(tour: ContexteTour) {
    // console.warn("+interruption+");
    const interruption = new Interruption(tour.typeInterruption, TypeContexte.tour);
    interruption.tour = tour;
    interruption.choix = tour.choix;
    interruption.messageAttendre = tour.messageAttendre;
    interruption.nbSecondesAttendre = tour.nbSecondesAttendre;
    interruption.nbToursAnnuler = tour.nbToursAnnuler;
    this.jeu.tamponInterruptions.push(interruption);
  }

  public continuerLeTourInterrompu(tour: ContexteTour): string {
    //  console.warn("@@ continuer le tour interrompu @@ reste=", tour.reste);

    // on a déjà affiché la sortie de la partie précédente de la commande donc on peut la vider
    tour.commande.sortie = "";

    // terminer les instructions de la phase interrompue
    // TODO: nombre de déclanchements s’il s’agit d’une règle
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
      InterruptionsUtils.definirInterruptionTour(tour, resultatReste);
      this.executerInterruption(tour);
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
        // passer à la phase « fin »
        tour.phase = PhaseTour.fin;
        break;
      // ÉPLILOGUE (TERMINER)
      case PhaseTour.epilogue:
        // case PhaseTour.terminer_avant_sortie_apres:
        // passer à la phase « fin »
        tour.phase = PhaseTour.fin;
        break;
      case PhaseTour.terminer_avant_traiter_apres:
        tour.phase = PhaseTour.continuer_apres;
        this.executerPhaseApres(tour);
        break;
      // FIN
      case PhaseTour.fin:
        break;

      default:
        console.error("Phase inconnue:", tour.phase);
        break;
    }
  }

  /**
   * Essayer de trouver une action correspondant à la commande.
   * Si une action est trouvée, elle est exécutée.
   * @param indexCandidat index du candidat à tester.
   * @param ctx contexte de la commande avec les candidats et la sortie.
   */
  private essayerLaCommande(indexCandidat: number, ctx: ContexteCommande): void {

    // A) ESSAYER PARMIS LES COMMANDES SPÉCIALES
    this.essayercommandeSpeciale(ctx.candidats[indexCandidat], ctx);

    // B) ESSAYER PARMIS LES ACTIONS CHARGÉES DYNAMIQUEMENT
    if (!ctx.commandeValidee) {
      this.chercherParmisLesActions(ctx.candidats[indexCandidat], ctx);
      if (ctx.actionChoisie) {
        this.demarrerNouveauTour(ctx);
      }
    }
  }

  /** Essayer d’exécuter la commande spéciale correspondante */
  private essayercommandeSpeciale(candidatCommande: CandidatCommande, ctx: ContexteCommande): void {
    //   A) commande spéciale : déboguer
    if (candidatCommande.els.infinitif == 'déboguer') {
      // triche (avec fichier auto-commandes)
      if (candidatCommande.els.sujet?.nom == 'triche') {
        if (candidatCommande.els.sujet.epithete == 'auto') {
          ctx.sortie = '@auto-triche@';
          ctx.commandeValidee = true; // la commande a été validée et exécutée
        } else {
          ctx.sortie = '@triche@';
          ctx.commandeValidee = true; // la commande a été validée et exécutée
        }
        // déboguer un élément du jeu
      } else {
        ctx.sortie = this.deb.deboguer(candidatCommande.els);
        ctx.commandeValidee = true; // la commande a été validée et exécutée
      }
      // B) commande spéciale : sauver les commandes dans un fichier.
    } else if (candidatCommande.els.infinitif == 'sauver' && candidatCommande.els.sujet?.nom == 'commandes') {
      ctx.sortie = '@sauver-commandes@';
      ctx.commandeValidee = true; // la commande a été validée et exécutée
      // C) commande spéciale : émettre un son pour que le joueur puisse vérifier ses baffles.
    } else if (candidatCommande.els.infinitif == 'tester' && candidatCommande.els.sujet?.nom == 'audio') {
      ctx.sortie = this.ins.testerSon().sortie;
      ctx.commandeValidee = true; // la commande a été validée et exécutée
    } else if (candidatCommande.els.infinitif == 'nombre' && (candidatCommande.els.sujet?.nom == 'mots' || candidatCommande.els.sujet?.nom == 'caractères')) {
      ctx.sortie = '@statistiques@';
      ctx.commandeValidee = true; // la commande a été validée et exécutée
    }
  }

  // private executerAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
  //   const resultat = this.ins.executerInstructions(action.action.instructions, contexteTour, evenement, undefined);
  //   return resultat;
  // }

  private finaliserAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.phaseEpilogue, contexteTour, evenement, undefined);
    return resultat;
  }

}
