import { TypeValeur } from '../compilateur/type-valeur';

export class Propriete {

    constructor(
        public nom: string,
        public type: TypeValeur,
        public valeur: string,
    ) { }
}
