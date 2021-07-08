import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { ClasseUtils } from '../commun/classe-utils';
import { Commandeur } from './commandeur';
import { ConditionsUtils } from './conditions-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { InstructionChanger } from './instruction-changer';
import { InstructionDeplacerCopier } from './instruction-deplacer-copier';
import { InstructionDire } from './instruction-dire';
import { InstructionExecuter } from './instruction-executer';
import { InstructionsUtils } from './instructions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Objet } from '../../models/jeu/objet';
import { Resultat } from '../../models/jouer/resultat';

export class Instructions {

  private cond: ConditionsUtils;
  private insDire: InstructionDire;
  private insExecuter: InstructionExecuter;
  private insChanger: InstructionChanger;
  private insDeplacerCopier: InstructionDeplacerCopier;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.insDire = new InstructionDire(this.jeu, this.eju, this.verbeux);
    this.insExecuter = new InstructionExecuter(this.jeu, this.eju, this.verbeux);
    this.insExecuter.instructions = this;
    this.insDeplacerCopier = new InstructionDeplacerCopier(this.jeu, this.eju, this.verbeux);
    this.insChanger = new InstructionChanger(this.jeu, this.eju, this.verbeux);
    this.insChanger.instructionDeplacerCopier = this.insDeplacerCopier;
  }

  get dire() {
    return this.insDire;
  }

  /** Commandeur pour l’instruction « exécuter commande ». */
  set commandeur(commandeur: Commandeur) {
    this.insExecuter.commandeur = commandeur;
  }

  /** Exécuter une liste d’instructions */
  public executerInstructions(instructions: Instruction[], ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement = null, declenchements: number = null): Resultat {

    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const sousResultat = this.executerInstruction(ins, ceci, cela, evenement, declenchements);
        resultat.nombre += sousResultat.nombre;
        resultat.succes = (resultat.succes && sousResultat.succes);
        resultat.sortie += sousResultat.sortie;
        resultat.stopperApresRegle = resultat.stopperApresRegle || sousResultat.stopperApresRegle;
        resultat.terminerAvantRegle = resultat.terminerAvantRegle || sousResultat.terminerAvantRegle;
        resultat.terminerApresRegle = resultat.terminerApresRegle || sousResultat.terminerApresRegle;
      });
    }
    return resultat;
  }

  /** Exécuter une instruction */
  public executerInstruction(instruction: Instruction, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement = null, declenchements: number = null): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction, "ceci:", ceci, "cela:", cela);
    }
    // incrémenter le nombre de fois que l’instruction a déjà été exécutée
    instruction.nbExecutions += 1;

    // instruction conditionnelle
    if (instruction.condition) {
      const estVrai = this.cond.siEstVraiAvecLiens(null, instruction.condition, ceci, cela, evenement, declenchements);
      if (this.verbeux) {
        console.log(">>>> estVrai=", estVrai);
      }
      if (estVrai) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, ceci, cela, evenement, declenchements);
      } else {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, ceci, cela, evenement, declenchements);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        sousResultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, ceci, cela, evenement, declenchements);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;
    resultat.stopperApresRegle = resultat.stopperApresRegle || sousResultat.stopperApresRegle;
    resultat.terminerAvantRegle = resultat.terminerAvantRegle || sousResultat.terminerAvantRegle;
    resultat.terminerApresRegle = resultat.terminerApresRegle || sousResultat.terminerApresRegle;

    // console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }


  private executerInfinitif(instruction: ElementsPhrase, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement, declenchements: number): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    if (this.verbeux) {
      console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (ceci=", ceci, "cela=", cela, "instruction=", instruction, "nbExecutions=", nbExecutions, ")");
    }

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement1.trim();
        let contenu = complement.slice(1, complement.length - 1).trim();
        contenu = this.insDire.interpreterContenuDire(contenu, nbExecutions, ceci, cela, evenement, declenchements);
        resultat.sortie += contenu;
        // console.warn("--- complement:", complement);
        // console.warn("------ contenu:", contenu);
        // console.warn("------ resultat.sortie:", resultat.sortie);
        break;
      case 'changer':
        sousResultat = this.insChanger.executerChanger(instruction, ceci, cela, evenement, declenchements);
        resultat.sortie += sousResultat.sortie;
        resultat.succes = sousResultat.succes;
        break;

      case 'déplacer':

        // console.warn("$$$$ Déplacer", "\nsujet:", instruction.sujet, "\npreposition1:", instruction.preposition1, "\nsujetComplement1:", instruction.sujetComplement1, "\nceci:", ceci, "\ncela:", cela);

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
          destinationDeplacement = ceci;
        } else if (instruction.sujetComplement1?.nom === 'cela') {
          destinationDeplacement = cela;
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
              sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, voisin.intitule, null, null);
              resultat.succes = sousResultat.succes;
            } else {
              resultat.succes = false;
            }
            // déplacer sujet vers un ÉLÉMENT du jeu (lieu ou objet)
          } else if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.element)) {
            sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: déplacer: la destination (ceci, cela ou ici) doit être soit un lieu, soit un objet, soit une direction. \ninstruction=", instruction, "\nsujet=", instruction.sujet, "\nceci=", ceci, "\ncela=", cela, ")");
            resultat.succes = false;
          }
          // destination classique
        } else {
          sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
          resultat.succes = sousResultat.succes;
        }
        break;

      case 'copier':
        // console.warn("$$$$ Copier", "\nsujet:", instruction.sujet, "\npreposition1:", instruction.preposition1, "\nsujetComplement1:", instruction.sujetComplement1, "\nceci:", ceci, "\ncela:", cela);

        // retrouver quantité à copier
        let sujetCopie = instruction.sujet;
        if (instruction.sujet.determinant == 'quantitéCeci ') {
          sujetCopie = new GroupeNominal(evenement.quantiteCeci.toString(), sujetCopie.nom, sujetCopie.epithete);
        } else if (instruction.sujet.determinant == 'quantitéCela ') {
          sujetCopie = new GroupeNominal(evenement.quantiteCela.toString(), sujetCopie.nom, sujetCopie.epithete);
        }

        // copier l’élément
        sousResultat = this.insDeplacerCopier.executerCopier(sujetCopie, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
        break;

      case 'effacer':
        if (instruction.sujet.nom == 'écran') {
          resultat.sortie = "@@effacer écran@@";
        } else {
          const cible = InstructionsUtils.trouverObjetCible(instruction.sujet.nom, instruction.sujet, ceci, cela, this.eju, this.jeu);
          if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.objet)) {
            sousResultat = this.executerEffacer(cible as Objet);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: Seuls les objets ou l’écran peuvent être effacés.");
            resultat.sortie = "{+[Seuls les objets ou l’écran peuvent être effacés]+}";
            resultat.succes = false;
          }
        }
        break;

      case 'sauver':
        // console.log("executerInfinitif >> sauver=", instruction.complement1);
        if (instruction.complement1) {
          this.jeu.sauvegardes.push(instruction.complement1.trim().toLowerCase());
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      case 'exécuter':
        // rem: instruction spéciale où le sujet et les compléments ne sont pas analysés !

        // console.log("executerInfinitif >> exécuter=", instruction);
        // EXÉCUTER RÉACTION
        if (instruction.complement1 && instruction.complement1.startsWith('réaction ')) {
          // console.log("executerInfinitif >> executerReaction", instruction, ceci, cela);
          sousResultat = this.insExecuter.executerReaction(instruction, ceci, cela);
          resultat.sortie = sousResultat.sortie;
          resultat.succes = sousResultat.succes;
          // EXÉCUTER ACTION (ex: exécuter l’action pousser sur ceci avec cela)
        } else if (instruction.complement1 && instruction.complement1.match(ExprReg.xActionExecuterAction)) {
          resultat = this.insExecuter.executerAction(instruction, nbExecutions, ceci, cela, evenement, declenchements);
          // EXÉCUTER COMMANDE
        } else if (instruction.complement1 && instruction.complement1.match(ExprReg.xActionExecuterCommande)) {
          resultat = this.insExecuter.executerCommande(instruction);
        } else {
          console.error("executerInfinitif >> exécuter >> complément autre que  « réaction de … », « l’action xxxx… » ou « la commande \"xxx…\" » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'stopper':
        // Stopper l’action en cours (évènement AVANT spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'action') {
          resultat.stopperApresRegle = true;
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> stopper >> sujet autre que  « action » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'terminer':
      case 'continuer':
        // Il faut continuer l’action en cours (évènement APRÈS spécial)
        console.log("terminer:", instruction);

        // jeu
        if (instruction.sujet && instruction.sujet.nom === 'jeu') {
          this.jeu.termine = true;
          // action
        } else if (instruction?.sujet.nom?.toLocaleLowerCase() === 'action') {
          // terminer/continuer l’action avant
          if (instruction?.sujet.epithete?.toLocaleLowerCase() === 'avant') {
            resultat.terminerAvantRegle = true;
            // terminer/continuer l’action {après} (par défaut)
          } else {
            resultat.terminerApresRegle = true;
          }
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> terminer >> sujet autre que  « action » ou « jeu » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;



      case 'attendre':
        // Il faut continuer l’action en cours (évènement APRÈS spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'touche') {
          resultat.sortie = "@@attendre touche@@";
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> attenre >> sujet autre que  « touche » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
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
          resultat.succes = true;
        }
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        const indexLieu = this.jeu.objets.indexOf((ceci as Objet));
        if (indexLieu !== -1) {
          this.jeu.lieux.splice(indexLieu, 1);
          resultat.succes = true;
        }
      } else {
        console.error("executerEffacer: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return resultat;
  }

}