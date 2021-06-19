import { TypeValeur } from '../compilateur/type-valeur';

export class ProprieteElement {

    constructor(
        public nom: string,
        public type: TypeValeur,
        public valeur: string,
    ) { }
}
