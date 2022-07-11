export class Routine {

  constructor(
    /** Type de routine (routine, action, réaction, règle, …) */
    public type: ERoutine,
    /** Ligne du scénario contenant le début du bloc */
    public debut: number,
    /** Le bloc est-il toujours ouvert ? */
    public ouvert: boolean = true
  ) { }

  /** Ligne du scénario contenant la fin du bloc */
  public fin: number;
  /** Le bloc est-il correctement fini (avec un fin bloc) */
  public correctementFini: boolean = false;

  /**
   * Convertir une chaîne de caractères en ERoutine
   */
  public static ParseType(type: string): ERoutine | undefined {
    switch (type) {

      case 'routine':
        return ERoutine.simple

      case 'action':
        return ERoutine.action

      case 'règle':
      case 'régle':
      case 'regle':
        return ERoutine.regle

      case 'réaction':
      case 'rèaction':
      case 'reaction':
        return ERoutine.reaction

      default:
        return undefined;
    }
  }

  /** Afficher le nom du type de routine spécifié. */
  public static TypeToString(type: ERoutine | undefined) {
    switch (type) {
      case ERoutine.simple:
        return 'routine';
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

