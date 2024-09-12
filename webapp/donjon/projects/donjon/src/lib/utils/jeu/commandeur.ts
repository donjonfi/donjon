import { ContexteTour, PhaseTour } from '../../models/jouer/contexte-tour';
import { TypeContexte } from '../../models/jeu/interruption';

import { ActionCeciCela } from '../../models/compilateur/action';
import { ActionsUtils } from './actions-utils';
import { AleatoireUtils } from './aleatoire-utils';
import { AnalyseurCommunUtils } from '../compilation/analyseur/analyseur-commun-utils';
import { CandidatCommande } from '../../models/jouer/candidat-commande';
import { ClasseUtils } from '../commun/classe-utils';
import { CommandeurDecomposer } from './commandeur.decomposer';
import { CommandeurTour } from './commandeur.tour';
import { Compteur } from '../../models/compilateur/compteur';
import { ContexteCommande } from '../../models/jouer/contexte-commande';
import { Debogueur } from './debogueur';
import { Declencheur } from './declencheur';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Evenement } from '../../models/jouer/evenement';
import { Instructions } from './instructions';
import { InterruptionsUtils } from './interruptions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation } from '../../models/jeu/localisation';
import { Objet } from '../../models/jeu/objet';
import { Resultat } from '../../models/jouer/resultat';
import { RoutineSimple } from '../../models/compilateur/routine-simple';
import { TypeEvenement } from '../../models/jouer/type-evenement';

export class Commandeur {

  /** Élements du jeu Utils */
  private eju: ElementsJeuUtils;
  /** Actions Utils */
  private act: ActionsUtils;
  /** Débogueur */
  private deb: Debogueur;

  private comTour: CommandeurTour;

  private premiereIncomprehension = true;

