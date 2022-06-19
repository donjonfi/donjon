export class BlocPrincipal {

  constructor(
    /** Type de bloc principal (action, règle, …) */
    public type: EBlocPrincipal,
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
   * Convertir une chaîne de caractères en EBlocPrincipal
   */
  public static ParseType(type: string): EBlocPrincipal | undefined {
    switch (type) {
      // case 'definition':
      // case 'définition':
      //   return EBlocPrincipal.definition

      case 'action':
        return EBlocPrincipal.action

      case 'règle':
      case 'régle':
      case 'regle':
        return EBlocPrincipal.regle

      case 'réaction':
      case 'rèaction':
      case 'reaction':
        return EBlocPrincipal.reaction

      default:
        return undefined;
    }
  }
}

/**
 * Bloc dans lequel se trouve la phrase.
 */
export enum EBlocPrincipal {
  /** Inconnu */
  inconnue = 0,
  /** Aucun (définition du monde) */
  aucun = 1,
  /** Bloc « action » */
  action = 2,
  /** Bloc « règle » */
  regle = 3,
  /** Bloc « réaction » */
  reaction = 4,
}

