import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Phrase } from "../../../models/compilateur/phrase";

export class AnalyseurV8Instructions {

  /**
   * Traiter l'instruction qui devrait correspondre à la phrochaine phrase.
   * @returns true si une instruction a effectivement été trouvée.
   */
  public static traiterInstruction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    // passer à la phrase suivante
    ctx.indexProchainePhrase++;
    // TODO: analyse de l’instruction
    
    return true;
  }

}