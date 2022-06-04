import { ExprReg } from "../compilation/expr-reg";

export class TexteUtils {

  /**
   * Remplacer les caractères d’échapement dans le texte par ceux d’origine.
   */
  static retrouverTexteOriginal(texteEncode: string): string {
    return texteEncode?.replace(ExprReg.xCaractereDebutCommentaire, ' "')
      .replace(ExprReg.xCaractereFinCommentaire, '" ')
      .replace(ExprReg.xCaractereRetourLigne, '\n')
      .replace(ExprReg.xCaracterePointVirgule, ';')
      .replace(ExprReg.xCaractereVirgule, ',')
  }

  /**
   * Enlever les guillemets dans le texte (qu’ils soient au format Donjon ou américain).
   */
  static enleverGuillemets(texteEncode: string, trim: boolean): string {
    let retVal = texteEncode?.replace(ExprReg.xCaractereDebutCommentaire, '')
      .replace(ExprReg.xCaractereFinCommentaire, '')
      .replace(/"/g, '');

    if (trim) {
      retVal = retVal?.trim();
    }
    return retVal;
  }

  /** Enlever les balises de style Donjon du texte */
  static enleverBalisesStyleDonjon(texte: string): string {
    return texte
      .replace(/\{\S\}/g, "") // {x}
      .replace(/\{\S/g, "")   // {x
      .replace(/\S\}/g, "");   // x}
  }

  /** Remplacer (demi-)espaces insécables par un espace classique. */
  static remplacerEspacesInsecables(texte: string): string {
    return texte
      .replace(/ | /g, " ");
  }

  /** Enlever les balises conditionnelles (entre [ ] ) */
  static enleverBalisesConditionnelles(texte: string): string {
    return texte
      .replace(/\[.*?\]/g, "");
  }

}