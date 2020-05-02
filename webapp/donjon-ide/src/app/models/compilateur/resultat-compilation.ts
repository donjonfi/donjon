import { Action } from './action';
import { Monde } from './monde';
import { Regle } from './regle';

export class ResultatCompilation {

    monde: Monde;
    regles: Regle[];
    actions: Action[];
    erreurs: string[];

}