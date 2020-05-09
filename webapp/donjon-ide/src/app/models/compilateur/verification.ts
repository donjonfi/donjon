import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { Instruction } from './instruction';

export class Verification {

  constructor(

    public conditions: Condition[],
    public resultats: Instruction[]
  ) { }

}
