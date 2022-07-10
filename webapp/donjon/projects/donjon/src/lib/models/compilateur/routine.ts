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
        return ERoutine.routine

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
}

/**
 * Bloc dans lequel se trouve la phrase.
 */
export enum ERoutine {
  /** Inconnu */
  inconnue = 0,
  /** Aucun (définition du monde) */
  aucun = 1,
  /** Routine */
  routine = 2,
  /** Routine « action » */
  action = 3,
  /** Routine « règle » */
  regle = 4,
  /** Routine « réaction » */
  reaction = 5,

}

