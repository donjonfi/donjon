import { GroupeNominal } from './groupe-nominal';
import { ProprieteJeu } from '../jeu/propriete-jeu';

export class ElementsPhrase {

  static readonly xDeterminantsArticles = /(le |la |les |l'|l’|un |une |des |du |de la |de l(?:’|'))/i;
  static readonly xDeterminantsAdjectifsPossessifs = /(son |sa |ses |leur |leurs )/i;
  static readonly xPronomsPersonnels = /(il |elle |ils |elles )/i;
  static readonly xPronomsDemonstratif = /(ce |c’|c')/i;
  static readonly xDeterminantsEtPronoms = /(le |la |les |l'|l’|un |une |des |du |de la |de l(?:’|')|son |sa |ses |leur |leurs |il |elle |ils |elles |ce |c’|c')/i;

  public proprieteSujet: ProprieteJeu | undefined;
  public proprieteComplement1: ProprieteJeu | undefined;

  public sujetComplement1: GroupeNominal | undefined;
  public sujetComplement2: GroupeNominal | undefined;
  public sujetComplement3: GroupeNominal | undefined;
  public sujetComplement4: GroupeNominal | undefined;

  public preposition0: string | undefined;
  public preposition1: string | undefined;
  public conjonction: string | undefined;
  public complement2: string | undefined;
  public complement3: string | undefined;
  public complement4: string | undefined;

  constructor(
    public infinitif?: string | undefined,
    public sujet?: GroupeNominal | undefined,
    public verbe?: string | undefined,
    public negation?: string | undefined,
    public complement1?: string | undefined
  ) { }

}
