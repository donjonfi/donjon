import { Choix } from "../compilateur/choix";
import { ChoixEcran } from "../jouer/contexte-ecran";
import { ContexteCommande } from "../jouer/contexte-commande";
import { ContexteTour } from "../jouer/contexte-tour";
import { QuestionCommande, QuestionsCommande } from "../jouer/questions-commande";

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
  /** le nombre de tours à annuler (interruption annuler tour) */
  public nbToursAnnuler: number | undefined;
  /** écran à afficher (interruption changer écran) */
  public ecran: ChoixEcran | undefined;
  /*** questions concernant la dernière commande (interruption question commande) */
  public questionsCommande: QuestionsCommande | undefined;
  public derniereQuestion: QuestionCommande | undefined;

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
  /** Routine simple */
  routine = 'r',
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
  /** Annuler 1 tour de jeu (ou plus) */
  annulerTour = 'a',
  /** Changer l’écran affiché (principal, secondaire, temporaire) */
  changerEcran = 'e',
  /** Question concernant la dernière commande entrée */
  questionCommande = 'q',
}
