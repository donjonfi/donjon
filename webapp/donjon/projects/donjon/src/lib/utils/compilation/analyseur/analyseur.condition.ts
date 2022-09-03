import { Condition } from "../../../models/compilateur/condition";
import { ConditionDecomposee } from "../../../models/compilateur/condition-decomposee";
import { ConditionMulti } from "../../../models/compilateur/condition-multi";
import { ConditionSolo } from "../../../models/compilateur/condition-solo";
import { ElementsPhrase } from "../../../models/commun/elements-phrase";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { LienCondition } from "../../../models/compilateur/lien-condition";
import { StringUtils } from "../../commun/string.utils";

export class AnalyseurCondition {


  /** Générer la condition correspondant à la phrase spécifiée. */
  public static getConditionMulti(conditionBrute: string): ConditionMulti {

    let retVal: ConditionMulti = null;

    // A. DÉCOMPOSER LA CONDITION
    const conditionDecomposee = AnalyseurCondition.decomposerConditionBrute(conditionBrute);
    // B. GÉNÉRER LA CONDITION
    if (conditionDecomposee) {
      retVal = AnalyseurCondition.genererConditionMulti(conditionDecomposee);
      // C. SIMPLIFIER LA CONDITION
      if (retVal.nbErreurs == 0) {
        retVal = AnalyseurCondition.simplifierConditionMulti(retVal)
      }
    }
    return retVal
  }

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


  public static simplifierConditionMulti(conditionMulti: ConditionMulti): ConditionMulti {
    // console.log("simplifierConditionMulti");
    let dernierDebutCondition: ConditionSolo = null;
    let parentImpliqueAjoutNegationEnfant = false;
    let parentImpliqueRetraitNegationEnfant = false;
    AnalyseurCondition.simplifierMorceauConditionMulti(conditionMulti, dernierDebutCondition, parentImpliqueAjoutNegationEnfant, parentImpliqueRetraitNegationEnfant);
    return conditionMulti;
  }

