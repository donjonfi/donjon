import { ElementsPhrase } from '../models/commun/elements-phrase';
import { GroupeNominal } from '../models/commun/groupe-nominal';

export class PhraseUtils {

  /** 
   * Généralement, une commande est composée d’un verbe à l’infinitf
   * parfois suivit puis d’un groupe nominal:
   * - aller au nord
   * - aller nord
   * - prendre la chemise rouge
   * - prendre sac
   * - effacer
   * - utiliser la clé rouge avec la porte
   * - utiliser la clé rouge avec la porte verte
   *
   * => utiliser(1) la(2) clé(3) rouge(4) sur(5) la(6) porte(7) verte(8)
   */
  static readonly xCommandeInfinitif = /^(\S+(?:ir|er|re))(?: (le |la |les |l'|du |de la|des |un |une |au |à l'|à l’|à la |à )?(\S+)(?: (\S+)|)(?: (avec|sur) (le |la |les |l'|du |de la|des |un |une |au |à l'|à l’)?(\S+)(?: (\S+)|))?)?$/i;
  /**
   * il y a aussi des commandes spéciales:
   * - position
   * - sorties
   * - inventaire
   * - aide
   */
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide)$/i;

  /**
   * si|avant|après (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) pas(6) complément(7)
   */
  static readonly regexCondition = /^(?:si |avant |après |)((le |la |les |l'|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n'|n’|ne)?((?:se \S+)|est|possède|commence)(?: (pas))?)(?: (.+))?$/i;

  /**
   * Instruction : verbe + complément
   * - Dire '.......'
   * - Remplacer ....... par .....
   * - Changer ..........
   */
  static readonly xInstruction = /^(\S+(?:ir|er|re)) (.+|)$/i;

  /**
   * Le(1) joueur(2) se trouve(3) dans la piscine(4).
   */
  static readonly xPhraseSimpleDeterminant = /^(le |la |les |l'|du |de la|des |un |une )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  /**
   * Son(1) sac(2) est(3) ouvert(4)
   */
  static readonly xPhraseSimplePronom = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  static decomposerCondition(condition: string) {
    let els: ElementsPhrase = null;
    const res = PhraseUtils.regexCondition.exec(condition);
    if (res) {
      const sujet = res[3] ? (new GroupeNominal(res[2], res[3], res[4] ? res[4] : null)) : (res[1] ? new GroupeNominal(null, res[1], null) : null);
      const verbe = res[5];
      const negation = res[6];
      const compl = res[7];
      els = new ElementsPhrase(sujet, verbe, negation, compl);

      // décomposer le complément si possible
      const resCompl = GroupeNominal.xDeterminantArticheNomEpithete.exec(els.complement);
      if (resCompl) {
        els.sujetComplement = new GroupeNominal(resCompl[1], resCompl[2], resCompl[3]);
      }

    }
    return els;
  }

  static decomposerCommande(commande: string) {
    // 
    let els: ElementsPhrase = null;
    let res = PhraseUtils.xCommandeSpeciale.exec(commande);
    if (res) {
      els = new ElementsPhrase(null, null, null, null);
      els.infinitif = res[1]; // Ce n'est pas un infinitif mais bon...
    } else {
      res = PhraseUtils.xCommandeInfinitif.exec(commande);
      if (res) {
        const sujet = res[3] ? new GroupeNominal(res[2], res[3], res[4] ? res[4] : null) : null;
        els = new ElementsPhrase(sujet, null, null, null);
        els.infinitif = res[1];
        els.preposition = res[5] ? res[5] : null;
        els.sujetComplement = res[7] ? new GroupeNominal(res[6], res[7], res[8] ? res[8] : null) : null;
      }
    }
    return els;
  }

  static decomposerInstruction(instruction: string) {


    let els: ElementsPhrase = null;

    // infinitif, complément
    let res = PhraseUtils.xInstruction.exec(instruction);
    if (res) {
      els = new ElementsPhrase(null, null, null, res[2]);
      els.infinitif = res[1];

      // décomposer ce qui suit l'infinitif si possible
      let resSuite = PhraseUtils.xPhraseSimpleDeterminant.exec(els.complement);
      if (resSuite) {
        els.sujet = new GroupeNominal(resSuite[1], resSuite[2], null);
        els.verbe = resSuite[3];
        els.complement = resSuite[4] ? resSuite[4].trim() : null;
        // décomposer le nouveau complément si possible
        let resCompl = GroupeNominal.xDeterminantArticheNomEpithete.exec(els.complement);
        if (resCompl) {
          els.sujetComplement = new GroupeNominal(resCompl[1], resCompl[2], resCompl[3]);
        }
      }
    }

    console.log("decomposerInstruction >>>", instruction, "els:", els);

    return els;
  }


  // static ancienDecomposerPhrase(phrase: string) {
  //   let el: ElementsPhrase = null;
  //   const regexIDSVC = /^(?:(?:(\S+(?:ir|er|re))|si) )?(le |la |les |l'|du |de la|des |un |une )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
  //   const regexPSVC = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;
  //   const regexIC = /^(\S+(?:ir|er|re)) (.+|)$/i;
  //   // Déterminant, Sujet, Verbe, Complément
  //   const resultDSVC = regexIDSVC.exec(phrase);
  //   if (resultDSVC) {
  //     el = new ElementsPhrase(null, resultDSVC[2], resultDSVC[3], resultDSVC[4], resultDSVC[5]);
  //     el.infinitif = resultDSVC[1];
  //     // Pronom, Sujet, Verbe, Complément
  //   } else {
  //     const resultPSVC = regexPSVC.exec(phrase);
  //     if (resultPSVC) {
  //       el = new ElementsPhrase(resultPSVC[1], null, resultPSVC[2], resultPSVC[3], resultPSVC[4]);
  //     } else {
  //       // infinitif, complément
  //       const resultIC = regexIC.exec(phrase);
  //       if (resultIC) {
  //         el = new ElementsPhrase(null, null, resultIC[2]);
  //         el.infinitif = resultIC[1];
  //       }
  //     }
  //   }

  //   if (el) {
  //     // nettoyer les valeurs
  //     if (el.determinant) {
  //       el.determinant = el.determinant.toLowerCase();
  //     }
  //     if (el.pronom) {
  //       el.pronom = el.pronom.toLowerCase();
  //     }
  //     if (el.sujet) {
  //       el.sujet = el.sujet.toLowerCase().trim();
  //     }
  //     if (el.verbe) {
  //       el.verbe = el.verbe.toLowerCase().trim();
  //     }
  //     if (el.infinitif) {
  //       el.infinitif = el.infinitif.toLowerCase().trim();
  //     }
  //     if (el.complement) {
  //       // ne PAS changer la casse, c’est peut-être un texte à conserver tel quel !
  //       el.complement = el.complement.trim();
  //     }
  //   }

  //   console.log("decomposerPhrase >>> phrase:", phrase, "el:", el);

  //   return el;
  // }
}
