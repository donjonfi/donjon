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
        pluriel = nomS + 'x';
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
        feminin = nomM.slice(0, nomM.length - 1) + 've';
        // x => se
      } else if (nomM.endsWith('x')) {
        feminin = nomM.slice(0, nomM.length - 1) + 'se';
        // el => + le (elle)
      } else if (nomM.endsWith('el')) {
        feminin = nomM + 'le';
        // et => + te (ette)
      } else if (nomM.endsWith('et')) {
        feminin = nomM + 'te';
        // eau => elle
      } else if (nomM.endsWith('eau')) {
        feminin = nomM.slice(0, nomM.length - 2) + 'lle';
        // e => ne pas changer
      } else if (nomM.endsWith('e')) {
        feminin = nomM;
        // autres cas => +e
      } else {
        feminin = nomM + 'e';
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
          retVal = Genre.m;
          break;
        case "la":
        case "elle":
        case "elles":
        case "une":
        case "ma":
        case "sa":
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

  public static getNombre(determinant: string) {
    let retVal = Nombre.s;
    if (determinant) {
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
