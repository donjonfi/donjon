export class GroupeNominal {

  static readonly xDeterminantsArticles = /(le |la |les |l'|l’|un |une |des |du |de la )/i;
  static readonly xDeterminantsAdjectifsPossessifs = /(son |sa |ses |leur |leurs )/i;
  static readonly xPronomsPersonnels = /(il |elle |ils |elles )/i;
  static readonly xPronomsDemonstratif = /(ce |c’|c')/i;
  static readonly xDeterminantsEtPronoms = /(le |la |les |l'|l’|un |une |des |du |de la |son |sa |ses |leur |leurs |il |elle |ils |elles |ce |c’|c')/i;

  static readonly xDeterminantArticheNomEpithete = /^(le |la |les |l'|l’|un |une |des |du |de la )(\S+)(?: (\S+)|)$/i;

  // un groupe nominal peut-être composé :
  // - [déterminant +] nom [+ épithète]
  // - pronom (mais pas encore géré ici)

  constructor(
    /** Déterminant */
    public determinant: string,
    /** Nom */
    public nom: string,
    /** Épithète */
    public epithete: string = null
  ) { }

}
