export class StringUtils {

  /**
   * Garder uniquement les caractères alphanumériques et les tirets dans le nom et l’extension.
   * Concaténer le nom et l’extension autours d’un point.
   * Seuls les 26 lettres de l’alphabet, les chiffres et les tirets sont supportés.
   * @returns le nom sécurisé (ou undefined si pas de nom ou d’extension).
   */
  static nomDeFichierSecuriseExtensionForcee(nom: string, extension: string): string {
    var NonAphaNumTiret = /[^a-z0-9\-\_]/gi;
    let nomFichier: string = undefined;
    if (nom && extension) {
      const nomNettoye = nom.replace(NonAphaNumTiret, "");
      const extensionNettoyee = extension.replace(NonAphaNumTiret, "");
      if (nomNettoye != "" && extensionNettoyee != "") {
        nomFichier = nomNettoye + "." + extensionNettoyee;
      }
    }
    return nomFichier;
  }

  /**
   * Garder uniquement les caractères alphanumériques et les tirets dans le nom.
   * Le nom peut contenir 0 ou 1 point.
   * Le point ne peut pas être le dernier caractère du nom.
   * Seuls les 26 lettres de l’alphabet, les chiffres et les tirets sont supportés.
   * @returns le nom sécurisé (ou undefined si pas de nom).
   */
  static nomDeFichierSecurise(nom: string): string {
    var NonAphaNumTiret = /[^a-z0-9\-\_]/gi;
    let nomFichier: string = undefined;

    let parties = nom.split('.');

    // pas de point => pas d’extension
    if (parties.length == 1) {
      const nomNettoye = nom.replace(NonAphaNumTiret, "");
      if (nomNettoye != "") {
        nomFichier = nomNettoye;
      }
    } else if (parties.length == 2) {
      const nomNettoye = parties[0].replace(NonAphaNumTiret, "");
      const extensionNettoyee = parties[1].replace(NonAphaNumTiret, "");
      if (nomNettoye != "" && extensionNettoyee != "") {
        nomFichier = nomNettoye + "." + extensionNettoyee;
      }
    }
    return nomFichier;
  }

  /**
 * Garder uniquement les caractères alphanumériques et les tirets dans le nom.
 * Le nom peut contenir aucun point.
 * Seuls les 26 lettres de l’alphabet, les chiffres et les tirets sont supportés.
 * @returns le nom sécurisé (ou undefined si pas de nom).
 */
  static nomDeDossierSecurise(nom: string): string {
    var NonAphaNumTiret = /[^a-z0-9\-\_]/gi;
    let nomDossier: string = undefined;

    const nomNettoye = nom.replace(NonAphaNumTiret, "");
    if (nomNettoye != "") {
      nomDossier = nomNettoye;
    }
    return nomDossier;
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
        // retirer déterminant qui débute la chaîne
        .replace(/^(un |une |des |le |la |l'|l’|les )/, '');
    }
    return retVal;
  }

  /** 
   * - Retirer caractères spéciaux
   * - mettre le mot en minuscules
   * - enlever espace avant/après
   */
  static normaliserReponse(reponse: string) {
    let retVal = "";
    if (reponse) {
      retVal = reponse
        // minuscules
        .toLocaleLowerCase()
        // transformer caractères spéciaux
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/(é|è|ê|ë)/g, 'e')
        .replace(/ï/g, 'i')
        .replace(/(à|ä)/g, 'a')
        .replace(/ç/g, 'c')
        // enlever les espaces en début et fin
        .trim()
        // enlever les guillemets en début et fin
        .replace(/(^\s*")|(\s*"$)/g, '')
    }
    return retVal;
  }
}
