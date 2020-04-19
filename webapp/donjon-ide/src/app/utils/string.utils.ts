export class StringUtils {

  /**
   * Garder uniquement les caractères alphanumériques et les tirets. Ajouter ".djn" en fin de nom.
   * Retourne null si pas de nom.
   * @param name sécurisé.
   * @param ext PAS sécurisé !
   */
  static nameToSafeFileName(name: string, ext: string): string {
    var NonAphaNumTiret = /[^a-z0-9\-]/gi;
    let fileName: string = null;
    if (name) {
      const nomNettoye = name.replace(NonAphaNumTiret, "");
      if (nomNettoye !== "") {
        fileName = nomNettoye + ext;
      }
    }
    return fileName;
  }

  static normaliserMot(mot: string) {
    let retVal = "";
    if (mot) {
      retVal = mot
        .toLocaleLowerCase()
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/éèêë/g, 'e')
        .replace(/ï/g, 'i')
        .replace(/àä/g, 'a')
        .replace(/ç/g, 'c');
    }
    return retVal;
  }
}
