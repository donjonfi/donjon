import { Genre } from 'src/app/models/commun/genre.enum';
import { Nombre } from 'src/app/models/commun/nombre.enum';

export class MotUtils {

  static readonly xNombrePluriel = /^[2-9]\d*$/;

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
        // el => elle
      } else if (nomM.endsWith('el')) {
        feminin = nomM + 'le';
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
          retVal = Genre.m;
          break;
        case "la":
        case "elle":
        case "elles":
        case "une":

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
    }
    return retVal;
  }

  public static getNombre(determinant: string) {
    let retVal = Nombre.s;
    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "la":
        case "l'":
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

  public static getQuantite(determinant: string): number {
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

        default:
          if (MotUtils.xNombrePluriel.exec(determinant.trim()) !== null) {
            retVal = +(determinant.trim());
          } else {
            retVal = 0;
          }
          break;
      }
    }
    return retVal;
  }

}
