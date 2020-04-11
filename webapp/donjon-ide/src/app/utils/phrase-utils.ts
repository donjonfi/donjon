import { ElementsPhrase } from '../models/commun/elements-phrase';

export class PhraseUtils {
  static decomposerPhrase(phrase: string) {
    let el: ElementsPhrase = null;
    const regexDSVC = /^(le |la |les |l'|du |de la|des |un |une )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
    const regexPSVC = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
    const regexVC = /^(\S+) (.+|)$/i;
    // Déterminant, Sujet, Verbe, Complément
    const resultDSVC = regexDSVC.exec(phrase);
    if (resultDSVC) {
      el = new ElementsPhrase(null, resultDSVC[1], resultDSVC[2], resultDSVC[3], resultDSVC[4]);
      // Pronom, Sujet, Verbe, Complément
    } else {
      const resultPSVC = regexPSVC.exec(phrase);
      if (resultPSVC) {
        el = new ElementsPhrase(resultPSVC[1], null, resultPSVC[2], resultPSVC[3], resultPSVC[4]);
      } else {
        // Verbe complément
        const resultVC = regexVC.exec(phrase);
        if (resultVC) {
          el = new ElementsPhrase(null, null, null, resultVC[1], resultVC[2]);
        }
      }
    }
    // nettoyer les valeurs
    if (el.determinant) {
      el.determinant = el.determinant.toLowerCase();
    }
    if (el.pronom) {
      el.pronom = el.pronom.toLowerCase();
    }
    if (el.sujet) {
      el.sujet = el.sujet.toLowerCase().trim();
    }
    el.verbe = el.verbe.toLowerCase().trim();
    if (el.complement) {
      // ne PAS changer la casse, c’est peut-être un texte à conserver tel quel !
      el.complement = el.complement.trim();
    }
    return el;
  }
}
