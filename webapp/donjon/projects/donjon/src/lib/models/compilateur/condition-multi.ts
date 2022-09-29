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
  /** Nombre d’erreurs trouvées lors de l’analyse de la condition */
  nbErreurs = 0;
  /** Erreurs trouvées lors de l’analyse de la condition */
  erreurs: string[] = [];

  toString(): string {
    if (this.condition) {
      return this.condition.toString();
    } else {
      let retCond = "(";
      for (let index = 0; index < this.sousConditions.length; index++) {
        retCond += this.sousConditions[index].toString();
        if (index < this.sousConditions.length - 2) {
          retCond += this.typeLienSousConditions.toUpperCase() + " ";
        }
        index++;
      }
      retCond += ")";
      return retCond;
    }
  }
}