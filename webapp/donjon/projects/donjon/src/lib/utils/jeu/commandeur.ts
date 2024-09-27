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
import { QuestionCommande, QuestionsCommande } from '../../models/jouer/questions-commande';
import { Choix } from '../../models/compilateur/choix';

export class Commandeur {

  /** Élements du jeu Utils */
  private eju: ElementsJeuUtils;
  /** Actions Utils */
  private act: ActionsUtils;
  /** Débogueur */
  private deb: Debogueur;

  private comTour: CommandeurTour;

  private premiereIncomprehension = true;

  private correctionCommandeEnCours: ContexteCommande;

  private commandeActuelle: string | undefined;
  private commandePrecedente: string | undefined;
  private contexteActuel: ContexteCommande | undefined;
  private contextePrecedent: ContexteCommande | undefined;

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

  // Exécuter à nouveau la dernière commande
  public executerDerniereCommande(): ContexteCommande | undefined {
    let retVal: ContexteCommande | undefined;
    if (this.commandePrecedente) {
      this.correctionCommandeEnCours = this.contextePrecedent;
      console.warn("💙 commande précédente:", this.commandePrecedente, "et son contexte: ", this.contextePrecedent);
      retVal = this.executerCommande(this.commandePrecedente);
    }
    return retVal;
  }

  /**
   * Décomposer la commande et renvoyer les candidats trouvés.
   */
  public decomposerCommande(commande: string): ContexteCommande {
    return CommandeurDecomposer.decomposerCommande(commande, this.eju, this.act);
  }

  public setCorrectionCommande(commandeEnCours: ContexteCommande) {
    this.correctionCommandeEnCours = commandeEnCours;
  }

