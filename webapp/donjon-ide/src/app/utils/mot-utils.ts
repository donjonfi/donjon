export class MotUtils {


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

  static getMasculin(nom: string) {

  }

  static getFeminin(nom: string) {

  }

}