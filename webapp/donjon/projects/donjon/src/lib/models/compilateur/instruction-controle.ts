export class InstructionControle {
  /**
   * Convertir une chaîne de caractères en EInstructionControle
   */
  public static ParseType(type: string): EInstructionControle | undefined {
    switch (type.toLocaleLowerCase()) {

      case 'si':
        return EInstructionControle.si

      case 'choisir':
        return EInstructionControle.choisir

      default:
        return undefined;
    }
  }

  /**
   * Afficher le nom du type d’instruction de contrôle spécifié.
   */
  public static TypeToMotCle(type: EInstructionControle | undefined): string {
    switch (type) {
      case EInstructionControle.si:
        return 'si';
      case EInstructionControle.choisir:
        return 'choisir';

      case undefined:
        return '';

      default:
        return '(type instruction contrôle inconnue)';
    }
  }
}

/**
 * Bloc dans lequel se trouve la phrase.
 */
export enum EInstructionControle {
  /** Bloc « si » */
  si = 1,
  /** Bloc « choisir » */
  choisir = 2,
}
