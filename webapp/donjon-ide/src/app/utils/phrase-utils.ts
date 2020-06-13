import { Condition, LienCondition } from '../models/compilateur/condition';

import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
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
   * - donner la pièce au pirate
   * - jeter l’épée
   * => utiliser(1) la(2) clé(3) rouge(4) \[sur(6) la(7) porte(8) verte(9)](5)
   */
  static readonly xCommandeInfinitif = /^(\S+(?:ir|er|re))(?: (le |la |les |l'|l’|du |de la|des |un |une |au |à l'|à l’|à la |à )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?( (avec|sur|au|à|au) (le |la |les |l'|l’|du |de la|des |un |une )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?)?$/i;
  /**
   * il y a aussi des commandes spéciales:
   * - position
   * - sorties
   * - inventaire
   * - aide
   */
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide)$/i;

  /**
   * [si|avant|après] (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) [pas|plus(6)] complément(7)
   */
  static readonly xCondition = /^(?:si |avant |après |apres )?((le |la |les |l'|l’|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n'|n’|ne )?((?:se \S+)|est|possède|commence)(?: (pas|plus))?)(?: (.+))?$/i;
  /**
   * si (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) pas(6) complément(7) (:|,) conséquences(8)
   */
  static readonly xSiConditionConsequences = /^(?:si )((le |la |les |l'|l’|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|possède|commence)(?: (pas|plus))?)(?: (.+))?(?: )?(?:,|:)(.+)$/i;

  /**
   * si (condition)(1) :|, (consequences)(2)
   */
  static readonly xSeparerSiConditionConsequences = /^si (.+?)(?: )?(?::|,)(?: )?(.+)$/i;

  /**
   * Instruction : verbe + complément
   * - Dire '.......'
   * - Remplacer ....... par .....
   * - Changer ..........
   */
  static readonly xInstruction = /^(\S+(?:ir|er|re)) (.+|)$/i;



  /**
   * Le(1) joueur(2) [ne] se trouve(3) [pas|plus]\(4) dans la piscine(5).
   */
  static readonly xPhraseSimpleDeterminant = /^(le |la |les |l'|du |de la|des |un |une )(\S+) (?:ne |n(?:'|’))?((?:se \S+)|\S+)( pas| plus)?( .+)?$/i;

  /**
   * - Manger tomate(2).
   * - Déplacer le(1) trésor(2) vers(4) le(5) joueur(6).
   * - Utiliser l’(1)arc à flèches(2) rouillé(3) avec(4) la(5) flèche(6) rouge(7).
   * - => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).
   */
  static readonly xComplementInstruction1ou2elements = /^(le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à|en|de(?: la)?|du|des) \S+))(?:(?: )(\S+))?(?: (vers|avec|sur|sous) (le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à|en|de(?: la)?|du|des) \S+))(?:(?: )(\S+))?)?$/i;

  /**
   * Son(1) sac(2) est(3) ouvert(4)
   */
  static readonly xPhraseSimplePronom = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  private static decomposerCondition(condition: string) {
    let els: ElementsPhrase = null;
    const resCondition = PhraseUtils.xCondition.exec(condition);
    if (resCondition) {
      const sujet = resCondition[3] ? (new GroupeNominal(resCondition[2], resCondition[3], resCondition[4] ? resCondition[4] : null)) : (resCondition[1] ? new GroupeNominal(null, resCondition[1], null) : null);
      const verbe = resCondition[5];
      const negation = resCondition[6];
      const compl = resCondition[7];
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);

      // décomposer le complément si possible
      const resCompl = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement);
      if (resCompl) {
        els.sujetComplement = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
        els.preposition = resCompl[1] ? resCompl[1] : null;
      }

    }
    return els;
  }

  public static getCondition(condition: string) {

    // TODO: regarder les ET et les OU
    // TODO: regarder les ()
    // TODO: priorité des oppérateurs
    const els = PhraseUtils.decomposerCondition(condition);
    if (els) {
      return new Condition(LienCondition.aucun, els.sujet, els.verbe, els.negation, els.complement, els.sujetComplement);
    } else {
      console.warn("decomposerCondition: pas pu décomposer:", condition);
      return null;
    }
  }

  public static getCommande(commande: string) {
    const els = PhraseUtils.decomposerCommande(commande);
    if (els) {
      return els;
    } else {
      console.warn("getCommande >> decomposerCommande: pas pu décomposer:", commande);
      return null;
    }
  }

  public static getEvenement(evenement: string) {
    // soit c’est une commande
    let els = PhraseUtils.decomposerCommande(evenement);

    // si on a trouvé une formulation correcte
    if (els) {
      return new Evenement(els.infinitif, (els.sujet ? els.sujet.nom : null), null,
        els.preposition, (els.sujetComplement ? els.sujetComplement.nom : null));
    } else {
      console.warn("getEvenement >> decomposerCommande: pas pu décomposer:", evenement);
      return null;
    }
  }

  static decomposerCommande(commande: string) {
    let els: ElementsPhrase = null;
    let res = PhraseUtils.xCommandeSpeciale.exec(commande);
    if (res) {
      // Ce n'est pas un infinitif mais bon...
      els = new ElementsPhrase(res[1], null, null, null, null);
    } else {
      res = PhraseUtils.xCommandeInfinitif.exec(commande);
      if (res) {
        const sujet = res[3] ? new GroupeNominal(res[2], res[3], res[4] ? res[4] : null) : null;
        els = new ElementsPhrase(res[1], sujet, null, null, (res[5] ? res[5] : null));
        els.preposition = res[6] ? res[6] : null;
        els.sujetComplement = res[8] ? new GroupeNominal(res[7], res[8], res[9] ? res[9] : null) : null;
      }
    }
    return els;
  }

  static decomposerInstruction(instruction: string) {


    let els: ElementsPhrase = null;

    // infinitif, complément
    const resInfinitifCompl = PhraseUtils.xInstruction.exec(instruction);
    if (resInfinitifCompl) {
      els = new ElementsPhrase(resInfinitifCompl[1], null, null, null, resInfinitifCompl[2]);
      // décomposer ce qui suit l'infinitif si possible
      const resSuite = PhraseUtils.xPhraseSimpleDeterminant.exec(els.complement);
      if (resSuite) {
        els.sujet = new GroupeNominal(resSuite[1], resSuite[2], null);
        els.verbe = resSuite[3];
        els.negation = resSuite[4];
        els.complement = resSuite[5] ? resSuite[5].trim() : null;
        // décomposer le nouveau complément si possible
        const resCompl = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement);
        if (resCompl) {
          els.complement = null;
          els.sujetComplement = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          els.preposition = resCompl[1] ? resCompl[1] : null;
        }
      } else {
        const res1ou2elements = PhraseUtils.xComplementInstruction1ou2elements.exec(els.complement);
        if (res1ou2elements) {
          els.verbe = null;
          els.negation = null;
          els.sujet = new GroupeNominal(res1ou2elements[1], res1ou2elements[2], res1ou2elements[3]);
          els.complement = null;
          els.preposition = res1ou2elements[4];
          els.sujetComplement = new GroupeNominal(res1ou2elements[5], res1ou2elements[6], res1ou2elements[7]);
        }
      }
    }
    return els;
  }

}
