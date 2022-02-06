import { Action } from '../compilateur/action';
import { Aide } from '../commun/aide';
import { Auditeur } from '../jouer/auditeur';
import { Classe } from '../commun/classe';
import { Compteur } from '../compilateur/compteur';
import { Interruption } from './interruption';
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
  titre: string | undefined;

  /** Auteur du jeu. */
  auteur: string | undefined;

  /** Auteurs du jeu. */
  auteurs: string | undefined;

  /** Titre du site web. */
  siteWebTitre: string | undefined;

  /** Lien du site web. */
  siteWebLien: string | undefined;

  /** Version du jeu. */
  version: string | undefined;

  /** sous-dossier qui contient les ressources du jeu (sous_dossier) */
  sousDossierRessources: string | undefined;

  /** dossier qui contient les ressources du jeu (./assets/ressources) */
  public static readonly dossierRessources = "./assets/ressources";

  /** Titre de la licence du jeu. */
  licenceTitre: string | undefined;

  /** Lien de la licence du jeu. */
  licenceLien: string | undefined;

  /** Le jeu est-il terminé ? */
  termine = false;

  /** Le jeu est-il déjà commencé ? */
  commence = false;

  /** Les erreurs qui doivent encore être affichées à l’utilisateur. */
  tamponErreurs: string[] = [];
  
  /** Les erreurs qui doivent encore être affichées à l’utilisateur. */
  tamponInterruptions: Interruption[] = [];

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