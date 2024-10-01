import { ExprReg } from "../compilation/expr-reg";

export class TexteUtils {

  /**
   * Remplacer les caractères d’échappement dans le texte par ceux d’origine.
   */
  static retrouverTexteOriginal(texteEncode: string): string {
    return texteEncode
      // remettre les guillemets
      ?.replace(ExprReg.xCaractereDebutCommentaire, ' "')
      .replace(ExprReg.xCaractereFinCommentaire, '" ')
      // remettre les retours à la ligne
      .replace(ExprReg.xCaractereRetourLigne, '\n')
      // remettre les virgules, point virgules et deux points initiaux dans les textes
      .replace(ExprReg.xCaracterePointVirgule, ';')
      .replace(ExprReg.xCaractereVirgule, ',')
      .replace(ExprReg.xCaractereDeuxPointsDouble, ':');
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