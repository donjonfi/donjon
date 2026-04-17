import { RechercheUtils } from "../../utils/commun/recherche-utils";

export class GroupeNominal {

  static readonly xDeterminantsArticles = /(le |la |les |l'|l\u2019|un |une |des |du |de la |de l(?:’|'))/i;
  static readonly xDeterminantsAdjectifsPossessifs = /(son |sa |ses |leur |leurs )/i;
  static readonly xPronomsPersonnels = /(il |elle |ils |elles )/i;
  static readonly xPronomsDemonstratif = /(ce |c\u2019|c')/i;

  static readonly xDeterminantsEtPronoms = /(le |la |les |l'|l\u2019|un |une |des |du |de la |de l(?:’|')|son |sa |ses |leur |leurs |il |elle |ils |elles |ce |c\u2019|c')/i;

  /**
   * - sur(1) la(2) table(3) basse(4)
   * - dans(1) le(2) bateau(3) rouge(4)
   * - la(2) canne à pèche(2)
   * - => préposition(1) déterminant article(2) nom(3) épithète(4).
   */
  static readonly xPrepositionDeterminantArticleNomEpithete = /^(?!")(?:(dans|sur|sous|vers) )?(le |la |l(?:’|')|les |un |une |d\u2019|d'|des |du |de la |de l(?:’|')|\d+)?(\S+?|(?:\S+? (?:(?:(?:à|dans|et|sous|sur|vers) (?:la |le |les |l’|'))|de (?:la |l'|l\u2019)?|du |des |d'|d\u2019|à |au(?:x)? |en |qui |sans )\S+?))(?:(?: )(?!\(|ne |n\u2019|n'|d\u2019|d'|et |un |de )(\S+))?$$/i;

  /** Mots clés correspondants au groupe nominal (pour effectuer une recherche) */
  private _motsCles: string[];

  // un groupe nominal peut-être composé :
  // - [déterminant +] nom [+ épithète]
  // - pronom (mais pas encore géré ici)
  public constructor(
    /** Déterminant */
    public determinant: string,
    /** Nom */
    public nom: string,
    /** Épithète */
    public epithete: string = null
  ) { }

  public toString(): string {

    let retVal: string
    let determinant = this.determinant ?? '';
    let epithete = (this.epithete ? (" " + this.epithete) : "");
    retVal = determinant + this.nom + epithete;
    return retVal;
  }

  /**
   * Renvoie une chaine avec le nom et l’épithète (sans le déterminant).
   */
  public get nomEpithete(): string {
    let retVal: string
    let epithete = (this.epithete ? (" " + this.epithete) : "");
    retVal = this.nom + epithete;
    return retVal;
  }

  /** Transformer l’intitulé en mots clés (afin d’effectuer une recherche) */
  public get motsCles(): string[] {
    if (!this._motsCles) {
      this._motsCles = RechercheUtils.nettoyerEtTransformerEnMotsCles(this.nomEpithete);
    }
    return this._motsCles;
  }

}
