import { Action } from './action';
import { Aide } from '../commun/aide';
import { Monde } from './monde';
import { Regle } from './regle';

export class ResultatCompilation {

    monde: Monde;
    regles: Regle[];
    actions: Action[];
    aides: Aide[];
    erreurs: string[];

}