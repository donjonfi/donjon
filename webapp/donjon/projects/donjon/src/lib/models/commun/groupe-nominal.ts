import { RechercheUtils } from "../../utils/commun/recherche-utils";
import { decomposerGroupeNominal } from "./gn-fragments";

export class GroupeNominal {

  static readonly xDeterminantsArticles = /(le |la |les |l'|l\u2019|un |une |des |du |de la |de l(?:'|\u2019))/i;
  static readonly xDeterminantsAdjectifsPossessifs = /(son |sa |ses |leur |leurs )/i;
  static readonly xPronomsPersonnels = /(il |elle |ils |elles )/i;
  static readonly xPronomsDemonstratif = /(ce |c'|c\u2019)/i;

  static readonly xDeterminantsEtPronoms = /(le |la |les |l'|l\u2019|un |une |des |du |de la |de l(?:'|\u2019)|son |sa |ses |leur |leurs |il |elle |ils |elles |ce |c'|c\u2019)/i;

  /**
   * - sur(1) la(2) table(3) basse(4)
   * - dans(1) le(2) bateau(3) rouge(4)
   * - la(2) canne à pèche(2)
   * - => préposition(1) déterminant article(2) nom(3) épithète(4).
   */
  static readonly xPrepositionDeterminantArticleNomEpithete = /^(?!")(?:(dans|sur|sous|vers) )?(le |la |l(?:'|\u2019)|les |un |une |d'|d\u2019|des |du |de la |de l(?:'|\u2019)|\d+)?(\S+?|(?:\S+? (?:(?:(?:à|dans|et|sous|sur|vers) (?:la |le |les |l'|\u2019))|de (?:la |l'|l\u2019)?|du |des |d'|d\u2019|à |au(?:x)? |en |qui |sans )\S+?))(?:(?: )(?!\(|ne |n'|n\u2019|d'|d\u2019|et |un |de )(\S+))?$$/i;

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
    /**
     * Épithète POSTPOSÉE (après le nom). Peut être coordonnée (« rouge et blanc »).
     * Pour une {@link CibleAction} de classe, ce champ porte la liste d’états brute.
     */
    public epithete: string = null,
    /** Attributs ANTÉPOSÉS (avant le nom), dans l’ordre. Ex. « grand » dans « le grand chat poilu ». */
    public epithetesAvant: string[] = []
  ) { }

  /**
   * Décompose un intitulé brut en groupe nominal (déterminant, attributs avant, nom, attribut après).
   * Remplace l’usage direct des regex `xGroupeNominal*` : gère l’attribut antéposé et les attributs
   * postposés coordonnés.
   * @returns le groupe nominal, ou undefined si la chaîne ne ressemble pas à un groupe nominal.
   */
  public static analyser(intituleBrut: string, options?: { indefini?: boolean, forcerMinuscules?: boolean }): GroupeNominal | undefined {
    const deco = decomposerGroupeNominal(intituleBrut, options?.indefini ?? false, options?.forcerMinuscules ?? false);
    if (!deco) { return undefined; }
    // déterminant: undefined si absent (comme l’ancien getGroupeNominalDefini) ; epithete → null via défaut du constructeur.
    return new GroupeNominal(deco.determinant, deco.nom, deco.epithete, deco.epithetesAvant);
  }

  private get fragmentAvant(): string {
    return (this.epithetesAvant && this.epithetesAvant.length) ? (this.epithetesAvant.join(' ') + ' ') : '';
  }

  public toString(): string {
    const determinant = this.determinant ?? '';
    const epithete = (this.epithete ? (" " + this.epithete) : "");
    return determinant + this.fragmentAvant + this.nom + epithete;
  }

  /**
   * Renvoie une chaine avec les attributs antéposés, le nom et l’épithète postposée (sans le déterminant).
   */
  public get nomEpithete(): string {
    const epithete = (this.epithete ? (" " + this.epithete) : "");
    return this.fragmentAvant + this.nom + epithete;
  }

  /** Transformer l’intitulé en mots clés (afin d’effectuer une recherche) */
  public get motsCles(): string[] {
    if (!this._motsCles) {
      this._motsCles = RechercheUtils.nettoyerEtTransformerEnMotsCles(this.nomEpithete);
    }
    return this._motsCles;
  }

}
