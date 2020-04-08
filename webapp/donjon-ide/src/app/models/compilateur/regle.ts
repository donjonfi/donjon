import { Condition } from './condition';
import { Consequence } from './consequence';
import { TypeRegle } from './type-regle';

export class Regle {

  public consequences: Consequence[] = [];

    constructor(
        public typeRegle: TypeRegle,
        public condition: Condition,
        public consequencesBrutes: string,
    ) { }


}
