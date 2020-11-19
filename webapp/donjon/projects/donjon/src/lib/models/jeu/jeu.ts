import { Action } from '../compilateur/action';
import { Aide } from '../commun/aide';
import { Auditeur } from '../jouer/auditeur';
import { Classe } from '../commun/classe';
import { Lieu } from './lieu';
import { ListeEtats } from '../../utils/jeu/liste-etats';
import { Objet } from './objet';
import { Regle } from '../compilateur/regle';

export class Jeu {

  constructor() {

  }

  /** Titre du jeu. */
  titre: string;

  /** Auteur du jeu. */
  auteur: string;

  /** Auteurs du jeu. */
  auteurs: string;

  /** Version du jeu. */
  version: string;

  /** Titre de la licence du jeu. */
  licenceTitre: string;

  /** Lien de la licence du jeu. */
  licenceLien: string;

  /** Le jeu est-il terminé ? */
  termine = false;

  classes: Classe[] = [];

  etats: ListeEtats = new ListeEtats();

  /** Lieux qui constituent le jeu. */
  lieux: Lieu[] = [];

  /** Objet qui représente le joueur. */
  joueur: Objet;

  /** Tous les objets du jeu */
  objets: Objet[] = [];

  /** Un auditeur écoute un évènement en particulier.
   * Lorsque l'évènement se déclanche, on exécute les actions
   * de l'auditeur.
   */
  auditeurs: Auditeur[] = [];

  /** Règles ajoutées au jeu. */
  regles: Regle[] = [];

  /** Actions ajoutées au jeu. */
  actions: Action[] = [];

  /** États sauvegardés */
  sauvegardes: string[] = [];

  /** Fiches d'aides */
  aides: Aide[] = [];

}