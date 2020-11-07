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
   * - => utiliser(1) la(2) clé(3) rouge(4) \[sur(6) la(7) porte(8) verte(9)](5)
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
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide|deboguer)$/i;

  // ^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)?

  /**
   * [si|avant|après] (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela))(1) verbe(5) [pas|plus(6)] complément(7)
   */
  static readonly xCondition = /^(?:si |avant |après |apres )?((?:(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|vaut|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?$/i;

  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) (ne|n’) verbe(5) (ni|soit)(6) complément1(7) (ni|soit)(8) complément2(9) [(ni|soit) complément3(10)]
   */
  static readonly xConditionNiSoit = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|contient)(?: (ni|soit) )(?:(.+?))(?: (\6) )(.+?)(?:(?: \6 )(.+?))?$/i;

  /**
   *  [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) (6)complément1(7) (et|ou)(8) complément2(9) [(et|ou) complément3(10)]
   */
  static readonly xConditionOuEt = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (est|vaut|possède|contient)( )(.+?)(?: (et|ou) )(.+?)(?:(?: \8 )(.+?))?$/i;

  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) [pas]\(6) complément1(7) (ainsi que|ou bien|(mais pas|plus|bien))(8) complément2(9)
   * - Si le joueur ne possède pas le jouet mais bien la trompette
   * - le seau contient la mèche mais pas le briquet
   * - Si ceci est vivant mais pas une personne
   * - le joueur possède la mèche ou le briquet
   * - Si l’inventaire contient le sucre et la farine
   */
  static readonly xConditionMaisPasEtOu = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|contient)(?: (pas))? (?:(.+?)) (et|ou|mais (?:pas|plus|bien)) (.+?)$/i;

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
   * Phrase simple avec un verbe conjugé.
   * [le|la|les|...]\(1) (nom|ceci|cela)\(2) [attribut]\(3) [ne|n’|n'] ([se] verbe conjugé)(4) [pas|plus]\(5) complément(6).
   * - la porte secrète n’est plus fermée
   * - la canne à pèche rouge est ouverte
   * - ceci n’est plus vide
   * - cela se trouve dans le jardin
   * - les chauves-souris ne sont pas fixées
   * - la porte close est ouverte
   */
  static readonly xSuiteInstructionPhraseAvecVerbeConjugue = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |de(?: la)? |du |des |d'|d’)\S+?))(?:(?: )(?!ne|n’|n')(\S+))? (?:ne |n(?:'|’))?(?!vers)((?:se (?:trouve(?:nt)?))|(?:est|sont|vaut|valent|contien(?:nen)?t|possède(?:nt)?))(?: (pas|plus))?(?: (.+))?$/i;

  /**
   * - Manger tomate(2).
   * - Déplacer le(1) trésor(2) vers(4) le(5) joueur(6).
   * - Utiliser l’(1)arc à flèches(2) rouillé(3) avec(4) la(5) flèche(6) rouge(7).
   * - => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).
   */
  static readonly xComplementInstruction1ou2elements = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |de(?: la)? |du |des |d'|d’)\S+?))(?:(?: )(\S+))?(?: (vers|avec|sur|sous) (le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )(\S+))?)?$/i;
  /**
   * Son(1) sac(2) est(3) ouvert(4)
   */
  static readonly xPhraseSimplePronom = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  private static decomposerCondition(condition: string) {

    let els: ElementsPhrase = null;

    let resCond: RegExpExecArray = null;
    let resCondNiSoit: RegExpExecArray = null;
    let resCondEtOu: RegExpExecArray = null;
    let resCondMaisPasEtOu: RegExpExecArray = null;
    let resCondSimple: RegExpExecArray = null;
    let resConditionAucunPour: RegExpExecArray = null;

    // console.log("condition:", condition);


    // A. tester la formulation  [ni ni | soit soit]
    resCondNiSoit = PhraseUtils.xConditionNiSoit.exec(condition);
    resCond = resCondNiSoit;

    // console.log(">> resCondNiSoit:", resCondNiSoit);


    if (!resCondNiSoit) {
      resCondEtOu = PhraseUtils.xConditionOuEt.exec(condition);
      resCond = resCondEtOu;
    }
    // console.log(">> resCondEtOu:", resCondEtOu);

    if (!resCondNiSoit && !resCondEtOu) {
      // B. tester la formulation [mais pas | mais bien | et | ou]
      resCondMaisPasEtOu = PhraseUtils.xConditionMaisPasEtOu.exec(condition);

      // console.log(">> resCondMaisPasEtOu:", resCondMaisPasEtOu);


      resCond = resCondMaisPasEtOu;
      if (!resCondMaisPasEtOu) {
        // C. tester la formulation simple
        resCondSimple = PhraseUtils.xCondition.exec(condition);
        resCond = resCondSimple;
        if (!resCondSimple) {
          // D. tester la formulation [aucun pour]
          resConditionAucunPour = PhraseUtils.xConditionAucunPour.exec(condition);
        }
      }
    }

    // si une des formulations autre que AucunPour
    if (resCond) {
      const sujet = resCond[3] ? (new GroupeNominal(resCond[2], resCond[3], resCond[4] ? resCond[4] : null)) : (resCond[1] ? new GroupeNominal(null, resCond[1], null) : null);
      const verbe = resCond[5];
      const negation = resCond[6]?.trim() ? resCond[6] : null;
      const compl1 = resCond[7];
      // éventuellement un 2e complément
      const compl2 = (resCondMaisPasEtOu || resCondNiSoit || resCondEtOu) ? resCond[9] : null;
      // éventuellement un 3e complément
      const compl3 = (resCondNiSoit || resCondEtOu) ? resCond[10] : null;

      els = new ElementsPhrase(null, sujet, verbe, negation, compl1);
      els.complement2 = compl2;
      els.complement3 = compl3;
      els.conjonction = (resCondMaisPasEtOu || resCondNiSoit || resCondEtOu) ? resCond[8] : null;

      // décomposer les compléments si possible
      // complément1
      if (els.complement1) {
        const resCompl = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement1);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          els.preposition = resCompl[1] ? resCompl[1] : null;
        }
        // complément2
        if (els.complement2) {
          const resCompl2 = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement2);
          if (resCompl2) {
            els.sujetComplement2 = new GroupeNominal(resCompl2[2], resCompl2[3], (resCompl2[4] ? resCompl2[4] : null));
          }
          // complément3
          if (els.complement3) {
            const resCompl3 = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement3);
            if (resCompl3) {
              els.sujetComplement3 = new GroupeNominal(resCompl3[2], resCompl3[3], (resCompl3[4] ? resCompl3[4] : null));
            }
          }
        }
      }
    } else if (resConditionAucunPour) {
      const sujet = resConditionAucunPour[5] ? (new GroupeNominal(resConditionAucunPour[4], resConditionAucunPour[5], resConditionAucunPour[6] ? resConditionAucunPour[6] : null)) : (resConditionAucunPour[3] ? new GroupeNominal(null, resConditionAucunPour[3], null) : null);
      const verbe = "aucun"; // "aucun"
      const compl = resConditionAucunPour[2]; // description, aperçu, ...
      els = new ElementsPhrase(null, sujet, verbe, null, compl);
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
      let retVal = new Condition(false, LienCondition.aucun, els.sujet, els.verbe, els.negation, els.complement1, els.sujetComplement1);

      // s’il s’agit d’une condition composée (ni ni, mais pas, et, ou, …)
      if (els.conjonction) {
        // ajouter la (les) condition(s) supplémentaire(s)
        switch (els.conjonction) {
          case 'et':
          case 'ni':
            retVal.lien = new Condition(false, LienCondition.et, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(false, LienCondition.et, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
            }
            break;
          case 'ou':
            retVal.lien = new Condition(false, LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(false, LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
            }
            break;
          case 'soit':
            retVal.negation = ""; // correction: soit n’est pas une négation
            retVal.lien = new Condition(false, LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(false, LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
            }
            break;
          case 'mais pas':
            retVal.lien = new Condition(false, LienCondition.et, els.sujet, els.verbe, "pas", els.complement2, els.sujetComplement2);
            break;
          case 'mais bien':
            retVal.lien = new Condition(false, LienCondition.et, els.sujet, els.verbe, null, els.complement2, els.sujetComplement2);
            break;

          default:
            console.error("getCondition >> conjonction non supportée:", els.conjonction, els);
            break;
        }
      }
      return retVal;

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
    let els = PhraseUtils.decomposerCommande(evenement.trim());

    // si on a trouvé une formulation correcte
    if (els) {
      return new Evenement(els.infinitif, (els.sujet ? els.sujet.nom : null), null,
        els.preposition, (els.sujetComplement1 ? els.sujetComplement1.nom : null));
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
        els.sujetComplement1 = sujetDialogue;
        // commande NORMALE (infinitif)
      } else {
        res = PhraseUtils.xCommandeInfinitif.exec(commande);
        if (res) {
          const sujet = res[3] ? new GroupeNominal(res[2], res[3], res[4] ? res[4] : null) : null;
          els = new ElementsPhrase(res[1], sujet, null, null, (res[5] ? res[5] : null));
          els.preposition = res[6] ? res[6] : null;
          els.sujetComplement1 = res[8] ? new GroupeNominal(res[7], res[8], res[9] ? res[9] : null) : null;
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
      if (els.complement1) {
        els.complement1 = els.complement1.trim();
        // Ne PAS essayer de décomposer le complément s’il commence par « " » ou s’il s’agit de l’instruction exécuter.)
        if (!els.complement1.startsWith('"') && els.infinitif !== 'exécuter') {
          // tester si le complément est une phrase simple
          // ex: le joueur ne se trouve plus dans la piscine.
          const resSuite = PhraseUtils.xSuiteInstructionPhraseAvecVerbeConjugue.exec(els.complement1);
          if (resSuite) {
            let sujDet = (resSuite[1] ? resSuite[1] : null);
            let sujNom = resSuite[2];
            let sujAtt = (resSuite[3] ? resSuite[3] : null);
            els.sujet = new GroupeNominal(sujDet, sujNom, sujAtt);
            els.verbe = resSuite[4]?.trim();
            els.negation = resSuite[5]?.trim();
            els.complement1 = resSuite[6]?.trim();
            // décomposer le nouveau complément si possible
            const resCompl = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement1);
            if (resCompl) {
              els.complement1 = null;
              els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
              els.preposition = resCompl[1] ? resCompl[1] : null;
            }
            // tester si le complément est une instruction à 1 ou 2 compléments
            // ex: déplacer le trésor vers le joueur.
          } else {
            const res1ou2elements = PhraseUtils.xComplementInstruction1ou2elements.exec(els.complement1);
            if (res1ou2elements) {
              els.verbe = null;
              els.negation = null;
              els.sujet = new GroupeNominal(res1ou2elements[1], res1ou2elements[2], res1ou2elements[3]);
              els.complement1 = null;
              els.preposition = res1ou2elements[4];
              els.sujetComplement1 = new GroupeNominal(res1ou2elements[5], res1ou2elements[6], res1ou2elements[7]);
            }
          }
        }
      }
    }



    return els;
  }

}
