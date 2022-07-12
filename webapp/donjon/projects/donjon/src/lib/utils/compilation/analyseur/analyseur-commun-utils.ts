import { ExprReg } from "../expr-reg";

export class AnalyseurCommunUtils {

  /** Nettoyer l’instruction (guillemets, espaces multiples, point, …) */
  public static nettoyerInstruction(instruction: string): string {
    // NETTOYER INSTRUCTION
    let insBruNettoyee = instruction
      .trim()
      // convertir marque commentaire
      .replace(ExprReg.xCaractereDebutCommentaire, ' "')
      .replace(ExprReg.xCaractereFinCommentaire, '" ')
      // enlever les espaces multiples
      .replace(/( +)/g, " ");
    // enlever le point final ou le point virgule final)
    if (insBruNettoyee.endsWith(';') || insBruNettoyee.endsWith('.')) {
      insBruNettoyee = insBruNettoyee.slice(0, insBruNettoyee.length - 1);
    }

    return insBruNettoyee;
  }

}
