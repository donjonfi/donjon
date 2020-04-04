import { Condition } from './condition';
import { TypeRegle } from './type-regle';

export class Regle {

    constructor(
        public typeRegle: TypeRegle,
        public condition: Condition,
        public consequence: string,
    ) { }
}
