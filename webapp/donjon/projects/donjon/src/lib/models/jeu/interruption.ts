import { Choix } from "../compilateur/choix";
import { ContexteCommande } from "../jouer/contexte-commande";
import { ContexteTour } from "../jouer/contexte-tour";

export class Interruption {

  /** Tour pendant lequel l’interruption à eu lieu */
  public tour: ContexteTour | undefined;
  /** Commande à exécuter une fois que le choix a été fait */
  public commande: ContexteCommande | undefined;

  /** les choix possibles pour l’utilisateur (interruption choix) */
  public choix: Choix[] | undefined;
  /** le type de choix (libre, statique, dynamique) */
  // public typeChoix: TypeChoixInterruption = TypeChoixInterruption.aucun;
  /** le message à afficher à l’utilisateur (interruption attendre) */
  public messageAttendre: string | undefined;
  /** le nombre de secondes à attendre (interruption attendre) */
  public nbSecondesAttendre: number | undefined;

  constructor(
    /** Type d’interruption (attendre un choix, attendre une touche, attendre X secondes) */
    public typeInterruption: TypeInterruption,
    /** Type de contexte dans lequel l’interruption a eu lieu (tour de jeu, avant choix d’une commande, …) */
    public typeContexte: TypeContexte
  ) { }

}

export enum TypeContexte {
  /** Tour de jeu */
  tour = 't',
  /** Commande à exécuter */
  commande = 'c',
}

export enum TypeInterruption {
  /** Attendre un certain nombre de secondes */
  attendreSecondes = 's',
  /** Attendre une touche */
  attendreTouche = 't',
  /** Attendre un choix */
  attendreChoix = 'c',
  /** Attendre un choix libre */
  attendreChoixLibre = 'l',
}

// export enum TypeChoixInterruption {
//   /** Aucun choix */
//   aucun = 'a',
//   /** Choix libre */
//   libre = 'l',
//   /** Choix statiques */
//   statique = 's',
//   /** Choix dynamiques */
//   dynamique = 'd',
// }