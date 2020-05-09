import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { Instruction } from './instruction';
import { TypeRegle } from './type-regle';

export class Regle {

  public instructions: Instruction[] = [];

    constructor(
        public typeRegle: TypeRegle,
        public condition: Condition,
        public consequencesBrutes: string,
    ) { }


}
