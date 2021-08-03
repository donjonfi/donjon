import { Condition } from "../../../models/compilateur/condition";
import { ConditionDecomposee } from "../../../models/compilateur/condition-decomposee";
import { ConditionMulti } from "../../../models/compilateur/condition-multi";
import { ConditionSolo } from "../../../models/compilateur/condition-solo";
import { ElementsPhrase } from "../../../models/commun/elements-phrase";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { LienCondition } from "../../../models/compilateur/lien-condition";

export class AnalyseurCondition {

  /**
   * Vérifier si les couples de parenthèses de la conditions sont valides.
   */
  public static parenthesesValides(condition: string): boolean {
    let total = 0;
    if (condition) {
      for (let index = 0; index < condition.length; index++) {
        const char = condition[index];
        if (char == '(') {
          total += 1;
        } else if (char == ')') {
          total -= 1;
        }
        if (total < 0) {
          break;
        }
      }
    }
    return (total == 0);
  }

  /**
   * Retrouver la condition correspondant à la phrase.
   * @param condition 
   * @returns 
   */
  public static getCondition(condition: string) {

    // TODO: regarder les ET et les OU
    // TODO: regarder les ()
    // TODO: priorité des opérateurs
    const els = AnalyseurCondition.decomposerCondition(condition);
    if (els) {
      let retVal = new Condition(LienCondition.aucun, els.sujet, els.verbe, els.negation, els.complement1, els.sujetComplement1);

      // s’il s’agit d’une condition composée (ni ni, mais pas, et, ou, …)
      if (els.conjonction) {
        // ajouter la (les) condition(s) supplémentaire(s)
        switch (els.conjonction) {
          case 'et':
          case 'ni':
            retVal.lien = new Condition(LienCondition.et, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(LienCondition.et, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(LienCondition.et, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
            }
            break;
          case 'ou':
            retVal.lien = new Condition(LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
            }
            break;
          case 'soit':
            retVal.negation = ""; // correction: soit n’est pas une négation
            retVal.lien = new Condition(LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
            }
            break;
          case 'mais pas':
            retVal.lien = new Condition(LienCondition.et, els.sujet, els.verbe, "pas", els.complement2, els.sujetComplement2);
            break;
          case 'mais bien':
            retVal.lien = new Condition(LienCondition.et, els.sujet, els.verbe, null, els.complement2, els.sujetComplement2);
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
  }

  /**
   * Créer une condition multi à partir d'une condition décomposéee.
   * @param conditionDecomposee 
   */
  public static obtenirConditionMulti(conditionDecomposee: ConditionDecomposee): ConditionMulti {

    let retVal = new ConditionMulti();

    retVal.lienFrereAine = conditionDecomposee.lien;

    // s'il y a des sous-conditions
    if (conditionDecomposee.sousConditions) {
      retVal.condition = null;
      retVal.sousConditions = [];
      retVal.typeLienSousConditions = conditionDecomposee.typeLienSousConditions;
      conditionDecomposee.sousConditions.forEach(sousCondDec => {
        retVal.sousConditions.push(this.obtenirConditionMulti(sousCondDec));
      });
      // s'il s'agit d'une simple condition
    } else {
      retVal.sousConditions = null;
      if (conditionDecomposee.estDebutCondition) {
        retVal.condition = AnalyseurCondition.obetenirConditionSoloDebut(conditionDecomposee.conditionBrute);
      } else {
        retVal.condition = AnalyseurCondition.obetenirConditionSoloSuite(conditionDecomposee.conditionBrute);
      }
    }

    return retVal;
  }

  /**
   * Obtenir la première partie d’une condition.
   * C’est à dire avec le sujet, le verbe et le complément.
   * @param conditionBrute
   * @returns 
   */
  public static obetenirConditionSoloDebut(conditionBrute: string): ConditionSolo {
    let retVal: ConditionSolo = null;

    let resCond: RegExpExecArray = null;

    let resCondNiSoit: RegExpExecArray = null;
    let resConditionAucunPourVers: RegExpExecArray = null;
    let resConditionLaSortieVers: RegExpExecArray = null;
    let resCondSimple: RegExpExecArray = null;

    // A. tester la formulation  [ni ni | soit soit]
    resCondNiSoit = ExprReg.xDebutConditionNiSoit.exec(conditionBrute);
    resCond = resCondNiSoit;
    if (!resCondNiSoit) {

      // C. tester la formulation [la porte|sortie vers xxx est]
      resConditionLaSortieVers = ExprReg.xConditionLaSortieVers.exec(conditionBrute);
      if (!resConditionLaSortieVers) {
        // D. tester la formulation [aucun pour]
        resConditionAucunPourVers = ExprReg.xConditionExistePourVers.exec(conditionBrute);
        if (!resConditionAucunPourVers) {
          // E. tester la formulation simple
          resCondSimple = ExprReg.xCondition.exec(conditionBrute);
          resCond = resCondSimple;
        }
      }
    }

    let els: ElementsPhrase = null;

    // si une des formulations autre que AucunPour
    if (resCond) {
      const sujet = resCond[3] ? (new GroupeNominal(resCond[2], resCond[3], resCond[4] ? resCond[4] : null)) : (resCond[1] ? new GroupeNominal(null, resCond[1], null) : null);
      const verbe = resCond[5];
      const negation = (resCond[6]?.trim() && resCond[6] !== 'soit') ? resCond[6] : null;
      const compl1 = resCond[7];
      els = new ElementsPhrase(null, sujet, verbe, negation, compl1);
      // décomposer les compléments si possible
      // complément1
      if (els.complement1) {
        const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement1);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          els.preposition1 = resCompl[1] ? resCompl[1] : null;
        }
      }
    } else if (resConditionAucunPourVers) {
      // ex1: aucun(1) complément(2) attribut(3) {n’existe} (pour|vers)(4) (le|la|les|...(6) xxx(7) yyy(8))|(ceci|cela)(5)
      // ex2: un(1) complément(2) attribut(3) {existe} (pour|vers)(4) (le|la|les|...(6) xxx(7) yyy(8))|(ceci|cela)(5)
      // ex sujet: ceci, cela, la/pomme/enchantée
      const sujet = resConditionAucunPourVers[7] ? (new GroupeNominal(resConditionAucunPourVers[6], resConditionAucunPourVers[7], resConditionAucunPourVers[8] ? resConditionAucunPourVers[8] : null)) : (resConditionAucunPourVers[5] ? new GroupeNominal(null, resConditionAucunPourVers[5], null) : null);
      const verbe = "existe";
      // ex compl1: description, aperçu, sortie, sortie accessible, porte, ...
      const compl = resConditionAucunPourVers[2] + (resConditionAucunPourVers[3] ? (" " + resConditionAucunPourVers[3]) : "");
      const negation = resConditionAucunPourVers[1].match(/^aucun|aucune$/i) ? resConditionAucunPourVers[1].toLowerCase() : null;
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);

      // console.warn("$$$$ els=", els);


      if (els.complement1) {
        const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement1);
        // console.warn("$$$$ resCompl=", resCompl);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          // els.preposition1 = resCompl[1] ? resCompl[1] : null;
        }
      }
      // prép: pour, vers
      els.preposition1 = resConditionAucunPourVers[4];
    } else if (resConditionLaSortieVers) {
      // ex: [si] la(1) porte(2) vers(3) (ceci|cela|[le] nord(5))(4) [n’]est(6) pas(7) ouverte(8)
      // ex sujets: la/porte vers/ceci, la/sortie vers/nord
      const sujet = (new GroupeNominal(resConditionLaSortieVers[1], resConditionLaSortieVers[2] + " vers", (resConditionLaSortieVers[5] ? resConditionLaSortieVers[5] : resConditionLaSortieVers[4])));
      // ex verbe: est
      const verbe = resConditionLaSortieVers[6]
      // ex compl: ouverte, innaccessible, verrouillée, …
      const compl = resConditionLaSortieVers[8];
      // ex pas, plus
      const negation = (resConditionLaSortieVers[7] ? resConditionLaSortieVers[7] : null);
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);
    }

