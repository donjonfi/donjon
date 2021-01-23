export class BalisesHtml {

  /**
   * Retirer les tags HTML du texte et ajouter de noveaux tags HTML.
   */
  public static doHtml(texte: string): string {
    texte = BalisesHtml.retirerBalisesHtml(texte);
    texte = BalisesHtml.ajouterBalisesHtml(texte);
    return texte;
  }

  /**
   * Retirer les tags html du texte.
   */
  public static retirerBalisesHtml(texte: string): string {
    const retVal = texte.replace(/<[^>]*>/g, '');
    return retVal;
  }

  /**
   * Ajouter des tags HTML
   */
  public static ajouterBalisesHtml(texte: string): string {
    // italique: texte avec une partie en {/italique/} et le reste normal.
    let retVal = texte.replace(/\{\//g, '<i>');
    retVal = retVal.replace(/\/\}/g, '</i>');
    // gras: texte avec une partie en {*gras*} et le reste normal.
    retVal = retVal.replace(/\{\*/g, '<b>');
    retVal = retVal.replace(/\*\}/g, '</b>');
    // souligner. texte avec une partie {_soulignée_} et le reste normal.
    retVal = retVal.replace(/\{_/g, '<u>');
    retVal = retVal.replace(/_\}/g, '</u>');
    // texte DANGER {+texte+}
    retVal = retVal.replace(/\{\+/g, '<span class="text-danger">');
    retVal = retVal.replace(/\+\}/g, '</span>');
    // texte PRIMARY {-texte-}
    retVal = retVal.replace(/\{-/g, '<span class="text-primary">');
    retVal = retVal.replace(/-\}/g, '</span>');
    // nouvelle ligne {n} ou \n
    retVal = retVal.replace(/\{n\}/g, '<br>');
    retVal = retVal.replace(/\n/g, '<br>');
    // retrait {r} ou {t} (tabulation)
    retVal = retVal.replace(/\{r\}/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    retVal = retVal.replace(/\{t\}/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    // espace {e}
    retVal = retVal.replace(/\{e\}/g, ' ');
    return retVal;
  }

}