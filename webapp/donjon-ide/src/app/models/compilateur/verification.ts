import { Condition } from './condition';
import { Instruction } from '../jouer/instruction';

export class Verification {

  constructor(

    public condition: Condition[],
    public resultatSiVerifiee: Instruction[]
  ) { }

}
