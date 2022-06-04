import { Abreviation } from './abreviation';
import { Action } from './action';
import { Aide } from '../commun/aide';
import { ElementGenerique } from './element-generique';
import { Monde } from './monde';
import { Parametres } from '../commun/parametres';
import { Regle } from './regle';
import { Statistiques } from '../jeu/statistiques';

export class ResultatCompilation {

    monde: Monde;
    regles: Regle[];
    actions: Action[];
    abreviations: Abreviation[];
    aides: Aide[];
    compteurs: ElementGenerique[]
    listes: ElementGenerique[]
    erreurs: string[];
    parametres: Parametres;
    statistiques: Statistiques;

}