import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { TypeRegle } from './type-regle';

export class Regle {

  public instructions: ElementsPhrase[] = [];

    constructor(
        public typeRegle: TypeRegle,
        public condition: Condition,
        public consequencesBrutes: string,
    ) { }


}
