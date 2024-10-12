import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { ChoixEcran } from '../../models/jouer/contexte-ecran';
import { ClasseUtils } from '../commun/classe-utils';
import { Commandeur } from './commandeur';
import { CompteursUtils } from './compteurs-utils';
import { ConditionsUtils } from './conditions-utils';
import { ContexteTour } from '../../models/jouer/contexte-tour';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { InstructionChanger } from './instruction-changer';
import { InstructionCharger } from './instruction-charger';
import { InstructionDeplacerCopier } from './instruction-deplacer-copier';
import { InstructionDire } from './instruction-dire';
import { InstructionExecuter } from './instruction-executer';
import { InstructionJouerArreter } from './instruction-jouer-arreter';
import { InstructionSelectionner } from './instruction-selectionner';
import { InstructionsUtils } from './instructions-utils';
import { InterruptionsUtils } from './interruptions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';
import { Resultat } from '../../models/jouer/resultat';
import { StringUtils } from '../commun/string.utils';
import { TexteUtils } from '../commun/texte-utils';
import { TypeChoisir } from '../../models/compilateur/bloc-instructions';
import { TypeInterruption } from '../../models/jeu/interruption';

export class Instructions {

  private cond: ConditionsUtils;
  private insDire: InstructionDire;
  private insExecuter: InstructionExecuter;
  private insChanger: InstructionChanger;
  private insJouerArreter: InstructionJouerArreter;
  private insCharger: InstructionCharger;
  private insSelectionner: InstructionSelectionner;
  private insDeplacerCopier: InstructionDeplacerCopier;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private document: Document | undefined,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.insDire = new InstructionDire(this.jeu, this.eju, this.verbeux);
    this.insExecuter = new InstructionExecuter(this.jeu, this.eju, this.verbeux);
    this.insExecuter.instructions = this;
    this.insDeplacerCopier = new InstructionDeplacerCopier(this.jeu, this.eju, this.verbeux);
    this.insChanger = new InstructionChanger(this.jeu, this.eju, this.verbeux);
    this.insChanger.instructionDeplacerCopier = this.insDeplacerCopier;
    this.insChanger.instructionDire = this.insDire;
    this.insJouerArreter = new InstructionJouerArreter(this.jeu);
    this.insCharger = new InstructionCharger(this.jeu, this.document);
    this.insSelectionner = new InstructionSelectionner(this.verbeux);
  }

  get dire() {
    return this.insDire;
  }

  /** Commandeur pour l’instruction « exécuter commande ». */
  set commandeur(commandeur: Commandeur) {
    this.insExecuter.commandeur = commandeur;
  }

  public restaurationPartieEnCours = false;

  /** Exécuter une liste d’instructions */
  public executerInstructions(instructions: Instruction[], contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): Resultat {

    let resultat = new Resultat(true, '', 0);

    for (let indexInstruction = 0; indexInstruction < instructions.length; indexInstruction++) {
      const ins = instructions[indexInstruction];
      const sousResultat = this.executerInstruction(ins, contexteTour, evenement, declenchements);
      // additionner l’instruction au résultat
      resultat.nombre += sousResultat.nombre;
      resultat.succes = (resultat.succes && sousResultat.succes);
      resultat.sortie += sousResultat.sortie;
      resultat.arreterApresRegle = resultat.arreterApresRegle || sousResultat.arreterApresRegle;
      resultat.terminerAvantRegle = resultat.terminerAvantRegle || sousResultat.terminerAvantRegle;
      resultat.terminerApresRegle = resultat.terminerApresRegle || sousResultat.terminerApresRegle;
      resultat.refuse = resultat.refuse || sousResultat.refuse;

      // on interrompt le bloc d’instructions le temps que l’utilisateur fasse un choix
      if (sousResultat.interrompreBlocInstruction) {
        InterruptionsUtils.definirProprietesInterruptionSousResultatAuResultat(resultat, sousResultat);
        if (resultat.reste?.length) {
          //le reste des instructions de la liste principale (s’il y en a un)
          if (indexInstruction < (instructions.length - 1)) {
            resultat.reste.push(...instructions.slice(indexInstruction + 1));
          }
        } else {
          resultat.reste = instructions.slice(indexInstruction + 1);
        }
        break;
      }
      // si instruction refusée: on arrête tout
      if (resultat.refuse) {
        break;
      }
    }
    return resultat;
  }

  /** Exécuter une instruction */
  private executerInstruction(instruction: Instruction, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): Resultat {

    let resultat: Resultat;

    if (!contexteTour) {
      throw new Error("executerInstruction: ContexteTour pas fourni.");
    }
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction, "contexteTour:", contexteTour);
    }
    // incrémenter le nombre de fois que l’instruction a déjà été exécutée
    instruction.nbExecutions += 1;

    // instruction conditionnelle
    if (instruction.condition) {
      const estVrai = this.cond.siEstVrai(null, instruction.condition, contexteTour, evenement, declenchements);
      if (estVrai) {
        resultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, contexteTour, evenement, declenchements);
      } else {
        resultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, contexteTour, evenement, declenchements);
      }
      // instruction choisir
    } else if (instruction.choix) {
      if (instruction.choix.length > 0) {
        resultat = new Resultat(true, "", 1);
        resultat.interrompreBlocInstruction = true;
        resultat.typeInterruption = instruction.typeChoisir == TypeChoisir.libre ? TypeInterruption.attendreChoixLibre : TypeInterruption.attendreChoix;
        resultat.choix = instruction.choix;
      } else {
        this.jeu.tamponErreurs.push("executerInstruction : choisir : aucun choix")
        resultat = new Resultat(false, '', 0);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        resultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, contexteTour, evenement, declenchements);
      } else {
        this.jeu.tamponErreurs.push("executerInstruction : pas d'infinitif : « " + instruction + " »")
        resultat = new Resultat(false, '', 0);
      }
    }
    return resultat;
  }


  private executerInfinitif(instruction: ElementsPhrase, nbExecutions: number, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    if (this.verbeux) {
      console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (contexteTour=", contexteTour, "instruction=", instruction, "nbExecutions=", nbExecutions, ")");
    }

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complementDire = instruction.complement1.trim();
        let contenuDire = complementDire.slice(1, complementDire.length - 1).trim();
        contenuDire = this.insDire.calculerTexteDynamique(contenuDire, nbExecutions, undefined, contexteTour, evenement, declenchements);
        resultat.sortie += contenuDire;
        break;

      case 'refuser':
        // refuser l’exécution de l’action + raison
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complementRepondre = instruction.complement1.trim();
        let contenuRepondre = complementRepondre.slice(1, complementRepondre.length - 1).trim();
        contenuRepondre = this.insDire.calculerTexteDynamique(contenuRepondre, nbExecutions, undefined, contexteTour, evenement, declenchements);
        resultat.sortie += contenuRepondre;
        resultat.refuse = true;
        break;

      case 'changer':
        sousResultat = this.insChanger.executerChanger(instruction, contexteTour, evenement, declenchements);
        resultat.sortie += sousResultat.sortie;
        resultat.succes = sousResultat.succes;
        break;

      case 'déplacer':
        // retrouver quantité à déplacer
        let sujetDeplacement = instruction.sujet;
        if (instruction.sujet.determinant == 'quantitéCeci ') {
          sujetDeplacement = new GroupeNominal(evenement.quantiteCeci.toString(), sujetDeplacement.nom, sujetDeplacement.epithete);
        } else if (instruction.sujet.determinant == 'quantitéCela ') {
          sujetDeplacement = new GroupeNominal(evenement.quantiteCela.toString(), sujetDeplacement.nom, sujetDeplacement.epithete);
        }

        // retrouver la destination du déplacement pour détecter si spéciale
        let destinationDeplacement: ElementJeu | Intitule = null;
        if (instruction.sujetComplement1?.nom === 'ceci') {
          destinationDeplacement = contexteTour.ceci;
        } else if (instruction.sujetComplement1?.nom === 'cela') {
          destinationDeplacement = contexteTour.cela;
        } else if (instruction.sujetComplement1?.nom === 'ici') {
          destinationDeplacement = this.eju.curLieu;
        }

        // destination spéciale (ceci, cela, ici)
        if (destinationDeplacement) {
          // déplacer sujet vers DIRECTION
          if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.direction)) {
            let loc: Localisation | ELocalisation = destinationDeplacement as Localisation;
            let voisinID = this.eju.getVoisinDirectionID((loc), EClasseRacine.lieu);
            if (voisinID == -1) {
              // cas particulier : si le joueur utilise entrer/sortir quand une seule sortie visible, aller dans la direction de cette sortie
              if (loc instanceof Localisation && (loc.id == ELocalisation.exterieur /*|| loc.id == ELocalisation.interieur*/)) {
                const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
                if (lieuxVoisinsVisibles.length == 1) {
                  voisinID = lieuxVoisinsVisibles[0].id;
                  loc = lieuxVoisinsVisibles[0].localisation;
                }
              }
            }
            if (voisinID != -1) {
              const voisin = this.eju.getLieu(voisinID);
              sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, voisin.intitule, contexteTour);
              resultat.succes = sousResultat.succes;
            } else {
              resultat.succes = false;
            }
            // déplacer sujet vers un ÉLÉMENT du jeu (lieu ou objet)
          } else if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.element)) {
            sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, contexteTour);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: déplacer: la destination (ceci, cela ou ici) doit être soit un lieu, soit un objet, soit une direction. \ninstruction=", instruction, "\nsujet=", instruction.sujet, "\ncontexteTour=", contexteTour, ")");
            resultat.succes = false;
          }
          // destination classique
        } else {
          sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, contexteTour);
          resultat.succes = sousResultat.succes;
        }
        break;

      case 'copier':
        // console.warn("$$$$ Copier", "\nsujet:", instruction.sujet, "\npreposition1:", instruction.preposition1, "\nsujetComplement1:", instruction.sujetComplement1, "\ncontexteTour:", contexteTour);

        // retrouver quantité à copier
        let sujetCopie = instruction.sujet;
        if (instruction.sujet.determinant == 'quantitéCeci ') {
          sujetCopie = new GroupeNominal(evenement.quantiteCeci.toString(), sujetCopie.nom, sujetCopie.epithete);
        } else if (instruction.sujet.determinant == 'quantitéCela ') {
          sujetCopie = new GroupeNominal(evenement.quantiteCela.toString(), sujetCopie.nom, sujetCopie.epithete);
        }

        // copier l’élément
        sousResultat = this.insDeplacerCopier.executerCopier(sujetCopie, instruction.preposition1, instruction.sujetComplement1, contexteTour);
        break;

      case 'effacer':
        if (instruction.sujet.nom == 'écran') {
          resultat.sortie = "@@effacer écran@@";
        } else {
          const cible = InstructionsUtils.trouverObjetCible(instruction.sujet.nom, instruction.sujet, contexteTour, this.eju, this.jeu);
          if (cible) {
            if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.objet)) {
              sousResultat = this.executerEffacer(cible as Objet);
              resultat.succes = sousResultat.succes;
            } else {
              console.error("Exécuter infinitif: Seuls les objets ou l’écran peuvent être effacés.");
              resultat.sortie = "{+[Seuls les objets ou l’écran peuvent être effacés]+}";
              resultat.succes = false;
            }
          } else {
            contexteTour.ajouterErreurInstruction(instruction, "L’objet à effacer n’a pas été trouvé.");
            resultat.succes = false;
          }
        }
        break;

      case 'annuler':
        if (instruction.sujet.nomEpithete.startsWith("tour")) {
          resultat.interrompreBlocInstruction = true;
          resultat.typeInterruption = TypeInterruption.annulerTour;
          if (instruction.sujet.determinant) {
            resultat.nbToursAnnuler = StringUtils.getNombreEntierDepuisChiffresOuLettres(undefined, undefined, instruction.sujet.determinant);
          } else {
            resultat.nbToursAnnuler = 1;
          }
        } else if (instruction.sujet.nom == "routine") {
          // retirer la routine à annuler
          const nomRoutine = instruction.sujet.epithete?.toLocaleLowerCase();
          if (nomRoutine) {
            if (this.verbeux) {
              console.log(`routine à annuler: ${nomRoutine}`);
            }
            const indexRoutine = this.jeu.programmationsTemps.findIndex(x => x.routine == nomRoutine);
            if (indexRoutine != -1) {
              this.jeu.programmationsTemps.splice(indexRoutine, 1);
              if (this.verbeux) {
                console.log(`routine annulée`);
              }
            }
          } else {
            contexteTour.ajouterErreurInstruction(instruction, "Annuler routine: veuillez spécifier le nom de la routine à annuler.");
          }
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "Annuler: il est seulement possible d'annuler un certain nombre de tours ou la programmation d’une routine.");
          resultat.succes = false;
        }
        break;

      case 'commencer':
        if (instruction.sujet.nomEpithete.toLocaleLowerCase() == "nouvelle partie") {
          resultat.sortie = "@nouvelle partie@";
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "Commencer: il est seulement possible de commencer une nouvelle partie.");
          resultat.succes = false;
        }
        break;

      case 'exécuter':
        // rem: instruction spéciale où le sujet et les compléments ne sont pas analysés !

        if (instruction.complement1) {
          // EXÉCUTER RÉACTION
          if (instruction.complement1.startsWith('réaction ')) {
            // console.log("executerInfinitif >> executerReaction", instruction, ceci, cela);
            resultat = this.insExecuter.executerReaction(instruction, contexteTour);
            // EXÉCUTER ACTION (ex: exécuter l’action pousser sur ceci avec cela)
          } else if (ExprReg.xActionExecuterAction.test(instruction.complement1)) {
            resultat = this.insExecuter.executerAction(instruction, nbExecutions, contexteTour, evenement, declenchements);
            // EXÉCUTER DERNIÈRE COMMANDE
          } else if (ExprReg.xActionExecuterDerniereCommande.test(instruction.complement1)) {
            resultat = this.insExecuter.executerDerniereCommande();
            // EXÉCUTER COMMANDE "…"
          } else if (ExprReg.xActionExecuterCommande.test(instruction.complement1)) {
            resultat = this.insExecuter.envoyerCommande(instruction, contexteTour);

            // EXÉCUTER ROUTINE
          } else if (ExprReg.xActionExecuterRoutine.test(instruction.complement1)) {
            resultat = this.insExecuter.executerRoutine(instruction, nbExecutions, contexteTour, evenement, declenchements);
          } else {
            // INCONNU
            contexteTour.ajouterErreurInstruction(instruction, "Intruction « exécuter » : complément autre que  « réaction de … », « l’action xxxx… », « la commande \"xxx…\" », « la dernière commande » ou « la routine xxx » pas pris en charge. sujet=" + instruction.sujet + ", compl=" + instruction.complement1);
            resultat.succes = false;
          }
          // SANS COMPLÉMENT
        } else {
          console.error("executerInfinitif >> exécuter >> complément autre que  « réaction de … », « l’action xxxx… », « la commande \"xxx…\" », « la dernière commande » ou « la routine xxx » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'interrompre':
        // A) Interrompre la partie
        if (instruction.sujet?.nom === 'partie' || instruction.sujet?.nom === 'jeu') {
          if (this.jeu.interrompu) {
            contexteTour.ajouterErreurInstruction(instruction, "La partie est déjà interrompue.");
          }
          this.jeu.interrompu = true;
          this.jeu.debutInterruption = Date.now();
          this.jeu.finInterruption = undefined;
          resultat.succes = true;
          // Z) Autre: pas supporté
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "Je sais seulement interrompre la partie.");
          resultat.succes = false;
        }
        break;

      case 'continuer':
        // A) Continuer partie interrompue
        if (instruction.sujet?.nom === 'partie' || instruction.sujet?.nom === 'jeu') {
          if (!this.jeu.interrompu) {
            contexteTour.ajouterErreurInstruction(instruction, "La partie n’est pas interrompue.");
          }
          // on ne désactive pas le flag ici, cela sera traité par le lecteur.
          this.jeu.finInterruption = Date.now();
          resultat.succes = true;
          // B) continuer l’action (avant/après une règle après)
        } else if (instruction.sujet?.nom?.toLocaleLowerCase() === 'action') {
          // terminer/continuer l’action avant
          if (instruction.sujet.epithete?.toLocaleLowerCase() === 'avant') {
            resultat.terminerAvantRegle = true;
            // terminer/continuer l’action {après} (par défaut)
          } else {
            resultat.terminerApresRegle = true;
          }
          resultat.succes = true;
          // Z) Autre: pas supporté
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "Je sais seulement continuer une action ou la partie interrompue.");
          resultat.succes = false;
        }
        break;

      case 'terminer':
        // A) Terminer le jeu (la partie)
        if (instruction.sujet?.nom === 'jeu') {
          this.jeu.termine = true;
          // B) Terminer l’action (avant/après une règle après)
        } else if (instruction.sujet?.nom?.toLocaleLowerCase() === 'action') {
          // terminer l’action avant
          if (instruction.sujet.epithete?.toLocaleLowerCase() === 'avant') {
            resultat.terminerAvantRegle = true;
            // terminer l’action {après} (par défaut)
          } else {
            resultat.terminerApresRegle = true;
          }
          resultat.succes = true;
          // Z) Autre: pas supporté
        } else {
          console.error("executerInfinitif >> terminer >> sujet autre que  « action » ou « jeu » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'jouer':
        resultat = this.insJouerArreter.executerJouer(instruction, contexteTour);
        break;

      case 'charger':
        resultat = this.insCharger.executerCharger(instruction, contexteTour);
        break;

      case 'décharger':
      case 'decharger':
        resultat = this.insCharger.executerDecharger(instruction, contexteTour);
        break;

      case 'sélectionner':
      case 'selectionner':
        resultat = this.insSelectionner.executerSelectionner(instruction, contexteTour);
        break;

      case 'afficher':
        // afficher une image
        if (instruction.sujet?.nom?.trim() == 'image' && instruction.complement1) {
          const nomFichierNonSecurise = instruction.complement1;
          const nomFichierSecurise = StringUtils.nomDeFichierSecurise(nomFichierNonSecurise);
          if (nomFichierSecurise == nomFichierNonSecurise && nomFichierSecurise.length) {
            // on ajoute un retour à la ligne conditionnel unique avant et après l’image
            resultat.sortie += '{U}@@image:' + nomFichierSecurise + '@@{U}';
          } else {
            resultat.sortie += "{+Le nom de l’image à afficher ne peut contenir que des lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Ex: mon_image.png+}"
          }
        } else if (instruction.sujet?.nom == 'écran') {
          resultat.typeInterruption = TypeInterruption.changerEcran;
          resultat.interrompreBlocInstruction = true;
          switch (instruction.sujet.epithete) {
            case 'principal':
              resultat.ecran = ChoixEcran.principal;
              break;
            case 'secondaire':
              resultat.ecran = ChoixEcran.secondaire;
              break;
            case 'temporaire':
              resultat.ecran = ChoixEcran.temporaire;
              break;
            case 'précédent':
            case 'precedent':
              resultat.ecran = ChoixEcran.precedent;
              break;

            default:
              resultat.sortie += "{+Je peux seulement afficher l’un des écrans suivants: << principal >>, << secondaire >>, << temporaire >> ou << précédent >>.+}";
              break;
          }
        } else {
          resultat.sortie += "{+Je peux seulement afficher des images ou l’un des écrans. Le nom de l’image à afficher ne peut contenir que des lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Ex: mon_image.png+}"
        }
        break;

      case 'arrêter':
      case 'arreter':
      case 'stopper':
        resultat = this.insJouerArreter.executerArreter(instruction, contexteTour);
        break;

      case 'attendre':
        // ATTENDRE UNE TOUCHE
        if (instruction.sujet?.nom.toLocaleLowerCase() == 'touche') {
          // resultat.sortie = "@@attendre touche@@";
          resultat.interrompreBlocInstruction = true;
          resultat.typeInterruption = TypeInterruption.attendreTouche;
          resultat.messageAttendre = TexteUtils.enleverGuillemets(instruction.complement1, true);
          resultat.succes = true;
          // ATTENDRE NOMBRE DE SECONDES
        } else if (instruction.sujet?.nom.toLocaleLowerCase() == 'seconde' || instruction.sujet?.nom.toLocaleLowerCase() == 'secondes') {
          resultat.interrompreBlocInstruction = true;
          resultat.typeInterruption = TypeInterruption.attendreSecondes;
          resultat.nbSecondesAttendre = CompteursUtils.intituleNombreVersNombre(instruction.sujet.determinant);
          if (resultat.nbSecondesAttendre > 10) {
            contexteTour.ajouterErreurInstruction(instruction, "Attendre: 10 secondes maximum.");
            resultat.nbSecondesAttendre = 10;
          }
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> attenre >> sujet autre que  « une touche » ou « nombre secondes » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'déterminer':
      case 'determiner':
        if (instruction.sujet?.nom?.toLocaleLowerCase() === 'déplacement du joueur') {
          const destination = instruction.sujetComplement1.toString()
          this.determinerDeplacementVers(destination, contexteTour);
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: déterminer: je ne sais pas déterminer ça:" + instruction.sujet.toString());
        }
        break;

      case 'tester':
        if (instruction.sujet.motsCles.length == 1 && instruction.sujet.motsCles[0] == 'audio') {
          resultat = this.testerSon();
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: tester: je sais uniquement tester l’audio.");
        }
        break;

      case 'vider':
        const liste = this.eju.trouverListeAvecNom(instruction.sujet.nomEpithete);
        if (liste) {
          liste.vider();
        } else if (instruction.sujet.motsCles.length == 1 && instruction.sujet.motsCles[0] == 'inventaire') {
          // vider l’inventaire : les objets de l’inventaires ne sont plus positionnés dans le jeu.
          const contenuInventaire = this.eju.obtenirContenu(this.jeu.joueur, PrepositionSpatiale.dans);
          contenuInventaire.forEach(element => {
            element.position = null;
          });
        } else {
          contexteTour.ajouterErreurInstruction(instruction, "vider liste: liste pas trouvée: " + instruction)
        }
        break;

      default:
        contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: verbe inconnu: « " + instruction.infinitif + " ».")
        break;
    }

    return resultat;
  }

  /**
   * Effacer un élément du jeu.
   */
  private executerEffacer(ceci: ElementJeu = null): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        const indexObjet = this.jeu.objets.indexOf((ceci as Objet));
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);

          // s’il s’agit d’une porte, l’enlever des voisins des lieux
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.porte)) {
            this.jeu.lieux.forEach(curLieu => {
              curLieu.voisins = curLieu.voisins.filter(x => x.type !== EClasseRacine.porte || x.id !== ceci.id);
            });
            // s’il s’agit d’un obstacle, l’enlever des voisins des lieux
          } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.obstacle)) {
            this.jeu.lieux.forEach(curLieu => {
              curLieu.voisins = curLieu.voisins.filter(x => x.type !== EClasseRacine.obstacle || x.id !== ceci.id);
            });
          }

          resultat.succes = true;
        }
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        const indexLieu = this.jeu.objets.indexOf((ceci as Objet));
        if (indexLieu !== -1) {
          this.jeu.lieux.splice(indexLieu, 1);

          // l’enlever des voisins des lieux
          this.jeu.lieux.forEach(curLieu => {
            curLieu.voisins = curLieu.voisins.filter(x => x.type !== EClasseRacine.lieu || x.id !== ceci.id);
          });

          resultat.succes = true;
        }
      } else {
        console.error("executerEffacer: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return resultat;
  }

  /** émettre un son pour que le joueur puisse vérifier ses baffles. */
  public testerSon(): Resultat {
    return this.insJouerArreter.testSon();
  }

  public onChangementAudioActif() {
    this.insJouerArreter.onChangementAudioActif();
  }

  public determinerDeplacementVers(destination: string, ctxTour: ContexteTour) {
    ctxTour.origine = this.eju.curLieu;

    let cibleDestination = InstructionsUtils.trouverCibleSpeciale(destination, ctxTour, ctxTour.commande.evenement, this.eju, this.jeu);

    if (cibleDestination) {
      // si on a fourni un lieu => trouver l’orientation correspondante
      if (ClasseUtils.heriteDe(cibleDestination.classe, EClasseRacine.lieu)) {
        ctxTour.destination = cibleDestination as Lieu;
        // trouver orientation
        let voisin = ctxTour.destination.voisins.find(x => x.type == EClasseRacine.lieu && x.id == ctxTour.destination.id);
        if (voisin) {
          ctxTour.orientation = Localisation.getLocalisation(voisin.localisation);
        }
        // si on a fourni une orientation => trouver le lieu correspondant
      } else if (ClasseUtils.heriteDe(cibleDestination.classe, EClasseRacine.direction)) {
        ctxTour.orientation = cibleDestination as Localisation;
        // trouver le lieu
        let voisinId = this.eju.getVoisinDirectionID(ctxTour.orientation, EClasseRacine.lieu);
        // cas particulier : si le joueur utilise sortir quand une seule sortie visible, aller dans la direction de cette sortie
        if (ctxTour.orientation.id == ELocalisation.exterieur) {
          const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
          if (lieuxVoisinsVisibles.length == 1) {
            voisinId = lieuxVoisinsVisibles[0].id;
            ctxTour.orientation = Localisation.getLocalisation(lieuxVoisinsVisibles[0].localisation);
          }
        }
        if (voisinId != -1) {
          ctxTour.destination = this.eju.getLieu(voisinId);
        }
      } else {
        ctxTour.ajouterErreurInstruction(undefined, "Cible destination joueur pas prise en charge:" + destination);
      }

      // si l’option n’est pas désactivée, remplacer ceci/cela par le lieu destination
      // afin d’avoir toujours le lieu comme paramètre plutôt que parfois le lieu et parfois la direction.
      if (this.jeu.parametres.activerRemplacementDestinationDeplacements) {
        if (ctxTour.commande.actionChoisie.action.destinationDeplacement == 'ceci') {
          if (ctxTour.destination) {
            ctxTour.commande.evenement.ceci = ctxTour.destination.nom;
            ctxTour.commande.evenement.classeCeci = ctxTour.destination.classe;
          }
        } else if (ctxTour.commande.actionChoisie.action.destinationDeplacement == 'cela') {
          if (ctxTour.destination) {
            ctxTour.commande.evenement.cela = ctxTour.destination.nom;
            ctxTour.commande.evenement.classeCela = ctxTour.destination.classe;
          }
        }
      }

    }
  }

  public unload() {
    // éviter que le son continue à jouer après qu’on ait quitté le jeu
    this.insJouerArreter.unload();

    this.insCharger.unload();
  }

}