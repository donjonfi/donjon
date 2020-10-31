import { Condition, LienCondition } from '../../models/compilateur/condition';

import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { GroupeNominal } from '../../models/commun/groupe-nominal';

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
   * Interpréter la commande parler/demander (sens: sujet puis personne)
   * - parler de la fourchette rouge au nain jaune.
   * - discuter de la fourchette avec le nain.
   * - demander la fourchette au nain.
   * - demander fourchettte au nain.
   * - => parler(1) de la(2) clé(3) rouge(4) avec le(5) chevalier(6) blanc(7)
   */
  static readonly xCommandeParlerSujetPers = /^(demander|questionner|interroger|parler|discuter)(?: ((?:(?:(?:à propos )?de |concernant )?(?:l'|l’|la |le ))|de |du |un |une )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?) (au |à (?:la |l'|l’)?|avec (?:la |le |l'|l’))(\S+|(?:(?!propos)\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?$/i;

  /**
   * Interpréter la commande parler/demander (sens: personne puis sujet)
   * - parler au nain jaune
   * - parler au nain jaune de la fourchette rouge.
   * - parler au nain jaune de fourchette rouge.
   * - discuter avec nain jaune de la fourchette rouge.
   * - demander au nain jaune la fourchette rouge.
   * - interroger le nain jaune sur la fourchette rouge.
   * - questionner le nain jaune à propos de la fourchette rouge.
   * - => demander(1) au(2) chevalier(3) blanc(4) la(5) clé(6) rouge(7)
   */
  static readonly xCommandeParlerPersSujet = /^(demander|questionner|interroger|parler|discuter) (au |à (?:la |l'|l’)?|(?:avec )?(?:la |le |l'|l’))(\S+|(?:\S+ (?:à (?!propos)|en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’|du|de|des|au|à|concernant|sur|un|une|la|le|les)\S+))?(?: ((?:(?:sur |concernant |de )?(?:l'|l’|la |le ))|à propos (?:de (?:l'|l’|la )|du )|du |de |un |une )?((?!au)\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?$/i;

  /** 
   * il y a aussi des commandes spéciales:
   * - position
   * - sorties
   * - inventaire
   * - aide
   */
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide)$/i;

  /**
   * [si|avant|après] (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela))(1) verbe(5) [pas|plus(6)] complément(7)
   */
  static readonly xCondition = /^(?:si |avant |après |apres )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?$/i;

  static readonly xConditionNiNi = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )(est|possède|contient)(?: (ni|soit) )(?:(.+?))(?: ni | soit )(.+?)(?:(?: ni | soit )(.+?))?$/i;
  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) [pas](6) complément1(7) (ainsi que|ou bien|(mais pas|plus|bien))(8) complément2(9)
   * - Si le joueur ne possède pas le jouet mais bien la trompette
   * - le seau contient la mèche mais pas le briquet
   * - Si ceci est vivant mais pas une personne
   * - le joueur possède la mèche ou le briquet
   * - Si l’inventaire contient le sucre et la farine
   */
  static readonly xConditionMaisPasEtOu = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|possède|contient)(?: (pas))? (?:(.+?)) (et|ou|mais (?:pas|plus|bien)) (.+?)$/i;

  // /**
  //  * si (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) pas(6) complément(7) (:|,) conséquences(8)
  //  */
  // static readonly xSiConditionConsequences = /^(?:si )((le |la |les |l'|l’|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?(?: )?(?:,|:)(.+)$/i;

  /** 
   * si aucun(1) complément(2) pour (le|la|les|...(4) xxx(5) yyy(6))|(ceci|cela)(3)
   */
  static readonly xConditionAucunPour = /^(?:si )?(aucun(?:e)?) (\S+) pour ((le |la |les |l'|l’|du |de la|des |un |une )(\S+)(?:(?: )(\S+))?|ceci|cela)$/i;


  /**
   * si (condition)(1) :|, (consequences)(2)
   */
  static readonly xSeparerSiConditionConsequences = /^si (.+?)(?: )?(?::|,)(?: )?(.+)$/i;

  /**
   * sinon(1) :|, (consequences)(2)
   */
  static readonly xSeparerSinonConsequences = /^(sinon)(?: )?(?::|,)?(?: )?(.+)$/i;

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
  static readonly xPhraseSimpleDeterminant = /^(le |la |les |l(?:'|’)|du |de la|des |un |une )(\S+) (?:ne |n(?:'|’))?((?:se \S+)|\S+)( pas| plus)?( .+)?$/i;

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
      //   // condition  « sauvé "xxxxxxx x xxxx" ».
      // } else if (condition.startsWith('sauvé "')) {
      //   const sujet = null;
      //   const verbe = "sauvé";
      //   const compl = condition.replace('sauvé ', '');
      //   els = new ElementsPhrase(null, null, verbe, null, compl);
    } else {
      const resConditionAucunPour = PhraseUtils.xConditionAucunPour.exec(condition);
      if (resConditionAucunPour) {
        const sujet = resConditionAucunPour[5] ? (new GroupeNominal(resConditionAucunPour[4], resConditionAucunPour[5], resConditionAucunPour[6] ? resConditionAucunPour[6] : null)) : (resConditionAucunPour[3] ? new GroupeNominal(null, resConditionAucunPour[3], null) : null);
        const verbe = "aucun"; // "aucun"
        const compl = resConditionAucunPour[2]; // description, examen, ...
        els = new ElementsPhrase(null, sujet, verbe, null, compl);
      }
    }

    return els;
  }

  public static getCondition(condition: string) {

    // // tester s’il s’agit d’un sinon
    // if (condition.trim() === 'sinon') {
    //   return new Condition(true , LienCondition.aucun, null, null, null, null, null);
    // } else {
    // TODO: regarder les ET et les OU
    // TODO: regarder les ()
    // TODO: priorité des oppérateurs
    const els = PhraseUtils.decomposerCondition(condition);
    if (els) {
      return new Condition(false, LienCondition.aucun, els.sujet, els.verbe, els.negation, els.complement, els.sujetComplement);
    } else {
      console.warn("decomposerCondition: pas pu décomposer:", condition);
      return null;
    }
    // }
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
    // commande SPÉCIALE (pas un infinitif)
    if (res) {
      // Ce n'est pas un infinitif mais bon...
      els = new ElementsPhrase(res[1], null, null, null, null);
      // commande DIALOGUE
    } else {
      // le phrase peut-être tournée de 2 manière différentes, on veut pouvoir
      // détecter les 2.
      res = PhraseUtils.xCommandeParlerPersSujet.exec(commande);
      let sensPersSujet = true;
      if (!res) {
        sensPersSujet = false;
        res = PhraseUtils.xCommandeParlerSujetPers.exec(commande);
      }
      // c'est un dialogue (parler, demander, …)
      if (res) {
        let personne: GroupeNominal = null;
        let sujetDialogue: GroupeNominal = null;
        let preposition: string;
        if (sensPersSujet) {
          // déterminant difficile à déterminer donc on met rien
          personne = new GroupeNominal(null, res[3], res[4]);
          if (res[6]) {
            sujetDialogue = new GroupeNominal(null, res[6], res[7]);
          }
          preposition = "";
        } else {
          personne = new GroupeNominal(null, res[6], res[7]);
          sujetDialogue = new GroupeNominal(null, res[3], res[4]);
          preposition = "";
        }
        els = new ElementsPhrase(res[1], personne, null, null, (sujetDialogue ? sujetDialogue.nom : null));
        els.preposition = preposition;
        els.sujetComplement = sujetDialogue;
        // commande NORMALE (infinitif)
      } else {
        res = PhraseUtils.xCommandeInfinitif.exec(commande);
        if (res) {
          const sujet = res[3] ? new GroupeNominal(res[2], res[3], res[4] ? res[4] : null) : null;
          els = new ElementsPhrase(res[1], sujet, null, null, (res[5] ? res[5] : null));
          els.preposition = res[6] ? res[6] : null;
          els.sujetComplement = res[8] ? new GroupeNominal(res[7], res[8], res[9] ? res[9] : null) : null;
        }
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

      // s’il y a un complément qui suit l’infinitif, essayer de le décomposer
      if (els.complement) {
        els.complement = els.complement.trim();
        // Ne PAS essayer de décomposer le complément s’il commence par « " » ou s’il s’agit de l’instruction exécuter.)
        if (!els.complement.startsWith('"') && els.infinitif !== 'exécuter') {
          // tester si le complément est une phrase simple
          // ex: le joueur ne se trouve plus dans la piscine.
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
            // tester si le complément est une instruction à 1 ou 2 compléments
            // ex: déplacer le trésor vers le joueur.
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
      }
    }



    return els;
  }

}