    if (els) {
      retVal = new ConditionSolo(els.sujet, els.verbe, els.negation, els.complement1, els.sujetComplement1);
    } else {
      retVal = null;
    }

    return retVal;
  }

  /**
   * Obtenir la suite d’une condition en plusieurs morceaux.
   * C’est à dire seulement un complèment.
   * @param conditionBrute 
   * @returns 
   */
  public static obetenirConditionSoloSuite(complementBrut: string): ConditionSolo {
    let retVal: ConditionSolo = null;
    if (complementBrut) {
      let sujetComplement1: GroupeNominal = null;
      const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(complementBrut);
      if (resCompl) {
        sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
        // els.preposition1 = resCompl[1] ? resCompl[1] : null;
      }
      retVal = new ConditionSolo(null, null, null, complementBrut, sujetComplement1);
    }

    // let resCond: RegExpExecArray = null;

    // switch (lien) {
    //   case LienCondition.ni:
    //   case LienCondition.soit:
    //     resCond = ExprReg.xSuiteConditionNiSoit.exec(conditionBrute);
    //     break;

    //   case LienCondition.maisPas:
    //   case LienCondition.maisNi:
    //   case LienCondition.maisBien:
    //     resCond = ExprReg.xSuiteConditionMais.exec(conditionBrute);
    //     break;

    //   default:
    //     break;
    // }

    return retVal;
  }

  /**
   * Décomposer la condition selon la priorité des opérateurs.
   * @param conditionSource 
   */
  public static decomposerConditionBrute(conditionBrute: string): ConditionDecomposee {
    let conditionDecomposee: ConditionDecomposee = null;
    const estFrereCadet = false;
    const estSuiteCondition = false;
    // vérifier si parenthèses de la condition sont valides
    if (conditionBrute && AnalyseurCondition.parenthesesValides(conditionBrute)) {
      conditionDecomposee = this.decomposerMorceauConditionBrute(conditionBrute, estSuiteCondition, estFrereCadet, LienCondition.aucun, LienCondition.aucun, []);
    }
    console.warn("conditionDecomposee:", conditionDecomposee);

    return conditionDecomposee;
  }

  /**
   * Suite décomposer la condition selon la priorité des opérateurs.
   * @param conditionSource 
   */
  private static decomposerMorceauConditionBrute(morceauConditionBrute: string, estSuiteCondition: boolean, estFrereCadet: boolean, typeLien: LienCondition, lien: LienCondition, sousConditionsBrutes: string[]): ConditionDecomposee {

    let retVal = new ConditionDecomposee();
    retVal.conditionBrute = morceauConditionBrute;
    retVal.lien = lien;
    retVal.estDebutCondition = !estSuiteCondition;
    retVal.estFrereCadet = estFrereCadet;

    // vérifier si le type de lien est valide
    if (AnalyseurCondition.getTypeLien(lien) !== typeLien) {
      console.error("decomposerMorceauConditionBrute: le type de lien ne correspond pas au lien.");
    }

    // on traitera plus tard tout ce qui n’est pas dans le niveau de parenthèses 0
    let niveauActuel = 0;

    let conditionPrincipale: string = "";
    let morceauxConditionPrincipale: string[] = null;
    let courSousCondition = "";

    // RÉFÉRENCE VERS UNE SOUS-CONDITION
    const xRefSousCond = /^@sc(\d+)@$/i;
    const resultatRefSousCond = xRefSousCond.exec(morceauConditionBrute);
    // s’agit-il uniquement d’une référence vers une sous-condition ?
    if (resultatRefSousCond) {
      const indexSousCond = Number.parseInt(resultatRefSousCond[1]);
      // console.warn(
      //   "resultatRefSousCond=", resultatRefSousCond,
      //   "\nindexSousCond=", indexSousCond,
      //   "\nsousConditionsBrutes=", sousConditionsBrutes,
      //   "\nsousConditionsBrutes[indexSousCond]=", sousConditionsBrutes[indexSousCond],
      // );
      retVal = this.decomposerMorceauConditionBrute(sousConditionsBrutes[indexSousCond], estSuiteCondition, estFrereCadet, typeLien, lien, sousConditionsBrutes);
      // CONDITION À DÉCOMPOSER
    } else {
      // 1] DÉCOUPER LA CONDITIONS SELON LES PARENTHÈSES
      for (const car of morceauConditionBrute) {
        // changer niveau parenthèses le cas échéant
        let niveauPrecedent = niveauActuel;
        //   a) nouvelle parenthèse
        if (car == '(') {
          niveauActuel = niveauPrecedent + 1;
          // si on passe du niveau 0 à 1, on commence une nouvelle sous condition
          // (si on était déjà au dessus du niveau 0, on laisse dans la même sous-condition pour le moment.)
          if (niveauPrecedent == 0) {
            courSousCondition = "";
          } else {
            // ajouter caractère à la sous-condition courante
            courSousCondition += car;
          }
          // b) fin de parenthèse
        } else if (car == ')') {
          niveauActuel = niveauPrecedent - 1;
          // si on passe du niveau 1 à 0, on ajoute une nouvelle sous condition à la liste
          // (si on était dans une sous-condition, on laisse dans la même sous-condition pour le moment)
          if (niveauPrecedent == 1) {
            if (courSousCondition) {
              const tailleListe = sousConditionsBrutes.push(courSousCondition.trim());
              conditionPrincipale += "@sc" + (tailleListe - 1) + "@";
            }
            courSousCondition = null;
          } else {
            // ajouter caractère à la sous-condition courante
            courSousCondition += car;
          }
          // c) pas de changement
        } else {
          //   - ajouter caractère à la condition principale
          if (niveauActuel == 0) {
            conditionPrincipale += car;
            // - ajouter caractère à la sous-condition courante
          } else {
            courSousCondition += car;
          }
        }
      }

      // opérateurs par priorité
      const prioriteOperateurs = [
        ' (et) ',
        ' (ou) ',
        ' (ni) ',
        ' (soit) ',
        ' (ainsi que|mais pas|mais bien|mais ni) ',
        ' (et si) ',
        ' (ou si) '
      ];

      morceauxConditionPrincipale = [conditionPrincipale];
      let prioIndex = prioriteOperateurs.length;
      let operateur = "";
      // décomposer la condition principale avec l’opérateur à la priorité la plus basse trouvée
      while (morceauxConditionPrincipale.length == 1 && prioIndex > 0) {
        operateur = prioriteOperateurs[--prioIndex];
        morceauxConditionPrincipale = conditionPrincipale.split(new RegExp(operateur, 'gi'));
      }


      // il y a des sous-conditions
      if (morceauxConditionPrincipale.length > 1) {
        retVal.sousConditions = [];
        let prochainLien = LienCondition.aucun; // pas de lien pour la première sous-condition
        let prochainLienEstNouvelleCondition = false; // le prochain lien est-il de type nouvelle condition (et si, ou si) ?
        retVal.typeLienSousConditions = AnalyseurCondition.getTypeLien(morceauxConditionPrincipale[1]); // déterminer type de lien des enfants (et|ou|soit) sur base du premier lien
        for (let indexMorceau = 0; indexMorceau < morceauxConditionPrincipale.length; indexMorceau++) {
          const morceauEstFrereCadet = (indexMorceau === morceauxConditionPrincipale.length - 1);
          const newSousCondition = this.decomposerMorceauConditionBrute(morceauxConditionPrincipale[indexMorceau], estSuiteCondition || (indexMorceau > 0 && !prochainLienEstNouvelleCondition), morceauEstFrereCadet, (indexMorceau == 0 ? LienCondition.aucun : retVal.typeLienSousConditions), prochainLien, sousConditionsBrutes);
          if (!newSousCondition) {
            console.error("Sous condition pas pu être décomposée:", morceauxConditionPrincipale[indexMorceau]);
          } else {
            retVal.sousConditions.push(newSousCondition);
          }
          if (!morceauEstFrereCadet) {
            prochainLien = AnalyseurCondition.getLien(morceauxConditionPrincipale[++indexMorceau]);
            prochainLienEstNouvelleCondition = AnalyseurCondition.estLienNouvelleCondition(prochainLien);
          }
        }
        // pas de sous-condition
      } else {
        retVal.sousConditions = null;
      }
    }


    return retVal;
  }


  /** Retrouver le lien correspondant à la chaîne de caractères */
  private static getLien(lien: string): LienCondition {
    if (lien) {
      switch (lien) {
        case 'ou':
          return LienCondition.ou;
        case 'ou si':
          return LienCondition.ouSi;

        case 'et':
          return LienCondition.et;

        case 'et si':
          return LienCondition.etSi;

        case 'ainsi que':
          return LienCondition.ainsiQue;

        case 'mais bien':
          return LienCondition.maisBien;

        case 'mais pas':
          return LienCondition.maisPas;

        case 'mais ni':
          return LienCondition.maisNi;

        case 'soit':
          return LienCondition.soit;

        case 'ni':
          return LienCondition.ni;

        default:
          console.error("Lien inconnu:", lien);
          return LienCondition.aucun;
      }
    } else {
      return LienCondition.aucun;
    }
  }

  /** Retrouver le lien correspondant à la chaîne de caractères */
  private static getTypeLien(lien: string): LienCondition {
    if (lien) {
      switch (lien) {
        case 'ou':
        case 'ou si':
          return LienCondition.ou;

        case 'et':
        case 'et si':
        case 'ainsi que':
        case 'mais bien':
        case 'mais pas':
        case 'mais ni':
        case 'ni':
          return LienCondition.et;

        case 'soit':
          return LienCondition.soit;

        case '-':
          return LienCondition.aucun;

        default:
          console.error("Lien inconnu:", lien);
          return LienCondition.aucun;
      }
    } else {
      return LienCondition.aucun;
    }
  }

  /** S’agit-il d’un lien qui est suivit d’une nouvelle condition ? (et non de la suite d’une condition) */
  private static estLienNouvelleCondition(lien: string): boolean {
    if (lien) {
      switch (lien) {
        case LienCondition.etSi:
        case LienCondition.ouSi:
        case LienCondition.aucun:
          return true;
      }
    }
    return false;
  }


  /**
   * 
   * @param condition 
   * @returns 
   */
  private static decomposerCondition(condition: string) {

    let els: ElementsPhrase = null;

    let resCond: RegExpExecArray = null;
    let resCondNiSoit: RegExpExecArray = null;
    let resCondEtOu: RegExpExecArray = null;
    let resCondMaisPasEtOu: RegExpExecArray = null;
    let resCondSimple: RegExpExecArray = null;
    let resConditionAucunPourVers: RegExpExecArray = null;
    let resConditionLaSortieVers: RegExpExecArray = null;

    // console.log("condition:", condition);


    // A. tester la formulation  [ni ni | soit soit]
    resCondNiSoit = ExprReg.xConditionNiSoit.exec(condition);
    resCond = resCondNiSoit;

    // console.log(">> resCondNiSoit:", resCondNiSoit);


    if (!resCondNiSoit) {
      resCondEtOu = ExprReg.xConditionOuEt.exec(condition);
      resCond = resCondEtOu;
    }
    // console.log(">> resCondEtOu:", resCondEtOu);

    if (!resCondNiSoit && !resCondEtOu) {
      // B. tester la formulation [mais pas | mais bien | et | ou]
      resCondMaisPasEtOu = ExprReg.xConditionMaisPasEtOu.exec(condition);
      resCond = resCondMaisPasEtOu;
      if (!resCondMaisPasEtOu) {
        // C. tester la formulation [la porte|sortie vers xxx est]
        // TODO: gérer les conjonctions (mais pas, ou, et, …)
        resConditionLaSortieVers = ExprReg.xConditionLaSortieVers.exec(condition);
        if (!resConditionLaSortieVers) {
          // D. tester la formulation [aucun pour]
          resConditionAucunPourVers = ExprReg.xConditionExistePourVers.exec(condition);
          if (!resConditionAucunPourVers) {
            // E. tester la formulation simple
            resCondSimple = ExprReg.xCondition.exec(condition);
            resCond = resCondSimple;
          }
        }
      }
    }

    // si une des formulations autre que AucunPour
    if (resCond) {
      const sujet = resCond[3] ? (new GroupeNominal(resCond[2], resCond[3], resCond[4] ? resCond[4] : null)) : (resCond[1] ? new GroupeNominal(null, resCond[1], null) : null);
      const verbe = resCond[5];
      const negation = (resCond[6]?.trim() && resCond[6] !== 'soit') ? resCond[6] : null;
      const compl1 = resCond[7];
      // éventuellement un 2e complément
      const compl2 = (resCondMaisPasEtOu || resCondNiSoit || resCondEtOu) ? resCond[9] : null;
      // éventuellement un 3e complément
      const compl3 = (resCondNiSoit || resCondEtOu) ? resCond[10] : null;
      // éventuellement un 4e complément
      const compl4 = (resCondNiSoit || resCondEtOu) ? resCond[11] : null;

      els = new ElementsPhrase(null, sujet, verbe, negation, compl1);
      els.complement2 = compl2;
      els.complement3 = compl3;
      els.complement4 = compl4;
      els.conjonction = (resCondMaisPasEtOu || resCondNiSoit || resCondEtOu) ? resCond[8] : null;

      // décomposer les compléments si possible
      // complément1
      if (els.complement1) {
        const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement1);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          els.preposition1 = resCompl[1] ? resCompl[1] : null;
        }
        // complément2
        if (els.complement2) {
          const resCompl2 = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement2);
          if (resCompl2) {
            els.sujetComplement2 = new GroupeNominal(resCompl2[2], resCompl2[3], (resCompl2[4] ? resCompl2[4] : null));
          }
          // complément3
          if (els.complement3) {
            const resCompl3 = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement3);
            if (resCompl3) {
              els.sujetComplement3 = new GroupeNominal(resCompl3[2], resCompl3[3], (resCompl3[4] ? resCompl3[4] : null));
            }
            // complément4
            if (els.complement4) {
              const resCompl4 = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement4);
              if (resCompl4) {
                els.sujetComplement4 = new GroupeNominal(resCompl4[2], resCompl4[3], (resCompl4[4] ? resCompl4[4] : null));
              }
            }
          }
        }
      }
    } else if (resConditionAucunPourVers) {
      // ex1: aucun(1) complément(2) attribut(3) {n’existe} (pour|vers)(4) (le|la|les|...(6) xxx(7) yyy(8))|(ceci|cela)(5)
      // ex2: un(1) complément(2) attribut(3) {existe} (pour|vers)(4) (le|la|les|...(6) xxx(7) yyy(8))|(ceci|cela)(5)
      // ex sujet: ceci, cela, la/pomme/enchantée
      const sujet = resConditionAucunPourVers[7] ? (new GroupeNominal(resConditionAucunPourVers[6], resConditionAucunPourVers[7], resConditionAucunPourVers[8] ? resConditionAucunPourVers[8] : null)) : (resConditionAucunPourVers[5] ? new GroupeNominal(null, resConditionAucunPourVers[5], null) : null);
      const verbe = "existe";
      // ex compl1: description, aperçu, sortie, sortie accessible, porte, ...
      const compl = resConditionAucunPourVers[2] + (resConditionAucunPourVers[3] ? (" " + resConditionAucunPourVers[3]) : "");
      const negation = resConditionAucunPourVers[1].match(/^aucun|aucune$/i) ? resConditionAucunPourVers[1].toLowerCase() : null;
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);

      // console.warn("$$$$ els=", els);


      if (els.complement1) {
        const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement1);
        // console.warn("$$$$ resCompl=", resCompl);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          // els.preposition1 = resCompl[1] ? resCompl[1] : null;
        }
      }
      // prép: pour, vers
      els.preposition1 = resConditionAucunPourVers[4];
    } else if (resConditionLaSortieVers) {
      // ex: [si] la(1) porte(2) vers(3) (ceci|cela|[le] nord(5))(4) [n’]est(6) pas(7) ouverte(8)
      // ex sujets: la/porte vers/ceci, la/sortie vers/nord
      const sujet = (new GroupeNominal(resConditionLaSortieVers[1], resConditionLaSortieVers[2] + " vers", (resConditionLaSortieVers[5] ? resConditionLaSortieVers[5] : resConditionLaSortieVers[4])));
      // ex verbe: est
      const verbe = resConditionLaSortieVers[6]
      // ex compl: ouverte, innaccessible, verrouillée, …
      const compl = resConditionLaSortieVers[8];
      // ex pas, plus
      const negation = (resConditionLaSortieVers[7] ? resConditionLaSortieVers[7] : null);
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);
    }

    return els;
  }



}