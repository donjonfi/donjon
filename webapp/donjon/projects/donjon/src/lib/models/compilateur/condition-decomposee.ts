import { LienCondition } from "./lien-condition";

export class ConditionDecomposee {
  /** S’agit-il du début d’une condition (et non de la suite d’une condition) ? */
  public estDebutCondition: boolean = false;
  /** S’agit-il du frère cadet (dernière sous-condition de la liste) ? */
  public estFrereCadet: boolean = false;
  /** Lien de la condition avec son frère ainé */
  public lien: LienCondition = LienCondition.aucun;
  /** Condition brute */
  public conditionBrute: string = null;
  /** Condition décomposée en tokens */
  public tokensCondition: string[] = null;
  /** Type de lien entre les sous-conditions (et|ou|soit) */
  public typeLienSousConditions: LienCondition = null;
  /** Sous conditions */
  public sousConditions: ConditionDecomposee[];
}