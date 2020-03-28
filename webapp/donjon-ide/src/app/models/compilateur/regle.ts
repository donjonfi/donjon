import { TypeRegle } from './type-regle';

export class Regle {

    constructor(
        public typeRegle: TypeRegle,
        public cause: string,
        public consequence: string,
    ) { }
}
