import { Choix } from "../compilateur/choix";
import { ContexteCommande } from "../jouer/contexte-commande";
import { ContexteTour } from "../jouer/contexte-tour";

export class Interruption {

  /** Tour pendant lequel l’interruption à eu lieu */
  public tour: ContexteTour | undefined;
  /** Commande à exécuter une fois que le choix a été fait */
  public commande: ContexteCommande | undefined;
  /** Choix possibles */
  public choix: Choix[] | undefined;

  constructor(
    /** Type d’interruption (attendre un choix, attendre une touche) */
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
  /** Attendre une touche */
  attendreTouche = 't',
  /** Attendre un choix */
  attendreChoix = 'c',
}