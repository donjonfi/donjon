import { CompilateurV8Utils } from "../compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
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
      if (Verificateur.estNouveauBlocPrincipal(phraseAnalysee, ctx)) {
        if (ctx.verbeux) {
          console.log(`[AnalyseurV8] l.${phraseAnalysee.ligne}: trouvé début bloc (${phraseAnalysee})`);
        }
        // traiter le bloc
        AnalyseurV8.traiterBloc(phrases, ctx);
        // sinon traiter définition
      } else {
        AnalyseurV8.traiterDefinition(phrases, ctx);
      }
    }
  }

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @return true si un bloc principal a effectivement été trouvée.
   */
  public static traiterBloc(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    return true;
  }

  /**
   * Traiter la définition qui devrait correspondre à la prochaine phrase.
   * @return true si une définition a effectivement été trouvée.
   */
  public static traiterDefinition(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    return true;
  }

  /**
   * Traiter l'instruction qui devrait correspondre à la phrochaine phrase.
   * @return true si une instruction a effectivement été trouvée.
   */
  public static traiterInstruction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    return true;
  }

  /**
   * Traiter le bloc contrôle qui devrait commencer à la prochaine phrase.
   * @return true si une instruction a effectivement été trouvée.
   */
  public static traiterBlocControle(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
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