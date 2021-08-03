import { ConditionSolo } from "./condition-solo";
import { LienCondition } from "./lien-condition";

export class ConditionMulti {
  /** Condition simple (sans enfants) */
  condition: ConditionSolo;
  /** Lien exact de cette condition par rapport à son frère ainé */
  lienFrereAine: LienCondition;
  /** Conditions (enfants) qui composent cette condition */
  sousConditions: ConditionMulti[];
  /** Type de lien des enfants de cette conditions: et|ou|soit */
  typeLienSousConditions: LienCondition
  /** Résultat de cette condition */
  resultat: boolean = null;
}