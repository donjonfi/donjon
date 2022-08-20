import { Abreviation } from './abreviation';
import { Action } from './action';
import { Aide } from '../commun/aide';
import { ElementGenerique } from './element-generique';
import { MessageAnalyse } from './message-analyse';
import { Monde } from './monde';
import { Parametres } from '../commun/parametres';
import { Regle } from '../../interfaces/compilateur/regle';
import { RoutineSimple } from './routine-simple';
import { Statistiques } from '../jeu/statistiques';

export class ResultatCompilation {

    monde: Monde;
    routines: RoutineSimple[];
    regles: Regle[];
    actions: Action[];
    abreviations: Abreviation[];
    aides: Aide[];
    compteurs: ElementGenerique[]
    listes: ElementGenerique[]
    erreurs: string[];
    messages: MessageAnalyse[];
    parametres: Parametres;
    statistiques: Statistiques;

}