import { AnalyseurCommunUtils } from "./analyseur-commun-utils";
import { Instruction } from "../../../models/compilateur/instruction";
import { Phrase } from "../../../models/compilateur/phrase";

export class AnalyseurV8Instructions {

  /**
   * Traiter l'instruction qui devrait correspondre à la phrochaine phrase.
   * @returns true si une instruction a effectivement été trouvée.
   */
  public static traiterInstruction(phrase: Phrase, instructions: Instruction[]): boolean {

    let retVal: boolean;

    let instructionBrute = this.retrouverInstruction(phrase);
    let instructionDecomposee = AnalyseurCommunUtils.decomposerInstructionSimple(instructionBrute);

    // instruction simple a été trouvée
    if (instructionDecomposee) {
      let instruction = AnalyseurCommunUtils.creerInstructionSimple(instructionDecomposee);
      instructions.push(instruction)
      retVal = true;
      // instruction PAS correctement décomposée
    } else {
      retVal = false;
    }
    return retVal;
  }

  public static retrouverInstruction(phrase: Phrase): string {
    let resultat = "";
    phrase.morceaux.forEach(morceau => {
      resultat += morceau;
    });
    resultat = AnalyseurCommunUtils.nettoyerInstruction(resultat);
    return resultat;
  }

  public static ressembleInstruction(instruction: string): boolean {
    return true;
  }

}