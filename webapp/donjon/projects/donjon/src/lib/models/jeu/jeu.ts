import { Abreviation } from '../compilateur/abreviation';
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
import { ProgrammationTemps } from './programmation-temps';
import { RegleBeta } from '../compilateur/regle-beta';
import { RoutineSimple } from '../compilateur/routine-simple';
import { Statistiques } from './statistiques';
import { DeclenchementFutur, Sauvegarde } from '../jouer/sauvegarde';

export class Jeu {

  constructor() {

  }

  /** IFID du jeu (identifiant unique) */
  IFID: string | undefined;

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

  /** Le jeu est-il en pause ? */
  interrompu = false;

  /** Heure de début de la dernière interruption de la partie (millisecondes depuis 1/1/1970) */
  debutInterruption: number | undefined

  /** Heure de fin de la dernière interruption de la partie (millisecondes depuis 1/1/1970) */
  finInterruption: number | undefined

  /** Les erreurs qui doivent encore être affichées à l’utilisateur. */
  tamponErreurs: string[] = [];

  /** Les conseils qui doivent encore être affichés au créateur (si le débogueur est actif) */
  tamponConseils: string[] = [];

  /** Les erreurs qui doivent encore être affichées à l’utilisateur. */
  tamponInterruptions: Interruption[] = [];

  /** Les routines simples qui attendent d’être exécutées (elle ne le sont qu’entre 2 tours de jeu) */
  tamponRoutinesEnAttente: RoutineSimple[] = [];

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
  regles: RegleBeta[] = [];

  /** Compteurs ajoutés au jeu */
  compteurs: Compteur[] = [];

  /** Listes ajoutées au jeu */
  listes: Liste[] = [];

  /** Actions ajoutées au jeu. */
  actions: Action[] = [];

  /** Routines simples ajoutées au  jeu */
  routines: RoutineSimple[] = [];

  /** Les abréviations pour les commandes du jeu */
  abreviations: Abreviation[] = [];

  /** Fiches d'aides */
  aides: Aide[] = [];

  /** Paramètres spécifiques au jeu */
  parametres: Parametres = new Parametres();

  /** Programmations de routines (basée sur un décompte en millisecondes) */
  programmationsTemps: ProgrammationTemps[] = [];

  /** 
   * Graine utilisée pour initialiser le générateur de nombres aléatoires.
   * Lorsqu'on sauvegarde la partie, au sauvegarde également la graine.
   * (sauvegarde V1)
   */
  graine: string | undefined;

  /**
   * Liste des routines programmées pas encore déclenchées.
   * (sauvegarde V2)
   */
  get declenchementsFuturs(): DeclenchementFutur[] {
    let retVal = [];
    const tempsActuel = Date.now();
    this.programmationsTemps.forEach(pt => {
      let curDec = new DeclenchementFutur();
      curDec.routine = pt.routine;
      // calculer le temps restant avant déclenchement
      curDec.tempsMs = pt.duree - (tempsActuel - pt.debutTemps)

      retVal.push(curDec);
    });
    return retVal;
  };

  /**
   * Statistiques du jeu et de son scénario.
   */
  statistiques: Statistiques | undefined;

  /** Sauvegarde à charger au début de la prochaine partie. */
  sauvegarde: Sauvegarde | undefined;

  ajouterErreur(erreur: string) {
    console.error(erreur);
    this.tamponErreurs.push(erreur);
  }

}