import { ConditionsUtils } from './conditions-utils';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Instruction } from '../models/compilateur/instruction';
import { Jeu } from '../models/jeu/jeu';
import { Objet } from '../models/jeu/objet';
import { PositionObjet } from '../models/jeu/position-objet';
import { Resultat } from '../models/jouer/resultat';
import { StringUtils } from './string.utils';

export class Instructions {

  private cond: ConditionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
  }

  public executerInstructions(instructions: Instruction[]): Resultat {

    console.warn("BEGIN exInstructionS >>> instructionS=", instructions);


    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const subResultat = this.executerInstruction(ins);
        resultat.nombre += subResultat.nombre;
        resultat.succes = (resultat.succes && subResultat.succes);
        resultat.sortie += subResultat.sortie;
      });
    }

    console.warn("END exInstructionS >>> instructionS=", instructions, "resultat=", resultat);

    return resultat;
  }

  public executerInstruction(instruction: Instruction): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }
    // instruction conditionnelle
    if (instruction.condition) {

      if (this.cond.siEstVrai(null, instruction.condition)) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee);
      } else {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        //if (instruction.sujet == null && instruction.verbe) {
        sousResultat = this.executerInfinitif(instruction.instruction);
        // } else if (instruction.sujet) {
        // this.executerSujetVerbe(instruction);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;

    console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }

  private executerInfinitif(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement.trim();
        resultat.sortie += "\n" + complement.slice(1, complement.length - 1).trim();
        // si la chaine se termine par un espace, ajouter un saut de ligne.
        if (complement.endsWith(' "')) {
          resultat.sortie += "\n";
        }
        break;
      case 'changer':
        sousResultat = this.executerChanger(instruction);
        resultat.succes = sousResultat.succes;
        break;

      case 'deplacer':
        sousResultat = this.executerDeplacer(instruction);
        resultat.succes = sousResultat.succes;

      case 'sauver':
        console.log("executerInfinitif >> sauver=", instruction.complement);
        if (instruction.complement) {
          this.jeu.sauvegardes.push(instruction.complement);
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }

    return resultat;
  }

  private executerDeplacer(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(false, '', 1);

    return resultat;
  }

  private executerChanger(instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction);
          break;

        // case 'inventaire':
        //   resultat = this.executerInventaire(instruction);
        //   break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet);

          // PAS OBJET ET PAS LIEU
          if (correspondance.objets.length === 0 && correspondance.lieux.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);

            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
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

  private executerJoueur(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        resultat = this.deplacerObjetVersLieu(instruction.sujet, instruction.complement)
        break;
      case 'possède':
        resultat = this.deplacerObjetVersObjet(instruction.sujetComplement, instruction.sujet);
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  deplacerObjetVersLieu(obj: GroupeNominal, destination: string) {
    return new Resultat(false, 'objet délpacé vers le lieu.', 1);
  }
  deplacerObjetVersObjet(obj: GroupeNominal, destination: GroupeNominal) {
    return new Resultat(false, 'objet déplacé vers l’objet.', 1);
  }

  // positionnerJoueur(position: string): Resultat {

  //   let resultat = new Resultat(true, '', 1);

  //   position = position.trim().replace(/^au |dans (le |la |l'|l’)|à l’intérieur (du|de l’|de l'|de la |des )|sur (le |la |l’|l'|les)/i, '');
  //   // chercher le lieu
  //   let lieuxTrouves = this.jeu.lieux.filter(x => StringUtils.normaliserMot(x.nom).startsWith(position));
  //   // si on n’a pas trouvé
  //   if (lieuxTrouves.length == 0) {
  //     console.error("positionnerJoueur : pas pu trouver le lieu correspondant à la position", position);
  //     resultat.succes = false;
  //     // si on a trouvé un lieu
  //   } else if (lieuxTrouves.length === 1) {
  //     this.jeu.position = lieuxTrouves[0].id;
  //     // si on a trouvé plusieurs lieux différents
  //   } else if (lieuxTrouves.length > 1) {
  //     // TODO: ajouter des mots en plus
  //     console.error("positionnerJoueur : plusieurs lieux trouvés pour la position", position);
  //     resultat.succes = false;
  //   }

  //   return resultat;
  // }

  // private executerInventaire(instruction: ElementsPhrase): Resultat {
  //   let resultat = new Resultat(false, '', 1);

  //   switch (instruction.verbe.toLowerCase()) {
  //     case 'contient':
  //       resultat = this.ajouterInventaire(instruction.sujetComplement);
  //       break;

  //     default:
  //       console.error("executerInventaire : pas compris verbe", instruction.verbe, instruction);
  //       break;
  //   }
  //   return resultat;
  // }

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
        // retirer un état
        if (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus') {
          console.log("executerElementJeu: retirer l’état ", instruction.complement);
          ElementsJeuUtils.retirerEtat(element, instruction.complement, null);
          // ajouter un état
        } else {
          console.log("executerElementJeu: ajouter l’état ", instruction.complement);
          ElementsJeuUtils.ajouterEtat(element, instruction.complement);
        }
        break;

      default:
        resultat.succes = false;
        console.warn("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  // ajouterInventaire(intitule: GroupeNominal): Resultat {

  //   let resultat = new Resultat(false, '', 1);

  //   if (intitule) {
  //     let objetTrouve = this.eju.trouverElementJeu(intitule, EmplacementElement.partout, true, false);
  //     if (objetTrouve === -1) {
  //       console.warn("ajouterInventaire > plusieurs objets trouvés:", intitule);
  //     } else if (objetTrouve) {
  //       const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
  //       let cible = nouvelObjet;
  //       // si l'inventaire contient déjà le même objet, augmenter la quantité
  //       let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
  //       if (objInv) {
  //         objInv.quantite += 1;
  //         cible = objInv;
  //       } else {
  //         this.jeu.inventaire.objets.push(nouvelObjet);
  //       }
  //       resultat.succes = true;
  //     } else {
  //       console.warn("ajouterInventaire > objet pas trouvé:", intitule);
  //     }
  //   } else {
  //     console.error("ajouterInventaire >>> intitulé est null.");
  //   }
  //   return resultat;
  // }

}