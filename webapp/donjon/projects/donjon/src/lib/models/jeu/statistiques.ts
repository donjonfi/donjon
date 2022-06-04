export class Statistiques {
  /** Nombre de caractères que compte le scénario. */
  public nbCaracteresScenario: number = 0;
  /** Nombre de caractères que compte le scénario une fois les commentaires enlevés. */
  public nbCaracteresScenarioSansCommentaires: number = 0;
  /** Nombre de mots que compte le scénario. */
  public nbMotsScenario: number = 0;
  /** Nombre de caractères qui peuvent être affichés au joueur. */
  public nbCaracteresAffichables: number = 0;
  /** Nombre de mots qui peuvent être affichés au joueur. */
  public nbMotsAffichables: number = 0;
  // /** Nombre de mots affichés depuis le début de la partie. */
  // public nbMotsAffiches: number = 0;
  // /** Nombre de caractères affichés depuis le début de la partie. */
  // public nbCaracteresAffiches: number = 0;
  /** Nombre de mots des commandes affichées à l’utilisateur */
  public nbMotsCommandesAffichees: number = 0;
  /** Nombre de caractères des commandes affichées à l’utilisateur */
  public nbCaracteresCommandesAffichees: number = 0;
}
