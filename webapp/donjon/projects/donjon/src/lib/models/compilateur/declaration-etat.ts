
export enum TypeDeclarationEtat {
  /** Un état simple, sans relation. */
  simple,
  /** Deux états opposés (mutex avec ré-introduction automatique au retrait). */
  bascule,
  /** N états mutuellement exclusifs (mutex sans ré-introduction). */
  groupe,
  /** A implique B (asymétrique). */
  implication,
  /** A et B s'excluent (contradiction bilatérale). */
  exclusion,
}

/**
 * Déclaration d'état personnalisé issue de la DSL, à appliquer sur la {@link ListeEtats}
 * du jeu pendant la génération.
 */
export class DeclarationEtat {

  constructor(
    public type: TypeDeclarationEtat,
    /**
     * - simple : un seul élément (le nom de l'état).
     * - bascule : deux éléments [a, b].
     * - groupe : N éléments (≥ 2).
     */
    public etats: string[],
    /** Pour implication / exclusion : nom de l'état source. */
    public sujet: string = null,
    /** Pour implication / exclusion : noms des états cibles. */
    public cibles: string[] = null,
    /** Numéro de ligne dans le scénario source (pour les messages). */
    public ligne: number = null,
  ) { }

}