  /** 
   * Simplifier la conditions multi:
   *   - convertir les liens en et/ou/soit uniquement.
   *   - remettre le début à chaque condition qui n’en a pas encore.
   * @returns dernier début de condition trouvé.
   */
  private static simplifierMorceauConditionMulti(conditionMulti: ConditionMulti, dernierDebutCondition: ConditionSolo, forcerAjoutNegation: boolean, forcerRetraitNegation: boolean): ConditionSolo {

    let parentImpliqueAjoutNegationEnfant = false;
    let parentImpliqueRetraitNegationEnfant = false;

    // A) ADAPTER LE LIEN VERS ET/OU/SOIT LE CAS ÉCHÉANT
    switch (conditionMulti.lienFrereAine) {
      // OU simple (ou, ou si)
      case LienCondition.ou:
      case LienCondition.ouSi:
      case LienCondition.ouQue:
        // ou
        conditionMulti.lienFrereAine = LienCondition.ou;
        break;
      // ET simple (et, et si, ainsi que, mais bien)
      case LienCondition.et:
      case LienCondition.etSi:
      case LienCondition.etQue:
      case LienCondition.ainsiQue:
        // et
        conditionMulti.lienFrereAine = LienCondition.et;
        break;

      // ET BIEN (mais bien)
      case LienCondition.maisBien:
        // et
        conditionMulti.lienFrereAine = LienCondition.et;
        // bien
        if (conditionMulti.condition) {
          forcerRetraitNegation = true;
        } else {
          parentImpliqueRetraitNegationEnfant = true;
        }
        break;

      // ET PAS (ni, mais ni, mais pas, mais plus)
      case LienCondition.ni:
      case LienCondition.maisNi:
      case LienCondition.maisPas:
      case LienCondition.maisPlus:
        // pas
        if (conditionMulti.condition) {
          forcerAjoutNegation = true;
          if (conditionMulti.lienFrereAine === LienCondition.maisNi) {
            console.error("« mais ni » doit être forcément être suivi d’au moins 1 « ni » supplémentaire.");
            conditionMulti.nbErreurs += 1;
          }
        } else {
          parentImpliqueAjoutNegationEnfant = true;
        }
        // et
        conditionMulti.lienFrereAine = LienCondition.et;
        break;

      // ET SOIT (mais soit)
      case LienCondition.maisSoit:
        // et
        conditionMulti.lienFrereAine = LienCondition.et;
        // bien
        if (conditionMulti.condition) {
          console.error("« mais soit » doit être forcément être suivi d’au moins 1 « soit » supplémentaire.");
          conditionMulti.nbErreurs += 1;
        } else {
          parentImpliqueRetraitNegationEnfant = true;
        }
        break;

      // SOIT simple
      case LienCondition.soit:
        // soit
        conditionMulti.lienFrereAine = LienCondition.soit;
        break;

      // AUCUN
      case LienCondition.aucun:
        break;

      default:
        console.error("simplifierMorceauConditionMulti > lien pas supporté ici: ", conditionMulti.lienFrereAine);
        conditionMulti.nbErreurs += 1;
        conditionMulti.erreurs.push("simplification condition multi: lien pas supporté ici: " + conditionMulti.lienFrereAine);
        break;
    }

    // B) DÉBUT DE LA CONDITION, VÉRIFIER NÉGATION IMPLIQUÉE PAR LIEN PARENT

    // s’il s’agit d’une condition simple
    if (conditionMulti.condition) {
      // DÉBUT
      // si la condition possède un début, c’est le dernier début trouvé
      if (conditionMulti.condition.sujet && conditionMulti.condition.verbe) {
        dernierDebutCondition = conditionMulti.condition;
        // sinon, définir le début de la condition
      } else {
        if (!dernierDebutCondition) {
          console.error("simplifierMorceauConditionMulti: dernierDebutCondition manquant.");
        } else {
          conditionMulti.condition.sujet = dernierDebutCondition.sujet;
          conditionMulti.condition.verbe = dernierDebutCondition.verbe;
          conditionMulti.condition.negation = dernierDebutCondition.negation;
        }
      }
      // NÉGATION
      if (forcerAjoutNegation) {
        // console.log("forcerAjoutNegation");
        conditionMulti.condition.negation = "pas";
      } else if (forcerRetraitNegation) {
        // console.log("forcerRetraitNegation");
        conditionMulti.condition.negation = null;
      }

      // SOUS-CONDITIONS
    } else if (conditionMulti.sousConditions?.length) {
      // parcourir les sous-conditions
      conditionMulti.sousConditions.forEach(curSousCondition => {
        // simplifier la sousCondition
        dernierDebutCondition = AnalyseurCondition.simplifierMorceauConditionMulti(curSousCondition, dernierDebutCondition, parentImpliqueAjoutNegationEnfant, parentImpliqueRetraitNegationEnfant);
        if (curSousCondition.nbErreurs) {
          conditionMulti.nbErreurs += 1;
          conditionMulti.erreurs.push("simplification condition multi: erreur dans une des sous-conditions");
        }
      });
      // PAS DE CONDITION NI DE SOUS-CONDITIONS
    } else {
      console.error("simplifierMorceauConditionMulti: pas de condition ni de sous condition !");
      conditionMulti.nbErreurs += 1;
      conditionMulti.erreurs.push("simplification condition multi: pas de condition ni de sous condition");
    }
    return dernierDebutCondition;
  }

