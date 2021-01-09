import { Condition, LienCondition } from '../../models/compilateur/condition';

import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';

export class PhraseUtils {



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

      // console.log(">> resCondMaisPasEtOu:", resCondMaisPasEtOu);


      resCond = resCondMaisPasEtOu;
      if (!resCondMaisPasEtOu) {
        // C. tester la formulation simple
        resCondSimple = ExprReg.xCondition.exec(condition);
        resCond = resCondSimple;
        if (!resCondSimple) {
          // D. tester la formulation [aucun pour]
          resConditionAucunPour = ExprReg.xConditionAucunPour.exec(condition);
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
        const resCompl = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement1);
        if (resCompl) {
          els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
          els.preposition1 = resCompl[1] ? resCompl[1] : null;
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
            // complément4
            if (els.complement4) {
              const resCompl4 = GroupeNominal.xPrepositionDeterminantArticheNomEpithete.exec(els.complement4);
              if (resCompl4) {
                els.sujetComplement4 = new GroupeNominal(resCompl4[2], resCompl4[3], (resCompl4[4] ? resCompl4[4] : null));
              }
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
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(false, LienCondition.et, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
            }
            break;
          case 'ou':
            retVal.lien = new Condition(false, LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(false, LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(false, LienCondition.ou, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
            }
            break;
          case 'soit':
            retVal.negation = ""; // correction: soit n’est pas une négation
            retVal.lien = new Condition(false, LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement2, els.sujetComplement2);
            // 3e élément éventuel
            if (els.complement3) {
              retVal.lien.lien = new Condition(false, LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement3, els.sujetComplement3);
              // 4e élément éventuel
              if (els.complement4) {
                retVal.lien.lien.lien = new Condition(false, LienCondition.soit, els.sujet, els.verbe, els.negation, els.complement4, els.sujetComplement4);
              }
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

  public static getEvenements(evenementsBruts: string) {
    // découper les attributs, les séparateurs possibles sont «, », et « ou ».
    const evenementsSepares = PhraseUtils.separerListeIntitules(evenementsBruts);
    let retVal: Evenement[] = [];
    evenementsSepares.forEach(evenementBrut => {
      // soit c’est une commande
      let els = PhraseUtils.decomposerCommande(evenementBrut.trim());
      // si on a trouvé une formulation correcte
      if (els) {
        retVal.push(new Evenement(els.infinitif, (els.sujet ? els.sujet.nom : null), null, els.preposition1, (els.sujetComplement1 ? els.sujetComplement1.nom : null)));
      } else {
        console.warn("getEvenements >> pas pu décomposer événement:", evenementBrut);
      }
    });
    return retVal;
  }

  /** Obtenir une liste d’intitulés sur base d'une chaîne d’intitulés séparés par des "," et un "et" */
  public static separerListeIntitules(attributsString: string): string[] {
    if (attributsString && attributsString.trim() !== '') {
      // découper les attributs, les séparateurs possibles sont «, », « et » et « ou ».
      return attributsString.trim().split(/(?:, | et | ou )+/);
    } else {
      return new Array<string>();
    }
  }

  static decomposerCommande(commande: string) {
    let els: ElementsPhrase = null;
    let res = ExprReg.xCommandeSpeciale.exec(commande);
    // COMMANDE SPÉCIALE (pas un infinitif)
    if (res) {
      // Ce n'est pas un infinitif mais bon...
      els = new ElementsPhrase(res[1], (res[2] ? new GroupeNominal(null, res[2], null) : null), null, null, null);
      // COMMANDE DIALOGUE (par ordre de préférence)
    } else {
      // le phrase peut-être tournée de 2 manière différentes, on veut pouvoir
      // détecter les 2.

      // => 1) PARLER DE SUJET AVEC INTERLOCUTEUR (formulation qui évite les ambiguïtés avec les noms composés)
      let sensInterlocSujet = false;
      res = ExprReg.xCommandeParlerSujetAvecInterlocuteur.exec(commande);
      //  => 2) PARLER AVEC INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
      if (!res) {
        sensInterlocSujet = true;
        res = ExprReg.xCommandeParlerAvecInterlocuteurConcernantSujet.exec(commande);
      }
      // => 3) INTERROGER INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
      if (!res) {
        sensInterlocSujet = true;
        res = ExprReg.xCommandeQuestionnerInterlocuteurConcernantSujet.exec(commande);
      }
      // => 4a) DEMANDER/DONNER/MONTRER SUJET À INTERLOCUTEUR
      if (!res) {
        sensInterlocSujet = false;
        res = ExprReg.xCommandeDemanderSujetAInterlocuteur.exec(commande);
      }
      // => 4b) DEMANDER/DONNER À VERBE À INTERLOCUTEUR
      if (!res) {
        sensInterlocSujet = false;
        res = ExprReg.xCommandeDemanderAVerbeAInterlocuteur.exec(commande);
      }
      // => 5) PARLER AVEC INTERLOCUTEUR DE SUJET (formulation qui peut poser des soucis avec les noms composés)
      if (!res) {
        sensInterlocSujet = true;
        res = ExprReg.xCommandeParlerAvecInterlocuteurDeSujet.exec(commande);
      }
      // => 6) MONTRER/DEMANDER/DONNER À INTERLOCUTEUR SUJET (formulation qui peut poser des soucis avec les noms composés de plus on privilégie infinitif + compl. direct + compl. indirect)
      if (!res) {
        sensInterlocSujet = true;
        res = ExprReg.xCommandeDemanderAInterlocuteurSujet.exec(commande);
      }

      // DIALOGUE TROUVÉ (parler, demander, montrer, …)
      if (res) {
        let interlocuteur: GroupeNominal = null;
        let sujetDialogue: GroupeNominal = null;
        const infinitif = res[1];
        if (sensInterlocSujet) {
          // déterminant difficile à déterminer donc on met rien
          interlocuteur = new GroupeNominal((res[2] ? res[2] : null), res[3], (res[4] ? res[4] : null));
          if (res[7]) {
            sujetDialogue = new GroupeNominal((res[6] ? res[6] : (res[5]?.trim() === 'au' ? 'au' : null)), res[7], (res[8] ? res[8] : null));
          }
        } else {
          interlocuteur = new GroupeNominal((res[6] ? res[6] : (res[5]?.trim() === 'au' ? 'au' : null)), res[7], (res[8] ? res[8] : null));
          sujetDialogue = new GroupeNominal((res[2] ? res[2] : null), res[3], (res[4] ? res[4] : null));
        }

        // console.log("interlocuteur.determinant=,", interlocuteur.determinant, "interlocuteur=", interlocuteur);
        // console.log("sujetDialogue.determinant=,", sujetDialogue.determinant, "sujetDialogue=", sujetDialogue);

        // corriger déterminants
        interlocuteur.determinant = PhraseUtils.trouverDeterminant(interlocuteur.determinant);
        if (sujetDialogue) {
          sujetDialogue.determinant = PhraseUtils.trouverDeterminant(sujetDialogue.determinant);
        }

        // console.log("interlocuteur.determinant=,", interlocuteur.determinant, "interlocuteur=", interlocuteur);
        // console.log("sujetDialogue.determinant=,", sujetDialogue.determinant, "sujetDialogue=", sujetDialogue);

        switch (infinitif) {
          case 'discuter':
          case 'parler':
            // parler avec interlocuteur (concernant sujet)
            els = new ElementsPhrase(infinitif, interlocuteur, null, null, (sujetDialogue?.nom));
            els.preposition0 = 'avec';
            els.sujetComplement1 = sujetDialogue;
            els.preposition1 = sujetDialogue ? 'concernant' : null;
            break;

          case 'montrer':
          case 'donner':
          case 'demander':
            // montrer/donner/demander sujet à interlocuteur
            els = new ElementsPhrase(infinitif, sujetDialogue, null, null, interlocuteur.nom);
            els.preposition0 = null;
            els.preposition1 = 'à';
            els.sujetComplement1 = interlocuteur;
            break;

          case 'interroger':
          case 'questionner':
            // interroger interlocuteur concernant sujet
            els = new ElementsPhrase(infinitif, interlocuteur, null, null, sujetDialogue.nom);
            els.preposition0 = null;
            els.preposition1 = 'concernant';
            els.sujetComplement1 = sujetDialogue;
            break;

          default:
            throw new Error("DécomposerCommande > dialogue > infinitif inconnu: " + infinitif);
        }

        // COMMANDE NORMALE (infinitif)
      } else {
        res = ExprReg.xCommandeInfinitif.exec(commande);
        if (res) {
          const sujet = res[3] ? new GroupeNominal(res[2], res[3], res[4] ? res[4] : null) : null;
          els = new ElementsPhrase(res[1], sujet, null, null, (res[5] ? res[5] : null));
          els.preposition1 = res[6] ? res[6] : null;
          els.sujetComplement1 = res[8] ? new GroupeNominal(res[7], res[8], res[9] ? res[9] : null) : null;
        }
      }
    }

    // afin de ne pas avoir à s’en inquiéter après, on met l’infinitif en minuscules
    if (els && els.infinitif) {
      els.infinitif = els.infinitif.toLowerCase();
    }

    return els;
  }

  static trouverDeterminant(determinant: string): string {
    let retVal = determinant?.trim();
    if (retVal) {
      switch (retVal) {
        case 'la':
        case 'à la':
        case 'avec la':
        case 'sur la':
        case 'concernant la':
        case 'de la':
        case 'd\'une':
        case 'd\’une':
        case 'ma':
        case 'sa':
          retVal = 'la ';
          break;

        case 'le':
        case 'au':
        case 'avec le':
        case 'du':
        case 'd\'un':
        case 'd’un':
        case 'mon':
        case 'son':
          retVal = 'le ';
          break;

        case 'les':
        case 'aux':
        case 'avec les':
        case 'des':
        case 'mes':
        case 'ses':
          retVal = 'les ';
          break;

        case 'l\'':
        case 'l’':
        case 'à l\'':
        case 'à l’':
        case 'avec l\'':
        case 'avec l’':
        case 'de l\'':
        case 'de l’':
          retVal = 'l’';
          break;

        case 'à':
        case 'de':
        case 'se':
          retVal = null;
          break;

        default:
          break;
      }
    }
    return retVal;
  }

  static decomposerInstruction(instruction: string) {


    let els: ElementsPhrase = null;

    // infinitif, complément
    const resInfinitifCompl = ExprReg.xInstruction.exec(instruction);

    if (resInfinitifCompl) {
      els = new ElementsPhrase(resInfinitifCompl[1], null, null, null, resInfinitifCompl[2]);

      // s’il y a un complément qui suit l’infinitif, essayer de le décomposer
      if (els.complement1) {
        els.complement1 = els.complement1.trim();
        // Ne PAS essayer de décomposer le complément s’il commence par « " » ou s’il s’agit de l’instruction exécuter.)
        if (!els.complement1.startsWith('"') && els.infinitif !== 'exécuter') {
          // tester si le complément est une phrase simple
          // ex: le joueur ne se trouve plus dans la piscine.
          const resSuite = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec(els.complement1);
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
              els.preposition1 = resCompl[1] ? resCompl[1] : null;
            }
            // tester si le complément est une instruction à 1 ou 2 compléments
            // ex: déplacer le trésor vers le joueur.
          } else {
            const res1ou2elements = ExprReg.xComplementInstruction1ou2elements.exec(els.complement1);
            if (res1ou2elements) {
              els.verbe = null;
              els.negation = null;
              els.sujet = new GroupeNominal(res1ou2elements[1], res1ou2elements[2], res1ou2elements[3]);
              els.complement1 = null;
              els.preposition1 = res1ou2elements[4];
              els.sujetComplement1 = new GroupeNominal(res1ou2elements[5], res1ou2elements[6], res1ou2elements[7]);
            }
          }
        }
      }
    }



    return els;
  }

}
