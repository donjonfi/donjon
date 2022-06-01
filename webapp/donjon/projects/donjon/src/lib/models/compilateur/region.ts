export class Region {

  constructor(
    /** Type de région (définition, action, règle, …) */
    public type: ERegion,
    /** Ligne du scénario contenant le début de la région */
    public debut: number,
    /** Le bloc est-il toujours ouvert ? */
    public ouvert: boolean = true
  ) { }

  /** Ligne du scénario contenant la fin de la région */
  public fin: number;
  /** La région est-elle correctement finie (avec un fin bloc) */
  public correctementFinie: boolean = false;

  /**
   * Convertir une chaîne de caractères en ERegion
   */
  public static ParseType(type: string): ERegion | undefined {
    switch (type) {
      case 'definition':
      case 'définition':
        return ERegion.definition

      case 'action':
        return ERegion.action

      case 'règle':
      case 'regle':
        return ERegion.regle

      case 'réaction':
      case 'reaction':
        return ERegion.reaction

      default:
        return undefined;
    }
  }
}

/**
 * Région dans laquelle se trouve la phrase.
 */
export enum ERegion {
  /** Inconnue */
  inconnue = 0,
  /** Définition du monde. */
  definition = 1,
  /** Bloc « action » */
  action = 2,
  /** Bloc « règle » */
  regle = 3,
  /** Bloc « réaction » */
  reaction = 4,
}



// /**
//  * Sous-région dans laquelle se trouve la phrase.
//  */
//  export enum ESousRegion {
//   /** Aucune */
//   aucune = 0,
//   /** Bloc « action » */
//   si = 1,
//   /** Bloc « règle » */
//    = 2,
//   /** Bloc « réaction » */
//   reaction = 3,
// }
