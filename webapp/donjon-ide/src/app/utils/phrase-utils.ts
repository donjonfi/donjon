import { ElementsPhrase } from '../models/commun/elements-phrase';

export class PhraseUtils {
  static decomposerPhrase(phrase: string) {
    let el: ElementsPhrase = null;
    const regexDSVC = /^(le |la |les |l'|du |de la|des |un |une )(\S+) (\S+)( .+|)$/i;
    const regexVC = /^(\S+) (.+|)$/i;
    let resultDSVC = regexDSVC.exec(phrase);
    if (resultDSVC) {
      el = new ElementsPhrase();
      el.determinant = resultDSVC[1];
      el.sujet = resultDSVC[2];
      el.verbe = resultDSVC[3];
      el.complement = resultDSVC[4];
    } else {
      let resultVC = regexVC.exec(phrase);
      if (resultVC) {
        el = new ElementsPhrase();
        el.determinant = null;
        el.sujet = null;
        el.verbe = resultVC[1];
        el.complement = resultVC[2];
      }
    }
    return el;
  }
}
