import { ConditionSolo } from "./condition-solo";
import { LienCondition } from "./condition";

export class ConditionMulti {
  condition: ConditionSolo;
  sousConditions: ConditionMulti[];
  lienSousConditions: LienCondition
  resultat: boolean = null;
}