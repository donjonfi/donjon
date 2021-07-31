import { LienCondition } from "./lien-condition";

export class ConditionDecomposee {
  public lien: LienCondition = LienCondition.aucun;
  public conditionBrute: string = null;
  // public sousConditionsBrutes: string[];
  public tokensCondition: string[] = null;
  
  public sousConditions: ConditionDecomposee[];

}