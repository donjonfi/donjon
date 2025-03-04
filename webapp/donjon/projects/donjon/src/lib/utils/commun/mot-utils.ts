import { Genre } from '../../models/commun/genre.enum';
import { Nombre } from '../../models/commun/nombre.enum';

export class MotUtils {

  static readonly xNombrePluriel = /^([2-9]$)|([1-9]\d+$)/;

  /** essayer de déterminer le singulier sur base des règles les plus communes */
  static getSingulier(nomP: string) {
    let singulier = nomP;
    if (nomP) {
      // eaux => eau / eux => eu
      if (nomP.endsWith('eaux') || nomP.endsWith('eux')) {
        singulier = nomP.slice(0, nomP.length - 1);
        // aux => al
      } else if (nomP.endsWith('aux')) {
        singulier = nomP.slice(0, nomP.length - 2) + 'l';
        // s => -s
      } else if (nomP.endsWith('s')) {
        singulier = nomP.slice(0, nomP.length - 1);
      }
    }
    return singulier;
  }

  /** essayer de déterminer le pluriel sur base des règles les plus communes */
  static getPluriel(nomS: string) {
    let pluriel = nomS;
    if (nomS) {
      // al => aux
      if (nomS.endsWith('al')) {
        pluriel = nomS.slice(0, nomS.length - 1) + 'ux';
        // (e)au / eu => +x
      } else if (nomS.endsWith('au') || nomS.endsWith('eu')) {
        if (nomS == 'pneu' || nomS == 'bleu' || nomS == 'pneu' || nomS == 'émeu') {
          pluriel = nomS + 's';
        } else {
          pluriel = nomS + 'x';
        }
      } else if (nomS.endsWith('ou')) {
        if (nomS == 'bijou' || nomS == 'caillou' || nomS == 'chou' || nomS == 'genou' || nomS == 'hibou' || nomS == 'joujou' || nomS == 'pou' || nomS == 'ripou') {
          pluriel = nomS + 'x';
        } else {
          pluriel = nomS + 's';
        }
        // s/x/z => ne pas changer
      } else if (nomS.endsWith('s') || nomS.endsWith('x') || nomS.endsWith('z')) {
        pluriel = nomS;
        // autres cas => +s
      } else {
        pluriel = nomS + 's';
      }
    }
    return pluriel;
  }

  /** essayer de déterminer le féminin sur base des règles les plus communes */
  static getFeminin(nomM: string) {
    let feminin = nomM;
    if (nomM) {
      // p ou f => ve
      if (nomM.endsWith('p') || nomM.endsWith('f')) {
        if (nomM == 'bref') {
          feminin = 'brève';
        } else {
          feminin = nomM.slice(0, nomM.length - 1) + 've';
        }
        // x => se
      } else if (nomM.endsWith('x')) {
        if (nomM == 'doux') {
          feminin = 'douce';
        } else if (nomM == 'faux') {
          feminin = 'fausse';
        } else if (nomM == 'roux') {
          feminin = 'rousse';
        } else if (nomM == 'vieux') {
          feminin = 'vieille';
        } else {
          feminin = nomM.slice(0, nomM.length - 1) + 'se';
        }
        // el, eil => + le (elle, eille)
      } else if (nomM.endsWith('el') || nomM.endsWith('eil')) {
        feminin = nomM + 'le';
        // en => + ne (enne)
      } else if (nomM.endsWith('en')) {
        feminin = nomM + 'ne';
        // on => + ne (onne)
      } else if (nomM.endsWith('on')) {
        feminin = nomM + 'ne';
        // et => + te (ette)
      } else if (nomM.endsWith('et')) {
        if (["complet", "concret", "désuet", "discret", "indiscret", "inquiet", "replet", "secret"].includes(nomM)) {
          feminin = nomM.slice(0, nomM.length - 2) + 'ète';
        } else {
          feminin = nomM + 'te';
        }
        // ot => + te (otte)
      } else if (nomM.endsWith('ot')) {
        if (["idiot"].includes(nomM)) {
          feminin = nomM + 'e';
        } else {
          feminin = nomM + 'te';
        }
        // ec => +he (eche) (ou que)
      } else if (nomM.endsWith('ec')) {
        if (["public"].includes(nomM)) {
          feminin = nomM.slice(0, nomM.length - 1) + 'que';
        } else if (nomM.endsWith('sec')) {
          feminin = 'sèche';
        } else {
          feminin = nomM + 'he';
        }
        // er => ère
      } else if (nomM.endsWith('er')) {
        feminin = nomM.slice(0, nomM.length - 2) + 'ère';
        // eau => elle
      } else if (nomM.endsWith('eau')) {
        feminin = nomM.slice(0, nomM.length - 2) + 'lle';
        // l => + e (le)
      } else if (nomM.endsWith('l')) {
        if (["gentil", "nul"].includes(nomM)) {
          feminin = nomM + 'le';
        } else {
          feminin = nomM + 'e';
        }
        // s => -se ou -sse
      } else if (nomM.endsWith('s')) {
        if (["gras"].includes(nomM)) {
          feminin = nomM + 'se';
        } else {
          feminin = nomM + 'e';
        }
        // e => ne pas changer
      } else if (nomM.endsWith('e')) {
        feminin = nomM;
        // autres cas => +e
      } else {
        if (nomM == 'bénin') {
          feminin = 'bénigne';
        } else if (nomM == 'malin') {
          feminin = 'maligne';
        } else if (nomM == 'favori') {
          feminin = 'favorite';
        } else if (nomM == 'fou') {
          feminin = 'folle';
        } else if (nomM == 'mou') {
          feminin = 'molle';
        } else if (nomM == 'sympa') {
          feminin = 'sympa';
        } else if (nomM == 'chic') {
          feminin = 'chic';
        } else if (nomM == 'frais') {
          feminin = 'fraîche';
        } else {
          feminin = nomM + 'e';
        }
      }
    }
    return feminin;
  }


