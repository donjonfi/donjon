import { AnalyseurV8Definitions } from "./analyseur-v8.definitions";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ERoutine } from "../../../models/compilateur/routine";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { Verificateur } from "../verificateur";

export class AnalyseurV8 {

  /**
 * Analyser les phrases fournies et ajouter les résultats dans le contexte de l’analyse.
 * @param phrases phrases à analyser.
 * @param ctx contexte de l’analyse.
 */
  public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    while (ctx.indexProchainePhrase < phrases.length) {
      const phraseAnalysee = phrases[ctx.indexProchainePhrase];
      // début d'un bloc ?
      if (Verificateur.estNouvelleRoutine(phraseAnalysee, ctx)) {
        if (ctx.verbeux) {
          console.log(`[AnalyseurV8] l.${phraseAnalysee.ligne}: trouvé début bloc (${phraseAnalysee})`);
        }
        // traiter le bloc
        AnalyseurV8.traiterRoutine(phrases, ctx);
        // sinon traiter définition
      } else {
        AnalyseurV8.traiterDefinition(phraseAnalysee, ctx);
      }
    }
  }


  /**
   * Traiter la définition qui devrait correspondre à la prochaine phrase.
   * @return true si une définition a effectivement été trouvée.
   */
  public static traiterDefinition(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    let definitionTrouvee: boolean;
    let elementTrouve: ResultatAnalysePhrase = AnalyseurV8Definitions.TesterDefinition(phrase, ctx);
    if (elementTrouve !== ResultatAnalysePhrase.aucun) {
      if (ctx.verbeux) {
        console.log(`[AnalyseurV8] l.${phrase.ligne}: définition trouvée (${phrase})`);
      }
      definitionTrouvee = true;
    } else {
      if (ctx.verbeux) {
        console.warn(`[AnalyseurV8] l.${phrase.ligne}: pas trouvé de définition (${phrase})`);
      }
      definitionTrouvee = false;
    }
    ctx.indexProchainePhrase++;
    return definitionTrouvee;
  }

  /**
 * Traiter l'instruction qui devrait correspondre à la phrochaine phrase.
 * @return true si une instruction a effectivement été trouvée.
 */
  public static traiterInstruction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    ctx.indexProchainePhrase++;
    return true;
  }

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @return true si une routine a effectivement été trouvée.
   */
  public static traiterRoutine(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {

    let retVal = false;

    switch (ctx.derniereRoutine.type) {
      case ERoutine.action:
        retVal = this.traiterRoutineAction(phrases, ctx);
        break;

      case ERoutine.reaction:
        retVal = this.traiterRoutineReaction(phrases, ctx);
        break;

      case ERoutine.regle:
        retVal = this.traiterRoutineRegle(phrases, ctx);
        break;

      case ERoutine.routine:
        retVal = this.traiterRoutineRoutine(phrases, ctx);
        break;

      default:
        throw new Error(`[traiterRoutine] type de routine non pris en charge: ${ctx.derniereRoutine.type}`);
    }

    ctx.indexProchainePhrase++;
    return true;
  }


  private static traiterRoutineAction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }

  private static traiterRoutineReaction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }


  private static traiterRoutineRegle(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }

  private static traiterRoutineRoutine(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }

  /**
   * Traiter le bloc contrôle qui devrait commencer à la prochaine phrase.
   * @return true si une instruction a effectivement été trouvée.
   */
  public static traiterBlocControle(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    ctx.indexProchainePhrase++;
    return true;
  }

  // /**
  //   * Ajouter la phrase fournie et ajouter les résultats dans le contexte de l’analyse.
  //   * @param phrase phrase à analyser.
  //   * @param ctx contexte de l’analyse.
  //   */
  // public static analyserPhrase(phrase: Phrase, ctx: ContexteAnalyse): ResultatAnalysePhrase {
  //   let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

  //   return elementTrouve;
  // }

}