  constructor(
    private jeu: Jeu,
    private ins: Instructions,
    private dec: Declencheur,
    private verbeux: boolean,
    private debogueurActif: boolean = false,
  ) {
    this.comTour = new CommandeurTour(this.jeu, this.ins, this.dec, this.verbeux);
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
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


        // TODO: demander quelle découpe est correcte

        // les 2 candidats ont le même score
        if (ctxCmd.candidats[0].score == ctxCmd.candidats[1].score) {
          this.jeu.ajouterErreur("commandeur: 2 candidats ont le même score pour la découpe de la commande. Par la suite je demanderai lequel choisir.");
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
        this.jeu.ajouterErreur("Commandeur: executerCommande: J’ai plus de 2 candidats, ça n’est pas prévu !");
      }
      // débogueur: changer le monde (uniquement si le débogueur est actif)
    } else if (commande.match(/^déboguer (changer|déplacer|effacer|vider|dire) /) && this.debogueurActif) {
      let instructionDecomposee = AnalyseurCommunUtils.decomposerInstructionSimple(commande.slice('déboguer'.length).trim());

      // instruction simple a été trouvée
      if (instructionDecomposee?.infinitif.match(/^(changer|déplacer|effacer|vider|dire)/)) {
        let instruction = AnalyseurCommunUtils.creerInstructionSimple(instructionDecomposee);
        let sousContexteTour = new ContexteTour(undefined, undefined);
        const resultat = this.ins.executerInstructions([instruction], sousContexteTour, undefined, undefined);
        if (resultat.succes) {
          if (resultat.sortie?.length) {
            ctxCmd.sortie = resultat.sortie;
          } else {
            ctxCmd.sortie = "Instruction appliquée.\n";
          }
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
      if (this.premiereIncomprehension) {
        this.premiereIncomprehension = false;
        ctxCmd.sortie += "Voici des exemples de commandes que je comprends :\n";
        ctxCmd.sortie += "{t}- {-aller vers le nord-} ou l’abréviation {-n-}\n";
        ctxCmd.sortie += "{t}- {-examiner le radiateur-} ou {-ex radiateur-}\n";
        ctxCmd.sortie += "{t}- {-prendre la cerise-} ou {-p cerise-}\n";
        ctxCmd.sortie += "{t}- {-parler avec le capitaine concernant le trésor perdu-}\n";
        ctxCmd.sortie += "{t}- {-interroger magicienne concernant bague-}\n";
        ctxCmd.sortie += "{t}- {-donner l’épée au forgeron-} ou {-do épée à forgeron-}\n";
        ctxCmd.sortie += "{t}- {-effacer l’écran-} ou {-ef-}\n";
        ctxCmd.sortie += "{t}- {-aide montrer-} ou {-? montrer-}\n";
      } else {
        // ctxCmd.sortie += "Vous pouvez entrer la commande {-aide-}.\n";
      }
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
      let ceciRefuse: ElementJeu | Compteur | Localisation | Intitule = null;
      if (candidatCommande.correspondCeci) {
        if (candidatCommande.correspondCeci.nbCor) {
          // élément
          if (candidatCommande.correspondCeci.elements.length) {
            ceciRefuse = candidatCommande.correspondCeci.elements[0];
            // si on interagit avec l’élément, on le connaît
            this.jeu.etats.ajouterEtatIdElement(ceciRefuse as ElementJeu, this.jeu.etats.connuID, this.eju);
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
      let celaRefuse: ElementJeu | Compteur | Localisation | Intitule = null;
      if (candidatCommande.correspondCela) {
        if (candidatCommande.correspondCela.nbCor) {
          // élément
          if (candidatCommande.correspondCela.elements.length) {
            celaRefuse = candidatCommande.correspondCela.elements[0];
            // si on interagit avec l’élément, on le connaît
            this.jeu.etats.ajouterEtatIdElement(celaRefuse as ElementJeu, this.jeu.etats.connuID, this.eju);
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
      ctx.commandeValidee = false;
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
      ctx.commandeValidee = false;

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


      // TODO: demander quel objet prendre !

      if (candidatActionChoisi.ceci?.length > 1) {
        ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + candidatCommande.ceciIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
        indexCeci = Math.floor(AleatoireUtils.nombre() * candidatActionChoisi.ceci.length);
      }
      if (candidatActionChoisi.cela?.length > 1) {
        ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + candidatCommande.celaIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
        indexCela = Math.floor(AleatoireUtils.nombre() * candidatActionChoisi.cela.length);
      }

      const actionChoisie = new ActionCeciCela(candidatActionChoisi.action, (candidatActionChoisi.ceci ? candidatActionChoisi.ceci[indexCeci] : null), (candidatActionChoisi.cela ? candidatActionChoisi.cela[indexCela] : null));

      // les éléments avec lesquels ont interagit sont connus.
      if (actionChoisie.ceci) {
        if (ClasseUtils.heriteDe(actionChoisie.ceci.classe, EClasseRacine.element)) {
          // si on interagit avec l’élément, on le connaît
          this.jeu.etats.ajouterEtatIdElement(actionChoisie.ceci as ElementJeu, this.jeu.etats.connuID, this.eju);
        }
        if (candidatActionChoisi.cela) {
          if (ClasseUtils.heriteDe(actionChoisie.cela.classe, EClasseRacine.element)) {
            // si on interagit avec l’élément, on le connaît
            this.jeu.etats.ajouterEtatIdElement(actionChoisie.cela as ElementJeu, this.jeu.etats.connuID, this.eju);
          }
        }
      }

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

      // éviter « aller en le haut » et « aller au le nord ».
      ctx.evenement.commandeComprise = ctx.evenement.commandeComprise
        .replace("aller en {/le ", "aller {/en ")
        .replace("aller au {/le ", "aller {/au ")
        .replace("aller {/l'", "aller {/à l’");

      ctx.actionChoisie = actionChoisie;

    }
  }

  public continuerLeTourInterrompu(tour: ContexteTour): string {
    return this.comTour.continuerLeTourInterrompu(tour);
  }

  public executerRoutine(routine: RoutineSimple): string {
    let ctxTour = new ContexteTour(undefined, undefined);
    ctxTour.commande = new ContexteCommande();
    ctxTour.commande.evenement = new Evenement(TypeEvenement.routine, routine.titre);
    ctxTour.commande.sortie = "";
    ctxTour.phase = PhaseTour.execution;
    const resultatRoutine = this.ins.executerInstructions(routine.instructions, ctxTour, ctxTour.commande.evenement, undefined);
    if (resultatRoutine.interrompreBlocInstruction) {
      this.creerInterruptionRoutine(ctxTour, resultatRoutine);
    }
    return resultatRoutine.sortie;
  }

  public continuerRoutineInterrompue(ctxTour: ContexteTour): string {
    console.warn("@@ continuer la routine interrompue @@ reste=", ctxTour.reste);
    // // on a déjà affiché la sortie de la partie précédente de la routine donc on peut la vider
    // tour.commande.sortie = "";
    // terminer les instructions de la routine interrompue
    const resultatReste = this.ins.executerInstructions(ctxTour.reste, ctxTour, ctxTour.commande.evenement, undefined);
    if (resultatReste.interrompreBlocInstruction) {
      this.creerInterruptionRoutine(ctxTour, resultatReste);
    }
    return resultatReste.sortie;
  }



  private creerInterruptionRoutine(tour: ContexteTour, resultat: Resultat) {
    InterruptionsUtils.definirProprietesInterruptionResultatAuTour(tour, resultat);
    this.jeu.tamponInterruptions.push(InterruptionsUtils.creerInterruptionContexteTourOuRoutine(tour, TypeContexte.routine));
  }

  /**
   * Essayer de trouver une action correspondant à la commande.
   * Si une action est trouvée, elle est exécutée.
   * @param indexCandidat index du candidat à tester.
   * @param ctx contexte de la commande avec les candidats et la sortie.
   */
  private essayerLaCommande(indexCandidat: number, ctx: ContexteCommande): void {

    // A) ESSAYER PARMIS LES COMMANDES SPÉCIALES
    this.essayercommandeDeboguer(ctx.candidats[indexCandidat], ctx);

    // B) ESSAYER PARMIS LES ACTIONS CHARGÉES DYNAMIQUEMENT
    if (!ctx.commandeValidee) {
      this.chercherParmisLesActions(ctx.candidats[indexCandidat], ctx);
      if (ctx.actionChoisie) {
        this.comTour.demarrerNouveauTour(ctx);
      }
    }
  }

  /** Essayer d’exécuter la commande spéciale correspondante */
  private essayercommandeDeboguer(candidatCommande: CandidatCommande, ctx: ContexteCommande): void {
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
      } else if (candidatCommande.isCeciV1 && !candidatCommande.isCelaV1) {
        ctx.sortie = this.deb.deboguer(candidatCommande.els);
        ctx.commandeValidee = true; // la commande a été validée et exécutée
      }
    }
  }

  // private executerAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
  //   const resultat = this.ins.executerInstructions(action.action.instructions, contexteTour, evenement, undefined);
  //   return resultat;
  // }


}