  /**
   * Créer une condition multi à partir d'une condition décomposéee.
   * @param conditionDecomposee 
   */
  public static genererConditionMulti(conditionDecomposee: ConditionDecomposee): ConditionMulti {

    let retVal: ConditionMulti = null;

    if (conditionDecomposee) {

      retVal = new ConditionMulti();

      retVal.lienFrereAine = conditionDecomposee.lien;

      // s'il y a des sous-conditions
      if (conditionDecomposee.sousConditions) {
        retVal.condition = null;
        retVal.sousConditions = [];
        retVal.typeLienSousConditions = conditionDecomposee.typeLienSousConditions;
        conditionDecomposee.sousConditions.forEach(sousCondDec => {
          const sousCond = this.genererConditionMulti(sousCondDec);
          retVal.sousConditions.push(sousCond);
          // propager l’erreur
          if (sousCond.nbErreurs != 0) {
            retVal.nbErreurs += 1;
          }
        });
        // s'il s'agit d'une simple condition
      } else {
        retVal.sousConditions = null;
        if (conditionDecomposee.estDebutCondition) {
          retVal.condition = AnalyseurCondition.obetenirConditionSoloDebut(conditionDecomposee.conditionBrute);
          // si condition pas trouvée
          if (!retVal.condition) {
            console.error(`Condition solo (début) pas trouvée pour « ${conditionDecomposee.conditionBrute} »`);
            retVal.erreurs.push(`Début de la condition pas trouvé : « ${conditionDecomposee.conditionBrute} »`);
            retVal.nbErreurs += 1;
          }
        } else {
          retVal.condition = AnalyseurCondition.obetenirConditionSoloSuite(conditionDecomposee.conditionBrute);
          // si simple condition pas trouvée
          if (!retVal.condition) {
            console.error(`Condition solo (suite) pas trouvée pour « ${conditionDecomposee.conditionBrute} »`);
            retVal.erreurs.push(`Fin de la condition pas trouvé : « ${conditionDecomposee.conditionBrute} »`);
            retVal.nbErreurs += 1;
          }
        }
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
    let resConditionTirage: RegExpExecArray = null;
    let resCondSimple: RegExpExecArray = null;

    // console.log(">>>>>>>>>> CONDITION:", conditionBrute);
    
    // A. tester la formulation  [ni ni | soit soit]
    resCondNiSoit = ExprReg.xDebutConditionNiSoit.exec(conditionBrute);
    resCond = resCondNiSoit;
    if (!resCondNiSoit) {
      // B. tester la formulation [la porte|sortie vers xxx est]
      resConditionLaSortieVers = ExprReg.xConditionLaSortieVers.exec(conditionBrute);
      if (!resConditionLaSortieVers) {
        // C. tester la formulation [aucun pour]
        resConditionAucunPourVers = ExprReg.xConditionExistePourVers.exec(conditionBrute);
        if (!resConditionAucunPourVers) {
          // D: tester la formulation [un tirage à x chances sur y réussit/échoue]
          resConditionTirage = ExprReg.xConditionTirage.exec(conditionBrute);
          if (!resConditionTirage) {
            // E. tester la formulation simple
            resCondSimple = ExprReg.xCondition.exec(conditionBrute);
            resCond = resCondSimple;
          }
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
      // ex négation: pas, plus
      const negation = (resConditionLaSortieVers[7] ? resConditionLaSortieVers[7] : null);
      // ex compl: ouverte, innaccessible, verrouillée, …
      const compl = resConditionLaSortieVers[8];
      els = new ElementsPhrase(null, sujet, verbe, negation, compl);
    } else if (resConditionTirage) {
      // si nombre_en_chiffres(1)|nombre_en_lettres(2) tirage[s] à|de|a nombre_en_chiffres(3)|nombre_en_lettres(4) 
      // chance[s] sur nombre_en_chiffres(5)|nombre_en_lettres(6) (réussi[ssen]t|échoue[nt])(7)
      const nbTirage = StringUtils.getNombreEntierDepuisChiffresOuLettres(resConditionTirage[1], resConditionTirage[2], undefined);
      if (nbTirage != 1) {
        console.error("1 seul tirage est possible actuellement.");
      }
      const nbChances = StringUtils.getNombreEntierDepuisChiffresOuLettres(resConditionTirage[3], resConditionTirage[4], undefined);
      const totalTirage = StringUtils.getNombreEntierDepuisChiffresOuLettres(resConditionTirage[5], resConditionTirage[6], undefined);
      const reussit = /résussi(?:ssen)?t/i.test(resConditionTirage[7]);
      const sujet = new GroupeNominal("un ", "tirage");
      const verbe = "réussit";
      const negation = reussit ? null : "pas";
      const complement1 = nbChances + ' chance' + (nbChances > 1 ? 's' : '') + ' sur ' + totalTirage;
      els = new ElementsPhrase(null, sujet, verbe, negation, complement1);
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
    } else {
      console.error("decomposerConditionBrute > parenthèses pas valides > ", conditionBrute);
    }
    return conditionDecomposee;
  }

  /**
   * Suite décomposer la condition selon la priorité des opérateurs.
   * @param conditionSource 
   */
  private static decomposerMorceauConditionBrute(morceauConditionBrute: string, estSuiteCondition: boolean, estFrereCadet: boolean, typeLien: LienCondition, lien: LienCondition, sousConditionsBrutes: string[]): ConditionDecomposee {
    let retVal = new ConditionDecomposee();

    // enlever les espaces avant et après
    morceauConditionBrute = morceauConditionBrute.trim();

    // enlever éventuellement le « si » qui commence la condition
    // TODO: enlever également le sinonsi ?
    if (morceauConditionBrute.match(/^si /i)) {
      morceauConditionBrute = morceauConditionBrute.slice(3);
    }

    retVal.conditionBrute = morceauConditionBrute;
    retVal.lien = lien;
    retVal.estDebutCondition = !estSuiteCondition;
    retVal.estFrereCadet = estFrereCadet;

    // vérifier si le type de lien est valide
    if (AnalyseurCondition.getTypeLien(lien) !== typeLien) {
      console.error("decomposerMorceauConditionBrute: le type de lien ne correspond pas au lien.");
      retVal.nbErreurs += 1;
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
        'et',
        'ou',
        'ni',
        'soit',
        'ainsi que|mais pas|mais bien|mais ni|mais soit',
        'et si|et que',
        'ou si|ou que'
      ];

      morceauxConditionPrincipale = [conditionPrincipale];
      let prioIndex = prioriteOperateurs.length;
      let operateur = "";
      // décomposer la condition principale avec l’opérateur à la priorité la plus basse trouvée
      while (morceauxConditionPrincipale.length == 1 && prioIndex > 0) {
        operateur = prioriteOperateurs[--prioIndex];
        morceauxConditionPrincipale = conditionPrincipale.split(new RegExp("(?: )?\\b(" + operateur + ")\\b ", 'gi'));
      }


      // il y a des sous-conditions
      if (morceauxConditionPrincipale.length > 1) {
        retVal.sousConditions = [];
        let prochainLien = LienCondition.aucun; // pas de lien pour la première sous-condition
        let prochainLienEstNouvelleCondition = false; // le prochain lien est-il de type nouvelle condition (et si, ou si) ?
        retVal.typeLienSousConditions = AnalyseurCondition.getTypeLien(morceauxConditionPrincipale[1]); // déterminer type de lien des enfants (et|ou|soit) sur base du premier lien

        for (let indexMorceau = 0; indexMorceau < morceauxConditionPrincipale.length; indexMorceau++) {
          const morceauEstFrereCadet = (indexMorceau === morceauxConditionPrincipale.length - 1);
          let sousConditionBrute: string = morceauxConditionPrincipale[indexMorceau];
          let estDebutSoitNi = false;
          // cas particuliers
          if (indexMorceau == 0) {
            // soit… soit… : ne pas découper la condition sur le premier « soit » !
            // ex: si le chat est soit gris soit noir => (1) si le chat est gris, (2) si le chat est noir
            if (morceauxConditionPrincipale[1] == LienCondition.soit && lien != LienCondition.maisSoit) {
              indexMorceau = 2;
              sousConditionBrute += " " + morceauxConditionPrincipale[2];
              estDebutSoitNi = true;
              if (!estSuiteCondition) {
                prochainLienEstNouvelleCondition = true; // on est à l’index 2 mais c’est bien le début de la condition
              }
              // ni… ni… : ne pas découper la condition sur le premier « ni » et ajouter négation (pas)
              // ex: si a ne dépasse ni 2 ni 3 => (1) si a ne dépasse pas 2, (2) si a ne dépasse pas 3
            } else if (morceauxConditionPrincipale[1] == LienCondition.ni && lien !== LienCondition.maisNi) {
              indexMorceau = 2;
              sousConditionBrute += " pas " + morceauxConditionPrincipale[2];
              estDebutSoitNi = true;
              if (!estSuiteCondition) {
                prochainLienEstNouvelleCondition = true; // on est à l’index 2 mais c’est bien le début de la condition
              }
            }
          }

          const newSousCondition = this.decomposerMorceauConditionBrute(sousConditionBrute, estSuiteCondition || (indexMorceau > 0 && !prochainLienEstNouvelleCondition), morceauEstFrereCadet, ((indexMorceau == 0 || estDebutSoitNi) ? LienCondition.aucun : retVal.typeLienSousConditions), prochainLien, sousConditionsBrutes);
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
        // 1 seul morceau
      } else {
        // pas de sous-conditions
        retVal.sousConditions = null;
        // vérifier si on a pas uniquement une parenthèse inutile, c’est un dire exactement une ref vers une sous condition
        const resultatRefSousCond = xRefSousCond.exec(morceauxConditionPrincipale[0]);
        // s’agit-il uniquement d’une référence vers une sous-condition ?
        if (resultatRefSousCond) {
          const indexSousCond = Number.parseInt(resultatRefSousCond[1]);
          retVal = this.decomposerMorceauConditionBrute(sousConditionsBrutes[indexSousCond], estSuiteCondition, estFrereCadet, typeLien, lien, sousConditionsBrutes);
        }
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

        case 'ou que':
          return LienCondition.ouQue;

        case 'et':
          return LienCondition.et;

        case 'et si':
          return LienCondition.etSi;

        case 'et que':
          return LienCondition.etQue;

        case 'ainsi que':
          return LienCondition.ainsiQue;

        case 'mais bien':
          return LienCondition.maisBien;

        case 'mais pas':
          return LienCondition.maisPas;

        case 'mais plus':
          return LienCondition.maisPlus;

        case 'mais ni':
          return LienCondition.maisNi;

        case 'mais soit':
          return LienCondition.maisSoit;

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
        case 'ou que':
          return LienCondition.ou;

        case 'et':
        case 'et si':
        case 'et que':
        case 'ainsi que':
        case 'mais bien':
        case 'mais pas':
        case 'mais plus':
        case 'mais ni':
        case 'mais soit':
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
        case LienCondition.etQue:
        case LienCondition.ouSi:
        case LienCondition.ouQue:
        case LienCondition.aucun:
          return true;
      }
    }
    return false;
  }

}