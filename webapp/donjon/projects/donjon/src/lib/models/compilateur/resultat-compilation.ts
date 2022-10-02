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

  /** Le monde généré. */
  monde: Monde;
  /** Les routines simples trouvées. */
  routinesSimples: RoutineSimple[];
  /** Les règles trouvées. */
  regles: Regle[];
  /** Les actions trouvées. */
  actions: Action[];
  /** Les abréviations trouvées. */
  abreviations: Abreviation[];
  /** Les fiches d’aide trouvées. */
  aides: Aide[];
  /** Les compteurs trouvés. */
  compteurs: ElementGenerique[]
  /** Les listes trouvées. */
  listes: ElementGenerique[]
  /** @deprecated: Les erreurs trouvées. */
  erreurs: string[];
  /** Les messages émis lors de l’analyse (conseils, problèmes, erreurs). */
  messages: MessageAnalyse[];
  /** Les paramètres définis pour le jeu. */
  parametres: Parametres;
  /** Les statistiques de l’analyse. */
  statistiques: Statistiques;

}