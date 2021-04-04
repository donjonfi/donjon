import { Action } from "../../../models/compilateur/action";
import { AnalyseurConsequences } from "./analyseur.consequences";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Verification } from "../../../models/compilateur/verification";

export class AnalyseurAction {

  /**
 * Rechercher une description d’action
 * @param actions actions déjà trouvées.
 * @param phrase phrase à analyser.
 * @param erreurs liste des erreurs.
 */
  // public static testerAction(actions: Action[], phrase: Phrase, erreurs: string[], verbeux: boolean) {
  public static testerAction(phrase: Phrase, ctxAnalyse: ContexteAnalyse) {

    const result = ExprReg.xAction.exec(phrase.phrase[0]);
    // A. Nouvelle action complète
    if (result !== null) {
      const verbe = result[1].toLocaleLowerCase();
      const ceci = result[3] === 'ceci';
      const cela = result[5] === 'cela';
      let action = new Action(verbe, ceci, cela);
      // concerne un élément ?
      if (ceci) {
        action.cibleCeci = new GroupeNominal(result[6], result[7], result[8]);
        // concerne également un 2e élément ?
        if (cela) {
          if (result[6] === 'deux') {
            action.cibleCela = new GroupeNominal(result[6], result[7], result[8]);
          } else {
            action.cibleCela = new GroupeNominal(result[9], result[10], result[11]);
          }
        }
      }
      ctxAnalyse.actions.push(action);
      // renvoyer la nouvelle action complète
      return action;
    } else {
      // B. Suite de la description d’une action existante
      let resultDescriptionAction = ExprReg.xDescriptionAction.exec(phrase.phrase[0]);
      if (resultDescriptionAction) {
        const motCle = resultDescriptionAction[1].toLocaleLowerCase();
        const verbe = resultDescriptionAction[2].toLocaleLowerCase();
        const ceci = resultDescriptionAction[3] === 'ceci';
        const cela = resultDescriptionAction[4] === 'cela';
        let complement = resultDescriptionAction[5];
        // si phrase morcelée, rassembler les morceaux
        if (phrase.phrase.length > 1) {
          for (let index = 1; index < phrase.phrase.length; index++) {
            complement += phrase.phrase[index];
          }
        }
        complement = complement.trim();
        // retrouver l'action correspondante
        let action = ctxAnalyse.actions.find(x => x.infinitif === verbe && x.ceci == ceci && x.cela == cela);
        // déterminer les instructions pour 'refuser', 'exécuter' ou 'terminer'
        if (action) {
          switch (motCle) {
            case 'refuser':
              action.verificationsBrutes = complement;
              action.verifications = AnalyseurAction.testerRefuser(complement, phrase, ctxAnalyse.erreurs);
              break;
            case 'exécuter':
              action.instructionsBrutes = complement;
              action.instructions = AnalyseurConsequences.separerConsequences(complement, ctxAnalyse.erreurs, phrase.ligne);
              break;
            case 'terminer':
              action.instructionsFinalesBrutes = complement;
              action.instructionsFinales = AnalyseurConsequences.separerConsequences(complement, ctxAnalyse.erreurs, phrase.ligne);
              break;

            default:
              console.error("xDescriptionAction >>> motCle pas gérée:", motCle);
              break;
          }

        } else {
          if (ctxAnalyse.verbeux) {
            console.error("Action pas trouvée: verbe:", verbe, "ceci:", ceci, "cela:", cela);
          }
          ctxAnalyse.erreurs.push(("0000" + phrase.ligne).slice(-5) + " : action pas trouvée : " + phrase.phrase);
        }
        // action existante mise à jour
        return action;
        // C. Nouvelle Action Simple
      } else {
        const resultActionSimple = ExprReg.xActionSimple.exec(phrase.phrase[0]);
        // Trouvé action simple
        if (resultActionSimple) {

          const verbe = resultActionSimple[1].toLocaleLowerCase();
          const ceci = resultActionSimple[3] !== undefined;
          let complement = resultActionSimple[5];

          // si phrase morcelée, rassembler les morceaux
          if (phrase.phrase.length > 1) {
            for (let index = 1; index < phrase.phrase.length; index++) {
              complement += phrase.phrase[index];
            }
          }

          let action = new Action(verbe, ceci, false);
          if (ceci) {
            action.cibleCeci = new GroupeNominal(resultActionSimple[2], resultActionSimple[3], resultActionSimple[4]);
          }

          action.instructions = AnalyseurConsequences.separerConsequences(complement, ctxAnalyse.erreurs, phrase.ligne);

          ctxAnalyse.actions.push(action);
          // Renvoyer la nouvelle action
          return action;
        } else {
          return null; // rien trouvé
        }
      }
    }
  }

  private static testerRefuser(complement: string, phrase: Phrase, erreurs: string[]) {
    let verification: Verification[] = [];

    // séparer les conditions avec le ";"
    const conditions = complement.split(';');

    conditions.forEach(cond => {
      let result = ExprReg.rRefuser.exec(cond.trim());
      if (result) {
        const typeRefuser = result[1]; // si uniquement pour l'instant
        const condition = PhraseUtils.getCondition(result[2]);
        if (!condition) {
          erreurs.push(("00000" + phrase.ligne).slice(-5) + " : condition : " + result[2]);
        }
        const consequences = AnalyseurConsequences.separerConsequences(result[3], erreurs, phrase.ligne);
        verification.push(new Verification([condition], consequences));
      } else {
        console.error("testerRefuser: format pas reconu:", cond);
        erreurs.push(("00000" + phrase.ligne).slice(-5) + " : refuser : " + cond);
      }
    });

    return verification;
  }

}