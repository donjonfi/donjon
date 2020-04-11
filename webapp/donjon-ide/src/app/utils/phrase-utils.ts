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
      el = new ElementsPhrase();
      el.determinant = resultDSVC[1];
      el.pronom = null;
      el.sujet = resultDSVC[2];
      el.verbe = resultDSVC[3];
      el.complement = resultDSVC[4];
      // Pronom, Sujet, Verbe, Complément
    } else {
      const resultPSVC = regexPSVC.exec(phrase);
      if (resultPSVC) {
        el = new ElementsPhrase();
        el.determinant = null;
        el.pronom = resultPSVC[1];
        el.sujet = resultPSVC[2];
        el.verbe = resultPSVC[3];
        el.complement = resultPSVC[4];
      } else {
        // Verbe complément
        const resultVC = regexVC.exec(phrase);
        if (resultVC) {
          el = new ElementsPhrase();
          el.determinant = null;
          el.pronom = null;
          el.sujet = null;
          el.verbe = resultVC[1];
          el.complement = resultVC[2];
        }
      }
    }
    return el;
  }
}
