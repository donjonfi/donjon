import { ElementsPhrase } from '../models/commun/elements-phrase';

export class PhraseUtils {
  static decomposerPhrase(phrase: string) {
    let el: ElementsPhrase = null;
    const regexIDSVC = /^(\S+(?:ir|er|re) )?(le |la |les |l'|du |de la|des |un |une )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
    const regexPSVC = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
    const regexVC = /^(\S+(?:ir|er|re)) (.+|)$/i;
    // Déterminant, Sujet, Verbe, Complément
    const resultDSVC = regexIDSVC.exec(phrase);
    if (resultDSVC) {
      el = new ElementsPhrase(null, resultDSVC[2], resultDSVC[3], resultDSVC[4], resultDSVC[5]);
      el.infinitif = resultDSVC[1];
      // Pronom, Sujet, Verbe, Complément
    } else {
      const resultPSVC = regexPSVC.exec(phrase);
      if (resultPSVC) {
        el = new ElementsPhrase(resultPSVC[1], null, resultPSVC[2], resultPSVC[3], resultPSVC[4]);
      } else {
        // infinitif, complément
        const resultIC = regexVC.exec(phrase);
        if (resultIC) {
          el = new ElementsPhrase(null, null, null, null, resultIC[2]);
          el.infinitif = resultIC[1];
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
    if (el.verbe) {
      el.verbe = el.verbe.toLowerCase().trim();
    }
    if (el.infinitif) {
      el.infinitif = el.infinitif.toLowerCase().trim();
    }
    if (el.complement) {
      // ne PAS changer la casse, c’est peut-être un texte à conserver tel quel !
      el.complement = el.complement.trim();
    }

    console.log("decomposerPhrase >>>", phrase);
    console.log("decomposerPhrase >>>>", el);
    

    return el;
  }
}
