import { Action } from '../compilateur/action';
import { Aide } from '../commun/aide';
import { Auditeur } from '../jouer/auditeur';
import { Classe } from '../commun/classe';
import { Compteur } from '../compilateur/compteur';
import { Lieu } from './lieu';
import { Liste } from './liste';
import { ListeEtats } from '../../utils/jeu/liste-etats';
import { Objet } from './objet';
import { Parametres } from '../commun/parametres';
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

  /** Titre du site web. */
  siteWebTitre: string;

  /** Lien du site web. */
  siteWebLien: string;

  /** Version du jeu. */
  version: string;

  /** Titre de la licence du jeu. */
  licenceTitre: string;

  /** Lien de la licence du jeu. */
  licenceLien: string;

  /** Le jeu est-il terminé ? */
  termine = false;

  /** Le jeu est-il déjà commencé ? */
  commence = false;

  classes: Classe[] = [];

  etats: ListeEtats = new ListeEtats();

  /** Lieux qui constituent le jeu. */
  lieux: Lieu[] = [];

  /** Objet qui représente le joueur. */
  joueur: Objet;

  /** Tous les objets du jeu */
  objets: Objet[] = [];

  /** Prochain ID disponible pour un élément du jeu. */
  nextID: number = 1;

  /** Un auditeur écoute un évènement en particulier.
   * Lorsque l'évènement se déclenche, on exécute les actions
   * de l'auditeur.
   */
  auditeurs: Auditeur[] = [];

  /** Règles ajoutées au jeu. */
  regles: Regle[] = [];

  /** Compteurs ajoutés au jeu */
  compteurs: Compteur[] = [];

  /** Listes ajoutées au jeu */
  listes: Liste[] = [];

  /** Actions ajoutées au jeu. */
  actions: Action[] = [];

  /** Fiches d'aides */
  aides: Aide[] = [];

  /** Paramètres spécifiques au jeu */
  parametres: Parametres = new Parametres();

}