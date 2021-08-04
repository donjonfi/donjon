import { ConditionMulti } from './condition-multi';
import { Instruction } from './instruction';

export class Verification {

  constructor(

    public conditions: ConditionMulti[],
    public resultats: Instruction[]
  ) { }

}
