import { ChoixEcran } from '../../models/jouer/contexte-ecran';
import { ClasseUtils } from '../commun/classe-utils';
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionHandler } from "./instruction-handler";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Objet } from "../../models/jeu/objet";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";
import { TypeInterruption } from "../../models/jeu/interruption";

/**
 * Instructions de sortie écran : afficher (image / écran) et effacer
 * (écran / objet du jeu).
 */
export class InstructionAfficher implements InstructionHandler {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
  ) { }

  executer(
    instruction: ElementsPhrase,
    nbExecutions: number,
    contexteTour: ContexteTour,
    evenement: Evenement | undefined,
    declenchements: number,
  ): Resultat {
    switch (instruction.infinitif.toLowerCase()) {
      case 'afficher':
        return this.executerAfficher(instruction);
      case 'effacer':
        return this.executerEffacer(instruction, contexteTour);
      default:
        return new Resultat(false, '', 1);
    }
  }

  private executerAfficher(instruction: ElementsPhrase): Resultat {
    const resultat = new Resultat(true, '', 1);
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
    return resultat;
  }

  private executerEffacer(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet.nom == 'écran') {
      resultat.sortie = "@@effacer écran@@";
    } else {
      const cible = InstructionsUtils.trouverObjetCible(instruction.sujet.nom, instruction.sujet, contexteTour, this.eju, this.jeu);
      if (cible) {
        if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.objet)) {
          const sousResultat = this.effacerElement(cible as Objet);
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
    return resultat;
  }

  /** Effacer un élément du jeu (objet/lieu). */
  private effacerElement(ceci: ElementJeu = null): Resultat {
    const resultat = new Resultat(false, '', 1);
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
}
