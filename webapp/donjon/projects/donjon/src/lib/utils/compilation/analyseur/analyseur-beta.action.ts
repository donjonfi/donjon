import { Action } from "../../../models/compilateur/action";
import { AnalyseurBetaInstructions } from "./analyseur-beta.instructions";
import { AnalyseurCondition } from "./analyseur.condition";
import { CibleAction } from "../../../models/compilateur/cible-action";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { Verification } from "../../../models/compilateur/verification";

export class AnalyseurBetaAction {

  /**
 * Rechercher une description d’action
 * @param actions actions déjà trouvées.
 * @param phrase phrase à analyser.
 * @param erreurs liste des erreurs.
 */
  public static testerAction(phrase: Phrase, ctxAnalyse: ContexteAnalyse): Action {

    const result = ExprReg.xAction.exec(phrase.morceaux[0]);
    // A. Nouvelle action complète
    if (result !== null) {
      const verbe = result[1].toLocaleLowerCase();
      const prepCeci = result[2];
      const ceci = result[3] === 'ceci';
      const prepCela = result[4];
      const cela = result[5] === 'cela';
      let action = new Action(verbe, prepCeci, ceci, prepCela, cela);

      action.destinationDeplacement = result[14] ?? undefined;

      // concerne un élément ?
      if (ceci) {
        action.cibleCeci = new CibleAction(result[6], result[7], result[8], result[9]);
        // concerne également un 2e élément ?
        if (cela) {
          if (result[6] === 'deux ' || result[6] == '2 ') {
            action.cibleCela = new CibleAction(result[6], result[7], result[8], result[9]);
          } else {
            action.cibleCela = new CibleAction(result[10], result[11], result[12], result[13]);
          }
        }
      }
      ctxAnalyse.actions.push(action);
      // renvoyer la nouvelle action complète
      return action;
    } else {
      // B. Suite de la description d’une action existante
      let resultDescriptionAction = ExprReg.xDescriptionAction.exec(phrase.morceaux[0]);
      if (resultDescriptionAction) {
        const motCle = resultDescriptionAction[1].toLocaleLowerCase();
        const verbe = resultDescriptionAction[2].toLocaleLowerCase();
        const ceci = resultDescriptionAction[3] === 'ceci';
        const cela = resultDescriptionAction[4] === 'cela';
        let complement = resultDescriptionAction[5];
        // si phrase morcelée, rassembler les morceaux
        if (phrase.morceaux.length > 1) {
          for (let index = 1; index < phrase.morceaux.length; index++) {
            complement += phrase.morceaux[index];
          }
        }
        complement = complement?.trim();


        if (complement) {
          // retrouver l'action correspondante (une action simplifiée ne peut pas être modifiée)
          let action = ctxAnalyse.actions
            .find(x => x.simplifiee === false && x.infinitif == verbe && x.ceci == ceci && x.cela == cela);
          // déterminer les instructions pour 'refuser', 'exécuter' ou 'terminer'
          if (action) {
            switch (motCle) {
              case 'refuser':
                action.verifications = AnalyseurBetaAction.testerRefuser(complement, phrase, ctxAnalyse);
                break;
              case 'exécuter':
                action.instructions = AnalyseurBetaInstructions.separerInstructions(complement, ctxAnalyse, phrase.ligne);
                break;
              case 'terminer':
                action.instructionsFinales = AnalyseurBetaInstructions.separerInstructions(complement, ctxAnalyse, phrase.ligne);
                break;

              default:
                console.error("xDescriptionAction >>> motCle pas gérée:", motCle);
                break;
            }
          } else {
            if (ctxAnalyse.verbeux) {
              console.error("Action pas trouvée: verbe:", verbe, "ceci:", ceci, "cela:", cela);
            }
            ctxAnalyse.ajouterErreur(phrase.ligne, "action pas trouvée : " + phrase.morceaux);
          }
          // action existante mise à jour
          return action;
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "complément manquant : " + phrase.morceaux);
          return null; // rien trouvé
        }
        // C. Nouvelle Action Simple
      } else {
        const resultActionSimple = ExprReg.xActionSimplifiee.exec(phrase.morceaux[0]);
        // Trouvé action simple
        if (resultActionSimple) {

          const verbe = resultActionSimple[1].toLocaleLowerCase();
          const prepCeci = resultActionSimple[2];
          const ceci = resultActionSimple[4] !== undefined;
          let complement = resultActionSimple[6];

          // si phrase morcelée, rassembler les morceaux
          if (phrase.morceaux.length > 1) {
            for (let index = 1; index < phrase.morceaux.length; index++) {
              complement += phrase.morceaux[index];
            }
          }

          let action = new Action(verbe, prepCeci, ceci, null, false);
          if (ceci) {
            action.cibleCeci = new CibleAction(resultActionSimple[3], resultActionSimple[4], resultActionSimple[5]);
          }

          action.instructions = AnalyseurBetaInstructions.separerInstructions(complement, ctxAnalyse, phrase.ligne);
          action.simplifiee = true;
          ctxAnalyse.actions.push(action);
          // Renvoyer la nouvelle action
          return action;
        } else {
          return null; // rien trouvé
        }
      }
    }
  }

  private static testerRefuser(complement: string, phrase: Phrase, ctxAnalyse: ContexteAnalyse) {
    let verification: Verification[] = [];

    // séparer les conditions avec le ";"
    const conditions = complement.split(';');

    conditions.forEach(cond => {
      let result = ExprReg.rRefuser.exec(cond.trim());
      if (result) {
        const typeRefuser = result[1]; // si uniquement pour l'instant
        const condition = AnalyseurCondition.getConditionMulti(result[2]);
        if (!condition || condition.nbErreurs) {
          ctxAnalyse.ajouterErreur(phrase.ligne, "condition : " + result[2]);
        }
        const instructions = AnalyseurBetaInstructions.separerInstructions(result[3], ctxAnalyse, phrase.ligne);
        verification.push(new Verification([condition], instructions));
      } else {
        console.error("testerRefuser: format pas reconu:", cond);
        ctxAnalyse.ajouterErreur(phrase.ligne, "refuser : " + cond);
      }
    });

    return verification;
  }

}