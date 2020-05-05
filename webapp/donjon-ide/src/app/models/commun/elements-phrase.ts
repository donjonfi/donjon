import { GroupeNominal } from './groupe-nominal';

export class ElementsPhrase {

  static readonly xDeterminantsArticles = /(le |la |les |l'|l’|un |une |des |du |de la )/i;
  static readonly xDeterminantsAdjectifsPossessifs = /(son |sa |ses |leur |leurs )/i;
  static readonly xPronomsPersonnels = /(il |elle |ils |elles )/i;
  static readonly xPronomsDemonstratif = /(ce |c’|c')/i;
  static readonly xDeterminantsEtPronoms = /(le |la |les |l'|l’|un |une |des |du |de la |son |sa |ses |leur |leurs |il |elle |ils |elles |ce |c’|c')/i;

  public infinitif: string;
  public sujetComplement: GroupeNominal;
  public preposition: string;

  constructor(
    public sujet: GroupeNominal,
    public verbe: string,
    public negation: string,
    public complement: string
  ) { }

}