  /**
   * Obtenir le genre d'un élément du donjon.
   * @param determinant déterminant du mot
   * @param feminin forcer féminin si pas de déterminant ou déterminant inconnu.
   */
  public static getGenre(determinant: string, feminin: boolean): Genre {
    let retVal = Genre.n;

    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "il":
        case "ils":
        case "un":
        case "mon":
        case "son":
        case "celui-ci":
        case "ceux-ci":
          retVal = Genre.m;
          break;
        case "la":
        case "elle":
        case "elles":
        case "une":
        case "ma":
        case "sa":
        case "celle-ci":
        case "celles-ci":
          retVal = Genre.f;
          break;

        default:
          if (feminin) {
            retVal = Genre.f;
          } else {
            retVal = Genre.m;
          }
          break;
      }
    } else {
      if (feminin) {
        retVal = Genre.f;
      } else {
        retVal = Genre.m;
      }
    }
    return retVal;
  }

  /**
   * Ce mot est-il une forme plurielle ?
   * => un mot qui se termine par 's', 'x' ou 'z' ne change pas de forme
   *    au pluriel, on peut donc dire qu’il est pluriel.
   * => un mot composé dont 1 des mots a une terminaison plurielle à de fortes chances d’être au pluriel.
   */
  public static estFormePlurielle(mot: string): boolean {
    let retVal = false;
    // si le mot ne contient pas d’espace et se termine par 's', 'x' ou 'z'
    // on peut considérer que c’est une forme plurielle.

    // mot composé avec 2 terminaisons plurielles => ex: choux-fleurs, sourds-muets
    if (mot.match(/^\S+?(s|x|z)\-\S+(s|x|z)$/i)) {
      retVal = true;
      // mot composé avec 1er mot terminaison plurielle => ex: timbres-poste, crocs-en-jambe
    } else if (mot.match(/^\S+?(s|x|z)\-\S$/i)) {
      retVal = true;
      // mot simple ou composé avec 1 terminaison plurielle => ex: chats, couvre-lits, tragi-comédies, arrière-boutiques
    }
    if (mot.match(/^\S+(s|x|z)$/i)) {
      retVal = true;
    }

    return retVal
  }

  public static getNombre(determinant: string, toujoursPluriel: boolean): Nombre {
    let retVal = Nombre.s;

    if (toujoursPluriel) {
      retVal = Nombre.tp;
    } else if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "la":
        case "l'":
        case "l’":
        case "1":
        case "un":
        case "une":
          retVal = Nombre.s;
          break;
        case "les":
        case "des":
        case "deux":
        case "trois":
          retVal = Nombre.p;
          break;
        case "du":
        case "de la":
        case "de l'":
        case "de l’":
          retVal = Nombre.i;
          break;

        default:
          if (MotUtils.xNombrePluriel.exec(determinant.trim()) !== null) {
            retVal = Nombre.p;
          } else {
            retVal = Nombre.s;
          }
          break;
      }
    }
    return retVal;
  }

  public static getQuantite(determinant: string, quantiteSiAucunDeterminant: number): number {
    let retVal = 0;
    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "la":
        case "l'":
        case "l’":
        case "1":
        case "un":
        case "une":
          retVal = 1;
          break;
        case "deux":
          retVal = 2;
          break;
        case "trois":
          retVal = 3;
          break;
        case "les":
        case "des":
          retVal = -1;
          break;
        case "du":
        case "de la":
        case "de l'":
        case "de l’":
          retVal = -1;
          break;

        // infini
        case "-1":
          retVal = -1;
          break;

        // aucun déterminant 
        case "":
          retVal = quantiteSiAucunDeterminant;
          break;

        default:
          // précédé d’un nombre > 1 ?
          if (MotUtils.xNombrePluriel.exec(determinant.trim()) !== null) {
            retVal = +(determinant.trim());
            // (nombre 1 déjà testé plus haut)
          } else {
            retVal = 0;
          }
          break;
      }
    } else {
      retVal = quantiteSiAucunDeterminant;
    }
    return retVal;
  }

}
