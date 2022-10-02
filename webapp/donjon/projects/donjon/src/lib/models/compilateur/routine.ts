import { BlocInstructions } from "./bloc-instructions";

export class Routine extends BlocInstructions {

  constructor(
    /** Type de routine (routine, action, réaction, règle, …) */
    public type: ERoutine,
    /** Ligne du scénario contenant le début du bloc */
    public debut: number,
    /** Le bloc est-il toujours ouvert ? */
    public ouvert: boolean = true
  ) {
    super();
  }

  /** Ligne du scénario contenant la fin du bloc */
  public fin: number;
  /** Le bloc est-il correctement fini (avec un fin bloc) */
  public correctementFini: boolean = false;

  /**
   * Titre de la routine (utilisé pour les messages d’erreur affichés au créateur).
   */
  public get titre(): string {
    throw new Error("Not implemented. Must be overridden");
  }

  /**
   * Convertir une chaîne de caractères en ERoutine
   */
  public static ParseType(type: string): ERoutine | undefined {
    switch (type.toLocaleLowerCase()) {

      case 'routine':
        return ERoutine.simple

      case 'action':
        return ERoutine.action

      case 'règle':
      case 'régle':
      case 'regle':
        return ERoutine.regle

      case 'réaction':
      case 'réactions':
      case 'reaction':
      case 'reactions':
      case 'rèaction':
      case 'rèactions':
        return ERoutine.reaction

      default:
        return undefined;
    }
  }

  /** Afficher le mot clé du type de routine spécifié. */
  public static TypeToMotCle(type: ERoutine | undefined, determinantDefini: boolean): string {
    switch (type) {
      case ERoutine.simple:
        return (determinantDefini ? 'la ' : '') + 'routine';
      case ERoutine.action:
        return (determinantDefini ? 'l’' : '') + 'action';
      case ERoutine.reaction:
        return (determinantDefini ? 'la ' : '') + 'réaction';
      case ERoutine.regle:
        return (determinantDefini ? 'la ' : '') + 'règle';

      case ERoutine.aucun:
        return '-';

      case ERoutine.inconnue:
        return '?';

      case undefined:
        return '';

      default:
        return '(type routine inconnu)';
    }
  }


  /** Afficher le nom du type de routine spécifié. */
  public static TypeToNom(type: ERoutine | undefined): string {
    switch (type) {
      case ERoutine.simple:
        return 'routine simple';
      case ERoutine.action:
        return 'action';
      case ERoutine.reaction:
        return 'réaction';
      case ERoutine.regle:
        return 'règle';

      case ERoutine.aucun:
        return '-';

      case ERoutine.inconnue:
        return '?';

      case undefined:
        return '';

      default:
        return '(type routine inconnu)';
    }
  }
}

/**
 * Bloc dans lequel se trouve la phrase.
 */
export enum ERoutine {
  /** Inconnu */
  inconnue = 0,
  /** Aucun */
  aucun = 1,
  /** Routine simple */
  simple = 2,
  /** Routine « action » */
  action = 3,
  /** Routine « règle » */
  regle = 4,
  /** Routine « réaction » */
  reaction = 5,

}

