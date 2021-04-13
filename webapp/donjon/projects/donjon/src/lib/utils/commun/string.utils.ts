export class StringUtils {

  /**
   * Garder uniquement les caractères alphanumériques et les tirets. Ajouter ".djn" en fin de nom.
   * Retourne null si pas de nom.
   * @param name sécurisé.
   * @param ext PAS sécurisé !
   */
  static nameToSafeFileName(name: string, ext: string): string {
    var NonAphaNumTiret = /[^a-z0-9\-\_]/gi;
    let fileName: string = null;
    if (name) {
      const nomNettoye = name.replace(NonAphaNumTiret, "");
      if (nomNettoye !== "") {
        fileName = nomNettoye + ext;
      }
    }
    return fileName;
  }

  /** 
   * - Retirer déterminant
   * - Retirer caractères spéciaux
   * - mettre le mot en minuscules
   */
  static normaliserMot(mot: string) {
    let retVal = "";
    if (mot) {
      retVal = mot
        // minuscules
        .toLocaleLowerCase()
        // transformer caractères spéciaux
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/(é|è|ê|ë)/g, 'e')
        .replace(/ï/g, 'i')
        .replace(/(à|ä)/g, 'a')
        .replace(/ç/g, 'c')
        // retirer déterminants
        .replace(/^(un |une |des |le |la |l'|l’|les )/, '');
    }
    return retVal;
  }
}