  /** Exécuter la commande */
  public executerCommande(commande: string): ContexteCommande {

    // sauver commande précédente pour commande "encore"
    this.commandePrecedente = this.commandeActuelle;
    this.commandeActuelle = commande;
    this.contextePrecedent = this.contexteActuel;
    this.contexteActuel = this.correctionCommandeEnCours;

    // COMPRENDRE LA COMMANDE
    // > décomposer la commande
    let ctxCmd = CommandeurDecomposer.decomposerCommande(commande, this.eju, this.act);

    if (this.correctionCommandeEnCours) {
      ctxCmd.questions = this.correctionCommandeEnCours.questions;
      this.correctionCommandeEnCours = undefined;
    }

    // si on a réussi à décomposer la commande
    if (ctxCmd.candidats.length > 0) {

      // un seul candidat, c’est forcément lui
      if (ctxCmd.candidats.length == 1) {
        this.essayerLaCommande(0, ctxCmd);
      } else if (ctxCmd.candidats.length == 2) {

        // les 2 candidats ont le même score
        if (ctxCmd.candidats[0].score == ctxCmd.candidats[1].score) {

          // déjà reçu une réponse
          if (ctxCmd.questions?.QcmDecoupe?.Reponse !== undefined) {
            // console.warn(`Réponse: ${ctxCmd.questions.QcmDecoupe.Reponse}`);
            this.essayerLaCommande(ctxCmd.questions.QcmDecoupe.Reponse, ctxCmd);
            // pas encore reçu de réponse
          } else {
            if (!ctxCmd.questions) {
              ctxCmd.questions = new QuestionsCommande();
            }
            // ajouter question concernant la découpe de la commande
            let qcmDecoupe = new QuestionCommande("Quelle commande voulez-vous appliquer ?");
            qcmDecoupe.Choix = [];
            ctxCmd.candidats.forEach(candidat => {
              let choix = new Choix([Commandeur.afficherDetailCommande(candidat, undefined)]);
              qcmDecoupe.Choix.push(choix);
            });
            ctxCmd.questions.QcmDecoupe = qcmDecoupe;
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

  private chercherParmiLesActions(candidatCommande: CandidatCommande, ctx: ContexteCommande): void {

    let actionsCeciCela = this.act.trouverActionPersonnalisee(candidatCommande.els, candidatCommande.correspondCeci, candidatCommande.correspondCela);

    // =====================================================
    // A. VERBE PAS CONNU
    // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
    // =====================================================
    if (actionsCeciCela === null || actionsCeciCela.length === 0) {

      // ce candidat de commande n’a pas été validé, obtenir la raison du refus
      const explicationRefus = this.act.obtenirRaisonRefusCommande(candidatCommande.els, candidatCommande.correspondCeci, candidatCommande.correspondCela);

      // verbe refusé mais verbe similaire trouvé => proposer alternative
      if (explicationRefus.startsWith("Verbes similaires:")) {
        const verbesSimilaires = explicationRefus.replace(/^Verbes similaires:(\w+)$/g, '$1');
        ctx.verbesSimilaires = verbesSimilaires.split(",");

        // verbe ou correspondance CECI/CELA refusés => donner l’explication
      } else {
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

        // Renvoyer l’explication du refus.
        const ctxRefus = new ContexteTour(ceciRefuse, celaRefuse);
        ctx.commandeValidee = false;
        ctx.sortie = this.ins.dire.calculerTexteDynamique(explicationRefus, 0, undefined, ctxRefus, undefined, undefined);

        // regarder si de l’aide existe pour cet infinitif
        const aide = this.jeu.aides.find(x => x.infinitif === candidatCommande.els.infinitif);
        if (aide) {
          // Spécifier qu’une page d’aide existe pour la commande.
          ctx.sortie += "{u}{/Entrez « {-aide " + candidatCommande.els.infinitif + "-} » pour afficher l’aide de cette action./}";
        }
      }

      // =============================================================================
      // C. PLUSIEURS ACTIONS SE DÉMARQUENT (on ne sait pas les départager)
      // =============================================================================
    } else if (actionsCeciCela.length > 1) {
      ctx.commandeValidee = false;

      // ce candidat de commande ne peut pas être exécuté.
      ctx.sortie = "{+Erreur: plusieurs actions avec la même priorité trouvées (" + candidatCommande.els.infinitif + ").+}";

      // =============================================================================
      // D. UNE ACTION SE DÉMARQUE (on a trouvé l’action)
      // =============================================================================
    } else {

      const candidatActionChoisi = actionsCeciCela[0];

      // il peut y avoir plusieurs correspondances avec le même score pour un objet.
      // Ex1: le joueur veut prendre la « clé » mais il y a en a 2 : une clé verte et une clé rouge.
      // Ex2: il y a une pomme par terre et des pommes sur le pommier on on fait « prendre pomme ».
      // => Dans ce cas, on on va demander au joueur de choisir parmi les résultats avec le même score.

      // TODO: AFFICHER LOCALISATION DE L’OBJET?

      if (candidatActionChoisi.ceci?.length > 1 || candidatActionChoisi.cela?.length > 1) {
        // s’il y a plusieurs correspondances équivalentes pour ceci ET cela
        if (candidatActionChoisi.ceci?.length > 1 && candidatActionChoisi.cela?.length > 1) {
          // on a déjà précisé => appliqué la correction
          if (ctx.questions?.QcmCeciEtCela?.Reponse !== undefined) {
            // calcul index de ceci et cela
            const n = candidatActionChoisi.cela.length;
            const indexCeciChoisi = ctx.questions.QcmCeciEtCela.Reponse / n;
            const indexCelaChoisi = ctx.questions.QcmCeciEtCela.Reponse % n;
            candidatActionChoisi.ceci = [candidatActionChoisi.ceci[indexCeciChoisi]]
            candidatActionChoisi.cela = [candidatActionChoisi.cela[indexCelaChoisi]]
            // console.warn("Ceci et Cela choisi !");
            ctx.commandeValidee = true;
            // demander une précision
          } else {
            // ajouter question concernant complément direct
            // let qCeciCela = new QuestionCommande(`Il y a plusieurs correspondances pour {=${candidatCommande.ceciIntituleV1.toString()}=} et {=${candidatCommande.celaIntituleV1.toString()}=} :`);
            let qCeciCela = new QuestionCommande(`Comment dois-je interpréter votre commande ?`);
            qCeciCela.Choix = [];
            candidatActionChoisi.ceci.forEach(candidatCeci => {
              candidatActionChoisi.cela.forEach(candidatCela => {
                let choixCela = new Choix([
                  `${candidatActionChoisi.action.infinitif} ${candidatActionChoisi.action.prepositionCeci ? (candidatActionChoisi.action.prepositionCeci + ' ') : ''} {=${candidatCeci}=} ${candidatActionChoisi.action.prepositionCela} {=${candidatCela}=}`
                ]);
                qCeciCela.Choix.push(choixCela);
              });
            });
            if (!ctx.questions) {
              ctx.questions = new QuestionsCommande();
            }
            ctx.questions.QcmCeciEtCela = qCeciCela;
          }
          // s’il y a plusieurs correspondances équivalentes pour ceci
        } else if (candidatActionChoisi.ceci?.length > 1) {
          // on a déjà précisé => appliqué la correction
          if (ctx.questions?.QcmCeci?.Reponse !== undefined) {
            const indexCeciChoisi = ctx.questions.QcmCeci.Reponse;
            candidatActionChoisi.ceci = [candidatActionChoisi.ceci[indexCeciChoisi]]
            // console.warn("Ceci choisi !");
            ctx.commandeValidee = true;
            // demander une précision
          } else {
            // ajouter question concernant complément direct
            let qCeci = new QuestionCommande(`Comment dois-je interpréter votre commande ?`);
            qCeci.Choix = [];
            candidatActionChoisi.ceci.forEach(candidatCeci => {
              let choixCeci = new Choix([
                `${candidatActionChoisi.action.infinitif} ${candidatActionChoisi.action.prepositionCeci ? (candidatActionChoisi.action.prepositionCeci + ' ') : ''} {=${candidatCeci.intitule}=}`
              ]);
              if (candidatActionChoisi.cela?.length) {
                choixCeci.valeurs[0] += ` ${candidatActionChoisi.action.prepositionCela} ${candidatActionChoisi.cela[0].intitule}`
              }
              qCeci.Choix.push(choixCeci);
            });
            if (!ctx.questions) {
              ctx.questions = new QuestionsCommande();
            }
            ctx.questions.QcmCeci = qCeci;
          }
        } else if (candidatActionChoisi.cela?.length > 1) {
          // on a déjà précisé => appliqué la correction
          if (ctx.questions?.QcmCela?.Reponse !== undefined) {
            const indexCelaChoisi = ctx.questions.QcmCela.Reponse;
            candidatActionChoisi.cela = [candidatActionChoisi.cela[indexCelaChoisi]]
            // console.warn("Cela choisi !");
            ctx.commandeValidee = true;
            // demander une précision
          } else {
            // ajouter question concernant la découpe de la commande
            let qCela = new QuestionCommande(`Il y a plusieurs correspondances pour {+${candidatCommande.celaIntituleV1.toString()}+} :`);
            qCela.Choix = [];
            candidatActionChoisi.cela.forEach(candidatCela => {
              let choixCela = new Choix([
                `${candidatActionChoisi.action.infinitif} ${candidatActionChoisi.action.prepositionCeci ? (candidatActionChoisi.action.prepositionCeci + ' ') : ''} ${candidatActionChoisi.ceci[0].intitule} ${candidatActionChoisi.action.prepositionCela} {=${candidatCela.intitule}=}`
              ]);
              // let choixCela = new Choix([candidatCela.intitule.toString()]);
              qCela.Choix.push(choixCela);
            });
            if (!ctx.questions) {
              ctx.questions = new QuestionsCommande();
            }
            ctx.questions.QcmCela = qCela;
          }
        }
      } else {
        // la commande a été validée et sera exécutée
        ctx.commandeValidee = true;
      }

      if (ctx.commandeValidee) {
        // index sera toujours 0 étant donné la manip ci-dessus.
        const actionChoisie = new ActionCeciCela(candidatActionChoisi.action, (candidatActionChoisi.ceci ? candidatActionChoisi.ceci[0] : null), (candidatActionChoisi.cela ? candidatActionChoisi.cela[0] : null));

        // plus de question en suspend à destination du joueur
        ctx.questions = undefined;

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
   * @param ctxCmd contexte de la commande avec les candidats et la sortie.
   */
  private essayerLaCommande(indexCandidat: number, ctxCmd: ContexteCommande): void {

    // A) ESSAYER PARMI LES COMMANDES SPÉCIALES
    this.essayerCommandeDeboguer(ctxCmd.candidats[indexCandidat], ctxCmd);

    // B) ESSAYER PARMI LES ACTIONS CHARGÉES DYNAMIQUEMENT
    if (!ctxCmd.commandeValidee) {
      this.chercherParmiLesActions(ctxCmd.candidats[indexCandidat], ctxCmd);
      if (ctxCmd.actionChoisie) {
        this.comTour.demarrerNouveauTour(ctxCmd);
      } else if (ctxCmd.verbesSimilaires) {
        // correction infinitif déjà sélectionnée
        if (ctxCmd.questions?.QcmInfinitif?.Reponse !== undefined) {
          ctxCmd.candidats[indexCandidat].els.infinitif = ctxCmd.questions.QcmInfinitif.Choix[ctxCmd.questions.QcmInfinitif.Reponse].valeurs[0].toString();
          console.warn(`Verbe similaire choisi: ${ctxCmd.candidats[indexCandidat].els.infinitif}`);
          this.chercherParmiLesActions(ctxCmd.candidats[indexCandidat], ctxCmd);
          if (ctxCmd.actionChoisie) {
            this.comTour.demarrerNouveauTour(ctxCmd);
          }
          // correction infinitif à proposer
        } else {
          if (!ctxCmd.questions) {
            ctxCmd.questions = new QuestionsCommande();
          }

          // ajouter question concernant la découpe de la commande
          // let qI = new QuestionCommande(`J’ai trouvé ${(ctxCmd.verbesSimilaires.length > 1 ? "ces verbes similaires" : "ce verbe similaire")} car ${ctxCmd.candidats[indexCandidat].els.infinitif} m’est inconnu :`);
          let qI = new QuestionCommande(`Pouvez-vous confirmer le verbe ?`);
          ctxCmd.questions.QcmInfinitif = qI;
          qI.Choix = [];
          ctxCmd.verbesSimilaires.forEach(verbeSimilaire => {
            // let choix = new Choix([Commandeur.afficherDetailCommande(ctxCmd.candidats[indexCandidat], verbeSimilaire)]);
            let choix = new Choix([verbeSimilaire]);
            qI.Choix.push(choix);
          });
        }
      }
    }
  }

  /** Essayer d’exécuter la commande spéciale correspondante */
  private essayerCommandeDeboguer(candidatCommande: CandidatCommande, ctx: ContexteCommande): void {
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

  public static afficherDetailCommande(candidat: CandidatCommande, forcerInfinitif: string | undefined): string {
    let retVal = "";
    retVal += (forcerInfinitif ? forcerInfinitif : candidat.els.infinitif) + " "
    if (candidat.correspondCeci) {
      retVal += candidat.els.preposition0 ? (candidat.els.preposition0 + " ") : "";
      if (candidat.correspondCeci.elements.length) {
        retVal += "{=" + candidat.correspondCeci.elements[0].intitule + "=} ";
      } else {
        retVal += "{=" + candidat.correspondCeci.intitule + "=} ";
      }
      if (candidat.correspondCela) {
        retVal += candidat.els.preposition1 ? (candidat.els.preposition1 + " ") : "";
        if (candidat.correspondCela.elements.length) {
          retVal += "{=" + candidat.correspondCela.elements[0].intitule + "=}";
        } else {
          retVal += "{=" + candidat.correspondCela.intitule + "=}";
        }
      }
    }
    return retVal;
  }

  // private executerAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
  //   const resultat = this.ins.executerInstructions(action.action.instructions, contexteTour, evenement, undefined);
  //   return resultat;
  // }


}
