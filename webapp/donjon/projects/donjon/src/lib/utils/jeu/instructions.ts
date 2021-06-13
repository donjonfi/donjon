import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { ActionsUtils } from './actions-utils';
import { ClasseUtils } from '../commun/classe-utils';
import { Commandeur } from './commandeur';
import { Compteur } from '../../models/compilateur/compteur';
import { CompteursUtils } from './compteurs-utils';
import { ConditionsUtils } from './conditions-utils';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { InstructionDire } from './instruction-dire';
import { InstructionsUtils } from './instructions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';
import { PositionsUtils } from '../commun/positions-utils';
import { Reaction } from '../../models/compilateur/reaction';
import { Resultat } from '../../models/jouer/resultat';

export class Instructions {

  private cond: ConditionsUtils;
  private insDire: InstructionDire;
  private act: ActionsUtils;
  private com: Commandeur;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.insDire = new InstructionDire(this.jeu, this.eju, this.verbeux);
    this.act = new ActionsUtils(this.jeu, this.verbeux);
  }

  get dire() {
    return this.insDire;
  }

  /** Commandeur pour l’instruction « exécuter commande ». */
  set commandeur(commandeur: Commandeur) {
    this.com = commandeur;
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
        sousResultat = this.executerChanger(instruction, ceci, cela);
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
              sousResultat = this.executerDeplacer(sujetDeplacement, instruction.preposition1, voisin.intitule, null, null);
              resultat.succes = sousResultat.succes;
            } else {
              resultat.succes = false;
            }
            // déplacer sujet vers un ÉLÉMENT du jeu (lieu ou objet)
          } else if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.element)) {
            sousResultat = this.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: déplacer: la destination (ceci, cela ou ici) doit être soit un lieu, soit un objet, soit une direction. \ninstruction=", instruction, "\nsujet=", instruction.sujet, "\nceci=", ceci, "\ncela=", cela, ")");
            resultat.succes = false;
          }
          // destination classique
        } else {
          sousResultat = this.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
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
        sousResultat = this.executerCopier(sujetCopie, instruction.preposition1, instruction.sujetComplement1, ceci, cela);
        break;

      case 'effacer':
        if (instruction.sujet.nom == 'écran') {
          resultat.sortie = "@@effacer écran@@";
        } else {
          const cible = this.trouverObjetCible(instruction.sujet.nom, instruction.sujet, ceci, cela);
          if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.objet)) {
            sousResultat = this.executerEffacer(cible as Objet);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: Seuls les objets ou l’écran peuvent être effacés.");
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
          sousResultat = this.executerReaction(instruction, ceci, cela);
          resultat.sortie = sousResultat.sortie;
          resultat.succes = sousResultat.succes;
          // EXÉCUTER ACTION (ex: exécuter l’action pousser sur ceci avec cela)
        } else if (instruction.complement1 && instruction.complement1.match(ExprReg.xActionExecuterAction)) {
          resultat = this.executerAction(instruction, nbExecutions, ceci, cela, evenement, declenchements);
          // EXÉCUTER COMMANDE
        } else if (instruction.complement1 && instruction.complement1.match(ExprReg.xActionExecuterCommande)) {
          resultat = this.executerCommande(instruction);
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
   * Trouver les objets à déplacer ou à copier.
   */
  private trouverObjetsDeplacementCopie(sujet: GroupeNominal, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {
    let objet: Objet = null;
    let objets: Objet[] = null;

    // si on déplace ceci, vérifier si ceci est un objet
    if ((sujet.nom.endsWith(" ceci") || sujet.nom === 'ceci') && (!ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet))) {
      console.error("Copier/Déplacer ceci ou contenu ceci: ceci n'est pas un objet.");
    }
    // si on déplace cela, vérifier si cela est un objet
    else if ((sujet.nom.endsWith(" cela") || sujet.nom === 'cela') && (!ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet))) {
      console.error("Copier/Déplacer cela ou contenu cela: cela n'est pas un objet.");
    } else {
      switch (sujet.nom) {
        case "ceci":
          objet = ceci as Objet;
          break;
        case "cela":
          objet = cela as Objet;
          break;
        case "joueur":
          objet = this.jeu.joueur;
          break;
        case "objets dans ceci":
          objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.dans);
          break;
        case "objets sur ceci":
          objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.sur);
          break;
        case "objets sous ceci":
          objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.sous);
          break;
        case "objets dans cela":
          objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.dans);
          break;
        case "objets sur cela":
          objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.sur);
          break;
        case "objets sous cela":
          objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.sous);
          break;
        case "objets ici":
          objets = this.eju.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
          break;

        default:
          let correspondanceSujet = this.eju.trouverCorrespondance(sujet, false, false);
          // un élément trouvé
          if (correspondanceSujet.elements.length === 1) {
            objet = correspondanceSujet.objets[0];
            // aucun élément trouvé
          } else if (correspondanceSujet.elements.length === 0) {
            console.error("trouverObjetsDeplacementCopie >>> je n’ai pas trouvé l’objet:", sujet);
            // plusieurs éléments trouvés
          } else {
            console.error("trouverObjetsDeplacementCopie >>> j’ai trouvé plusieurs correspondances pour l’objet:", sujet);
          }
          break;
      }
    }

    // si un seul objet, le mettre dans un tableau pour le retour
    if (objet) {
      objets = [];
      objets.push(objet);
    }

    return objets;
  }

  /**
   * Trouver la destination pour un déplacement ou une copie.
   */
  private trouverDestinationDeplacementCopie(complement: GroupeNominal, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {

    let destination: ElementJeu = null;

    switch (complement.nom) {

      case 'ceci':
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.element)) {
          destination = ceci as ElementJeu;
        } else {
          console.error("trouverDestinationDeplacementCopie >> Déplacer vers ceci: ceci n'est pas un élément du jeu.");
        }
        break;

      case 'cela':
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.element)) {
          destination = cela as ElementJeu;
        } else {
          console.error("trouverDestinationDeplacementCopie >> Déplacer vers cela: cela n'est pas un élément du jeu.");
        }
        break;

      case 'joueur':
        destination = this.jeu.joueur;
        break;

      case 'ici':
        destination = this.eju.curLieu;
        break;

      default:
        let correspondanceCompl = this.eju.trouverCorrespondance(complement, false, false);
        // un élément trouvé
        if (correspondanceCompl.elements.length === 1) {
          destination = correspondanceCompl.elements[0];
          // aucun élément trouvé
        } else if (correspondanceCompl.elements.length === 0) {
          console.error("trouverDestinationDeplacementCopie >>> je n’ai pas trouvé la destination:", complement);
          // plusieurs éléments trouvés
        } else {
          console.error("trouverDestinationDeplacementCopie >>> j’ai trouvé plusieurs correspondances pour la destination:", complement, correspondanceCompl);
        }
        break;
    }

    return destination;
  }

  /** Déplacer (ceci, joueur) vers (cela, joueur, ici). */
  private executerDeplacer(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    if (this.verbeux) {
      console.log("executerDeplacer >>> \nsujet=", sujet, "\npreposition=", preposition, "\ncomplément=", complement, "\nceci=", ceci, "\ncela=", cela);
    }
    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur' && preposition != 'sous') {
      console.error("executerDeplacer >>> préposition pas reconnue:", preposition);
    }

    // trouver l’élément à déplacer
    const objets = this.trouverObjetsDeplacementCopie(sujet, ceci, cela);

    // retrouver le nombre d’occurence (quantité) à déplacer
    let quantiteSujet = MotUtils.getQuantite(sujet.determinant, 1);

    // console.log(">> sujet.determinant=", sujet.determinant);
    // console.log(">> quantiteSujet=", quantiteSujet);


    // trouver la destination
    const destination = this.trouverDestinationDeplacementCopie(complement, ceci, cela);

    // si on a trouver le sujet et la distination, effectuer le déplacement.
    if (objets?.length == 1 && destination) {
      const curQuantite = Instructions.corrigerQuantite(objets[0], quantiteSujet);
      resultat = this.exectuterDeplacerObjetVersDestination(objets[0], preposition, destination, curQuantite);
      // si on a trouvé le sujet (liste d’objets) et la destination, effectuer les déplacements. 
    } else if (objets?.length > 1 && destination) {
      resultat.succes = true;
      // objets contenus trouvés
      objets.forEach(el => {
        const curQuantite = Instructions.corrigerQuantite(el, quantiteSujet);
        resultat.succes = (resultat.succes && this.exectuterDeplacerObjetVersDestination(el, preposition, destination, curQuantite).succes);
      });
    }

    return resultat;
  }

  private static corrigerQuantite(objetSource: Objet, quantite: number): number {
    // console.log(">> quantité demandée=", quantite);
    // console.log(">> quantité disponible=", objetSource.quantite);
    // corriger la quantité
    // -1 => si nombre de copies pas précisé, on prend tous les exemplaires
    if (quantite < 1) {
      quantite = objetSource.quantite;
      // si quantité demandée dépasse nombre d’exemplaires (et que le nombre d’exemplaire n’est pas infini), déplacer ce qu’il y a.
    } else if (quantite > objetSource.quantite && objetSource.quantite !== -1) {
      quantite = objetSource.quantite;
    }
    // console.log(">> quantité corrigée=", quantite);
    return quantite;
  }

  /** Copier sujet (ceci) vers complément (cela, joueur, ici). */
  private executerCopier(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    if (this.verbeux) {
      console.log("executerCopier >>> \nsujet=", sujet, "\npreposition=", preposition, "\ncomplément=", complement, "\nceci=", ceci, "\ncela=", cela);
    }
    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur' && preposition != 'sous') {
      console.error("executerCopier >>> préposition pas reconnue:", preposition);
    }

    // trouver l’élément à copier
    const objets = this.trouverObjetsDeplacementCopie(sujet, ceci, cela);

    // retrouver le nombre d’occurence (quantité) à copier
    let quantiteSujet = MotUtils.getQuantite(sujet.determinant, 1);

    // trouver la destination
    const destination = this.trouverDestinationDeplacementCopie(complement, ceci, cela);

    // si on a trouvé le sujet et la distination, effectuer la copie.
    if (objets?.length == 1 && destination) {
      resultat = this.exectuterCopierObjetVersDestination(objets[0], preposition, destination, quantiteSujet);
      // si on a trouvé le sujet (liste d’objets) et la destination, effectuer les déplacements. 
    } else if (objets?.length > 1 && destination) {
      resultat.succes = true;
      // objets contenus trouvés
      objets.forEach(el => {
        resultat.succes = (resultat.succes && this.exectuterCopierObjetVersDestination(el, preposition, destination, quantiteSujet).succes);
      });
    }

    return resultat;
  }

  /**
   * Déplacer un élément du jeu.
   */
  private exectuterDeplacerObjetVersDestination(objetSource: Objet, preposition: string, destination: ElementJeu, quantite: number): Resultat {

    let resultat = new Resultat(false, '', 1);
    let objetDeplace: Objet = null;

    // interpréter "vers" comme "dans".
    if (preposition == 'vers') {
      // support => sur
      if (ClasseUtils.heriteDe(destination.classe, EClasseRacine.support)) {
        preposition = "sur";
        // contenant, joueur, lieu, ...
      } else {
        preposition = "dans";
      }
    }

    // TODO: vérifications
    const nouvellePosition = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // regarder si un exemplaire de l’objet existe déjà à la destination
    let exemplaireDejaContenu = this.eju.getExemplaireDejaContenu(objetSource, nouvellePosition.pre, destination);

    // console.warn("?? quantite=", quantite);
    // console.warn("?? objetSource.quantite=", objetSource.quantite);

    // si on déplace tout et qu’il n’y a pas encore d’exemplaire
    if (quantite === objetSource.quantite && !exemplaireDejaContenu) {
      // console.log("exectuterDeplacerObjetVersDestination > cas 1");
      // déplacer simplement l’objet vers sa nouvelle destination
      objetSource.position = nouvellePosition;
      objetDeplace = objetSource;
      // console.log("exectuterDeplacerObjetVersDestination > fin 1");
      // si on copie seulement une partie ou qu’on copie tout dans un endroit qui en contient déjà
    } else {
      // si l’objet n’est pas encore contenu dans la nouvelle distination, il faut le dupliquer
      if (!exemplaireDejaContenu) {
        // console.log("exectuterDeplacerObjetVersDestination > cas 2");
        // copier l’objet
        let copie = this.eju.copierObjet(objetSource);
        // ajouter l’objet aux objets du jeu et lui définir un ID unique
        this.jeu.objets.push(copie);
        copie.id = this.jeu.nextID++; // définir l’ID de la copie
        // définir la quantité et le nombre de la copie
        copie.quantite = quantite;
        copie.nombre = (quantite === 1) ? Nombre.s : Nombre.p; // quantité ne devrait jamais valoir 0 !
        // définir la position de la copie
        copie.position = nouvellePosition;
        objetDeplace = copie;
        // si l’objet est déjà présent à cet endroit, augmenter la quantité
      } else {
        // si la quantité de l’exemplaire de destination n’est pas encore infinie
        if (exemplaireDejaContenu.quantite !== -1) {
          // si la quantité à copier est infinie
          if (quantite === -1 && objetSource.quantite === -1) {
            // console.log("exectuterDeplacerObjetVersDestination > cas 3a");
            exemplaireDejaContenu.quantite = -1;
            exemplaireDejaContenu.nombre = Nombre.p;
            // si quantité augmente normalement => augmenter quantité de l’original
          } else {
            // console.log("exectuterDeplacerObjetVersDestination > cas 3b");
            exemplaireDejaContenu.quantite += quantite;
            exemplaireDejaContenu.nombre = Nombre.p;
          }
        } else {
          // console.log("exectuterDeplacerObjetVersDestination > cas 3c");
        }
        objetDeplace = exemplaireDejaContenu;
      }

      // si on a déplacé tous les exemplaires de l’objetSource et que l’objet déplacé final n’est pas l’objetSource
      // effacer l’objet source
      if (objetDeplace !== objetSource && quantite === objetSource.quantite) {
        // console.log("exectuterDeplacerObjetVersDestination > fin 2");
        // effacer l’objet à déplacer (puisqu’on a augmenté la quantité à la place)
        const indexObjet = this.jeu.objets.indexOf(objetSource);
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
        } else {
          console.error("exectuterDeplacerObjetVersDestination >> pas pu retrouver l’objet à supprimer.");
        }
        // sinon diminuer la quantité
      } else {
        // console.log("exectuterDeplacerObjetVersDestination > fin 3");
        // diminuer quantité
        objetSource.quantite -= quantite;
        // vérifier le genre
        if (objetSource.quantite === 1) {
          objetSource.nombre = Nombre.s;
        }
      }

    }

    // si l'objet déplacé est le joueur, modifier la visibilité des objets
    if (objetDeplace.id === this.jeu.joueur.id) {

      // la présence des objets a changé
      this.eju.majPresenceDesObjets();

      // l’adjacence des lieux a changé
      this.eju.majAdjacenceLieux();

      // si l'objet déplacé n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objetDeplace.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est plus possédé ni porté
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.possede, true);
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.porte, true);
        // l’objet n’est plus caché (car on n’est pas sensé examiner directement un lieu)
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.cache, true);
        // si la destination est le lieu actuel, l'objet est présent
        if (objetDeplace.position.cibleId === this.eju.curLieu.id) {
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.present, true);
          // si c'est un autre lieu, l’objet n'est plus présent.
        } else {
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.present, true);
        }
        // l’élément est disponible puisque ni porté ni occupé par un autre vivant
        this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.disponible, true);
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est présent, possédé et n’est plus caché.
        if (destination.id === this.jeu.joueur.id) {
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.present, true);
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.possede, true);
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.cache, true);

          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé ni porté
          // TODO: un objet dans un contenant possédé est-il possédé ?
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.possede, true);
          // TODO: un objet dans un contenant porté est-il porté ?
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.porte, true);
          // L’objet est disponible
          // TODO: statut « occupé » si le contenant est un être vivant.
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.disponible, true);
          this.eju.majPresenceObjet(objetDeplace);
        }
      }

      // si l’objet déplacé est un contenant ou un support, il faut màj les objets contenus
      let contenu: Objet[] = [];
      if (ClasseUtils.heriteDe(objetDeplace.classe, EClasseRacine.support)) {
        contenu = this.eju.obtenirContenu(objetDeplace, PrepositionSpatiale.sur);
      } else if (ClasseUtils.heriteDe(objetDeplace.classe, EClasseRacine.contenant)) {
        contenu = this.eju.obtenirContenu(objetDeplace, PrepositionSpatiale.dans);
      }
      if (contenu?.length > 0) {
        contenu.forEach(curObj => {
          this.eju.majPresenceObjet(curObj);
        });
      }

    }

    // l’objet source a été modifié
    this.jeu.etats.ajouterEtatElement(objetSource, EEtatsBase.modifie, true);
    // l’objet déplacé a été déplacé
    this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.deplace, true);
    // la destination a été modifiée
    this.jeu.etats.ajouterEtatElement(destination, EEtatsBase.modifie, true);

    resultat.succes = true;
    return resultat;
  }

  /**
 * Copier un élément du jeu.
 */
  private exectuterCopierObjetVersDestination(original: Objet, preposition: string, destination: ElementJeu, quantite: number): Resultat {
    let resultat = new Resultat(false, '', 1);

    // interpréter "vers" comme "dans".
    if (preposition == 'vers') {
      // support => sur
      if (ClasseUtils.heriteDe(destination.classe, EClasseRacine.support)) {
        preposition = "sur";
        // contenant, joueur, lieu, ...
      } else {
        preposition = "dans";
      }
    }

    // corriger la quantité
    // -1 => si nombre de copies pas précisé, on prend 1 seul exemplaire
    if (quantite < 1) {
      quantite = 1;
    }

    // si l’objet à copier est le joueur, refuser !
    if (original.id === this.jeu.joueur.id) {
      console.error("exectuterCopierObjetVersDestination >> Le joueur ne peut pas être copié !");
    }

    // TODO: vérifications
    const positionCopie = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    let copie = this.eju.copierObjet(original);

    // si la destination de la copie est la même que celle de l’original, augmenter la quantité
    if (PositionsUtils.positionsIdentiques(original.position, positionCopie)) {
      // si la quantité n’est pas infinie, augmenter de la quantité à copier
      if (original.quantite !== -1) {
        original.quantite += quantite;
        original.nombre = Nombre.p;
      }
      // destination de la copie est différente
    } else {

      // si cet objet est déjà présent à cet endroit, augmenter la quantité
      let exemplaireDejaContenu = this.eju.getExemplaireDejaContenu(original, positionCopie.pre, destination);

      // déjà présent
      if (exemplaireDejaContenu !== null) {
        // => destination: on augmente la quantité de l’objet
        // si la quantité n’est pas infinie, augmenter de la quantité à copier
        if (exemplaireDejaContenu.quantite !== -1) {
          exemplaireDejaContenu.quantite += quantite;
          exemplaireDejaContenu.nombre = Nombre.p;
        }
        // pas encore présent => on ajoute la copie aux objets
      } else {
        this.jeu.objets.push(copie);
        copie.quantite = quantite; // définir la quantité
        copie.id = this.jeu.nextID++; // définir l’ID de la copie
        // remarque: on utilise la méthode déplacer afin de mettre à jour tous les attributs de l’objet et du contenant.
        this.exectuterDeplacerObjetVersDestination(copie, preposition, destination, copie.quantite);
      }
    }



    resultat.succes = true;
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

  /** Changer quelque chose dans le jeu */
  private executerChanger(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction, ceci, cela);
          break;

        case 'historique':
          resultat = this.executerHistorique(instruction);
          break;

        // case 'inventaire':
        //   resultat = this.executerInventaire(instruction);
        //   break;

        case 'ceci':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(ceci as Objet, instruction);
          } else {
            console.error("executer changer ceci: ceci n'est pas un objet.");
          }
          break;

        case 'cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(cela as Objet, instruction);
          } else {
            console.error("executer changer cela: cela n'est pas un objet.");
          }
          break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet, false, false);

          // PAS OBJET, PAS LIEU et PAS COMPTEUR
          if (correspondance.objets.length === 0 && correspondance.lieux.length === 0 && correspondance.compteurs.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);
            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0 && correspondance.compteurs.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0 && correspondance.compteurs.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.executerElementJeu(correspondance.lieux[0], instruction);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
            }
            // COMPTEUR(S) SEULEMENT
          } else if (correspondance.objets.length === 0 && correspondance.lieux.length === 0) {
            if (correspondance.compteurs.length === 1) {
              resultat = this.executerCompteur(correspondance.compteurs[0], instruction);
            } else {
              console.error("executerChanger: plusieurs compteurs trouvés:", correspondance);
            }
          } else {
            console.error("executerChanger: trouvé lieu(x) ET objet(s):", correspondance);
          }
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
   * Exécuter une instruction de type "réaction".
   * @param instruction 
   * @param ceci 
   * @param cela 
   */
  private executerReaction(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.complement1) {
      switch (instruction.complement1.toLocaleLowerCase()) {
        case 'réaction de ceci':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, null);
          } else {
            console.error("Exécuter réaction de ceci: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, null);
          } else {
            console.error("Exécuter réaction de cela: cela n'est pas un objet");
          }
          break;
        case 'réaction de ceci concernant cela':
        case 'réaction de ceci à cela':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, cela);
          } else {
            console.error("Exécuter réaction de ceci à cela: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela concernant ceci':
        case 'réaction de cela à ceci':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, ceci);
          } else {
            console.error("Exécuter réaction de cela à ceci: cela n'est pas un objet");
          }
          break;

        default:
          console.error("executerReaction : sujet autre que « réaction de ceci », « réaction de cela », « réaction de ceci à cela » pas pris en charge, instruction:", instruction);
      }
    } else {
      console.error("executerReaction : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
   * Exécuter la réaction d'une personne à un sujet (ou non).
   */
  private suiteExecuterReaction(personne: ElementJeu, sujet: Intitule) {

    let resultat = new Resultat(false, '', 1);
    let reaction: Reaction = null;

    // vérifier que la personne est bien un objet
    if (!personne) {
      console.error("suiteExecuterReaction: la personne est null");
    }
    if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.personne)) {
      if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.objet)) {
        console.error("suiteExecuterReaction: la personne qui doit réagir n’est ni une personne, ni un objet:", personne);
      } else {
        console.warn("suiteExecuterReaction: la personne qui doit réagir n’est pas une personne:", personne);
      }
    }

    // réaction à un sujet
    if (sujet) {
      // console.log("suiteExecuterReaction: sujet=", sujet, " personne=", personne);

      const nomMinuscules = sujet.intitule.nom.toLowerCase() ?? null;
      const epitheteMinuscules = sujet.intitule.epithete?.toLowerCase() ?? null;

      // rechercher s’il y a une des réaction qui comprend ce sujet
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == nomMinuscules && y.epithete == epitheteMinuscules));
      // si on n’a pas de résultat, rechercher le sujet « sujet inconnu »:
      if (!reaction) {
        reaction = (personne as Objet).reactions
          .find(x => x.sujets && x.sujets.some(y => y.nom == "sujet" && y.epithete == "inconnu"));
      }
    }
    // si pas de réaction à un sujet, prendre réaction par défaut (aucun sujet)
    if (!reaction) {
      // console.log("suiteExecuterReaction: réaction à aucun sujet");
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == "aucun" && y.epithete == "sujet"));
    }
    // on a trouvé une réaction
    if (reaction) {
      // TODO: faut-il fournir ceci,cela, l’évènement et déclenchements ?
      resultat = this.executerInstructions(reaction.instructions, null, null, null, null);
      // on n’a pas trouvé de réaction
    } else {
      // si aucune réaction ce n’est pas normal: soit il faut une réaction par défaut, soit il ne faut pas passer par ici.
      console.error("suiteExecuterReaction : cette personne n’a pas de réaction par défaut:", personne);
    }

    return resultat;
  }

  /** Exécuter une instruction qui cible l'historique. */
  private executerHistorique(instruction: ElementsPhrase) {
    let resultat = new Resultat(false, '', 1);
    if (instruction.verbe.toLocaleLowerCase() === 'contient') {
      let valeur = instruction.complement1.trim().toLocaleLowerCase();
      // trouver valeur dans l’historique
      let foundIndex = this.jeu.sauvegardes.indexOf(valeur);

      // SUPPRIMER la valeur de l’historique
      if (instruction.negation) {
        // supprimer seulement si présente
        if (foundIndex !== -1) {
          this.jeu.sauvegardes.splice(foundIndex, 1);
          resultat.succes = true;
        }
        // AJOUTER une valeur à l’historique
      } else {
        // ajouter seulement si pas encore présente
        if (foundIndex === -1) {
          this.jeu.sauvegardes.push(valeur);
          resultat.succes = true;
        }
      }
    }
    return resultat;
  }

  /** Exécuter une instruction qui cible le joueur */
  private executerJoueur(instruction: ElementsPhrase, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      // DÉPLACER LE JOUEUR
      case 'se trouve':
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, instruction.sujetComplement1, ceci as Objet, cela);
        break;

      // AJOUTER UN OBJET A L'INVENTAIRE
      case 'possède':
        // Objet classique
        if (instruction.sujetComplement1) {
          resultat = this.executerDeplacer(instruction.sujetComplement1, "dans", instruction.sujet, ceci as Objet, cela);
          // Instruction spécifique
        } else if (instruction.complement1) {
          let objets: Objet[] = null;
          // - objets dans ceci
          if (instruction.complement1.endsWith('objets dans ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans ceci: ceci n'est as un objet.");
            }
            // - objets sur ceci
          } else if (instruction.complement1.endsWith('objets sur ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur ceci: ceci n'est as un objet.");
            }
            // - objets sous ceci
          } else if (instruction.complement1.endsWith('objets sous ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(ceci as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous ceci: ceci n'est as un objet.");
            }
            // - objets dans cela
          } else if (instruction.complement1.endsWith('objets dans cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans cela: cela n'est as un objet.");
            }
            // - objets sur cela
          } else if (instruction.complement1.endsWith('objets sur cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur cela: cela n'est as un objet.");
            }
            // - objets sous cela
          } else if (instruction.complement1.endsWith('objets sous cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(cela as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous cela: cela n'est as un objet.");
            }
            // - objets ici
          } else if (instruction.complement1.endsWith('objets ici')) {
            objets = this.eju.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
          }

          // objets contenus trouvés
          if (objets) {
            resultat.succes = true;
            objets.forEach(el => {
              resultat = (resultat.succes && this.exectuterDeplacerObjetVersDestination(el, 'dans', this.jeu.joueur, el.quantite));
            });
          }
        }
        break;

      // PORTER UN OBJET (s'habiller avec)
      case 'porte':
        let objet: Objet = this.trouverObjetCible(instruction.complement1, instruction.sujetComplement1, ceci, cela);
        if (objet) {
          // NE porte PAS
          if (instruction.negation) {
            // l'objet n’est plus porté
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.porte, true);
            // PORTE
          } else {
            // déplacer l'objet vers l'inventaire
            resultat = this.exectuterDeplacerObjetVersDestination(objet, "dans", this.jeu.joueur, objet.quantite);
            // l'objet est porté
            this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.porte, true);
          }
        }
        break;

      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerJoueur: retirer l’état '", instruction.complement1, "' ele=", this.jeu.joueur);
          }
          this.jeu.etats.retirerEtatElement(this.jeu.joueur, instruction.complement1);
          // est => ajouter un état
        } else {
          if (this.verbeux) {
            console.log("executerJoueur: ajouter l’état '", instruction.complement1, "'");
          }
          // séparer les attributs, les séparateurs possibles sont «, », « et » et « ou ».
          const attributsSepares = PhraseUtils.separerListeIntitules(instruction.complement1);
          attributsSepares.forEach(attribut => {
            this.jeu.etats.ajouterEtatElement(this.jeu.joueur, attribut);
          });
        }
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  private executerCompteur(compteur: Compteur, instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'augmente':
      case 'augmentent':
        CompteursUtils.changerValeurCompteur(compteur, 'augmente', instruction.complement1)
        break;

      case 'diminue':
      case 'diminuent':
        CompteursUtils.changerValeurCompteur(compteur, 'diminue', instruction.complement1)
        break;

      case 'vaut':
      case 'valent':
        CompteursUtils.changerValeurCompteur(compteur, 'vaut', instruction.complement1)
        break;

      default:
        resultat.succes = false;
        console.error("executerCompteur: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }

    return resultat;

  }



  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
          }
          this.jeu.etats.retirerEtatElement(element, instruction.complement1);
          // est => ajouter un état
        } else {
          if (this.verbeux) {
            console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
          }
          // séparer les attributs, les séparateurs possibles sont «, », « et » et « ou ».
          const attributsSepares = PhraseUtils.separerListeIntitules(instruction.complement1);
          attributsSepares.forEach(attribut => {
            this.jeu.etats.ajouterEtatElement(element, attribut);
          });
        }

        break;

      case 'se trouve':
      case 'se trouvent':
        console.log("executerElementJeu: se trouve:", instruction);
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, instruction.sujetComplement1);
        break;

      default:
        resultat.succes = false;
        console.error("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }









  /**
   * Retrouver l’objet cible de la condition.
   * @param brute « ceci » et « cela » sont gérés.
   * @param intitule un objet à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  private trouverObjetCible(brute: string, intitule: GroupeNominal, ceci: Intitule | ElementJeu, cela: Intitule | ElementJeu): Objet {
    let objetCible: Objet = null;
    // retrouver OBJET SPÉCIAL
    if (brute === 'ceci') {
      if (ceci && ClasseUtils.heriteDe(ceci?.classe, EClasseRacine.objet)) {
        objetCible = ceci as Objet;
      } else {
        console.error("Instructions > trouverObjetCible > ceci n’est pas un objet.");
      }
    } else if (brute === 'cela') {
      if (cela && ClasseUtils.heriteDe(cela?.classe, EClasseRacine.objet)) {
        objetCible = cela as Objet;
      } else {
        console.error("Instructions > trouverObjetCible > cela n’est pas un objet.");
      }
      // retrouver OBJET CLASSIQUE
    } else if (intitule) {
      const objetsTrouves = this.eju.trouverObjet(intitule, false);
      if (objetsTrouves.length == 1) {
        objetCible = objetsTrouves[0];
      } else {
        console.warn("Instructions > trouverObjetCible > plusieurs correspondances trouvées pour :", brute);
      }
    } else {
      console.error("Instructions > trouverObjetCible > objet spécial pas pris en change :", brute);
    }
    if (!objetCible) {
      console.warn("Instructions > trouverObjetCible > pas pu trouver :", brute);
    }
    return objetCible;
  }

  /** Exécuter l’instruction « Exécuter commande "xxxx…" */
  public executerCommande(instruction: ElementsPhrase): Resultat {
    let res = new Resultat(true, "", 1);
    const tokens = ExprReg.xActionExecuterCommande.exec(instruction.complement1);
    if (tokens) {
      const commande = Commandeur.nettoyerCommande(tokens[1]);
      res.sortie = this.com.executerCommande(commande);
    } else {
      console.error("executerAction: format complément1 par reconnu:", instruction.complement1);
      res.succes = false;
    }
    return res;
  }

  /** Exécuter l’instruction « Exécuter action xxxx… */
  public executerAction(instruction: ElementsPhrase, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement, declenchements: number): Resultat {

    let res = new Resultat(true, "", 1);

    // décomposer le complément
    const tokens = ExprReg.xActionExecuterAction.exec(instruction.complement1);
    if (tokens) {
      const insInfinitif = tokens[1];
      const insPrepCeci = tokens[2];
      const insCeci = tokens[3];
      const insPrepCela = tokens[4];
      const insCela = tokens[5];

      const actionCeci = InstructionsUtils.getCible(insCeci, ceci, cela, evenement, this.eju, this.jeu);
      const actionCela = InstructionsUtils.getCible(insCela, ceci, cela, evenement, this.eju, this.jeu);

      const resChercherCandidats = this.act.chercherCandidatsActionSansControle(insInfinitif, insCeci ? true : false, insCela ? true : false);

      // action pas trouvée
      if (!resChercherCandidats.verbeConnu) {
        res.sortie = "{+[{_Exécuter Action_} : Action pas trouvée : " + insInfinitif + "]+}";
        res.succes = false;
        // aucun candidat valide trouvé
      } else if (resChercherCandidats.candidatsEnLice.length === 0) {
        res.sortie = "{+[{_Exécuter Action_} : Action pas compatible : " + insInfinitif + "]+}";
        console.error("Exécuter l’action: Action pas compatible.");
        res.succes = false;
        // exactement une action trouvée
      } else if (resChercherCandidats.candidatsEnLice.length === 1) {
        let action = resChercherCandidats.candidatsEnLice[0];
        const sousResExecuter = this.executerInstructions(action.instructions, actionCeci, actionCela, evenement, declenchements);
        const sousResTerminer = this.executerInstructions(action.instructionsFinales, actionCeci, actionCela, evenement, declenchements);
        res.sortie = res.sortie + sousResExecuter.sortie + sousResTerminer.sortie;
        res.succes = sousResExecuter.succes && sousResTerminer.succes;
        res.nombre = 1 + sousResExecuter.nombre + sousResTerminer.nombre;
        // plusieurs actions trouvées
      } else {
        res.sortie = "{+Aïe: {_Exécuter Action_} : Plusieurs actions compatibles trouvées pour : " + insInfinitif + ".+}"
        res.succes = false;
      }

    } else {
      console.error("executerAction: format complément1 par reconnu:", instruction.complement1);
      res.succes = false;
    }

    return res;
  }


}