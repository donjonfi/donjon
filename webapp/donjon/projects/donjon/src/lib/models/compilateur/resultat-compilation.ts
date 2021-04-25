import { Action } from './action';
import { Aide } from '../commun/aide';
import { Compteur } from './compteur';
import { ElementGenerique } from './element-generique';
import { Monde } from './monde';
import { Parametres } from '../commun/parametres';
import { Regle } from './regle';

export class ResultatCompilation {

    monde: Monde;
    regles: Regle[];
    actions: Action[];
    aides: Aide[];
    compteurs: ElementGenerique[]
    erreurs: string[];
    parametres: Parametres;

}