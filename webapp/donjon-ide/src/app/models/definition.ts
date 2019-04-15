import { Nombre } from './nombre.enum';

export class Definition {
    constructor(
        public intitule: string,
        public typeParent: string,
        public nombre: Nombre,
        public attributs: string[],
    ) { }
}
