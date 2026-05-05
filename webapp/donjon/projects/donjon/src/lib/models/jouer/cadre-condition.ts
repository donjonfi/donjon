import type { ConditionDebutee } from "./statut-conditions";

/**
 * Un cadre représente un niveau d’imbrication d’une construction conditionnelle
 * dans un texte dynamique (`[si …]`, `[Xe fois]`, `[au hasard]`, `[en boucle]`,
 * `[initialement]`). La pile de cadres permet d’imbriquer ces constructions.
 */
export class CadreCondition {

  /** La branche courante de ce cadre doit-elle être affichée ? */
  public brancheVisible = false;

  /** Pour [si] : le « si » qui précède le sinon était-il vrai ? */
  public siVrai = false;

  /** Pour [Xe fois] : un des Xe fois rencontrés était-il validé ? */
  public siFois = false;

  public choixAuHasard = -1;
  public dernIndexChoix = -1;
  public plusGrandChoix = -1;
  public nbChoix = -1;

  constructor(
    public type: ConditionDebutee,
    /** Index du morceau d’ouverture dans `statut.morceaux`. */
    public indexOuverture: number,
  ) { }
}
