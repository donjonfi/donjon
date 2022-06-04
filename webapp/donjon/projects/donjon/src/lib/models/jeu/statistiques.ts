export class Statistiques {
  /** Nombre de caractères que compte le scénario. */
  public nbCaracteresScenario: number = 0;
  /** Nombre de caractères que compte le scénario une fois les commentaires enlevés. */
  public nbCaracteresScenarioSansCommentaires: number = 0;
  // /** Nombre de mots que compte le scénario. */
  // public nbMotsScenario: number = 0;
  /** Nombre de caractères qui peuvent être affichés au joueur. */
  public nbCaracteresAffichables: number = 0;
  /** Nombre de mots qui peuvent être affichés au joueur. */
  public nbMotsAffichables: number = 0;

  /** Nombre de mots des commandes affichées à l’utilisateur */
  public nbMotsCommandesAffichees: number = 0;
  /** Nombre de caractères des commandes affichées à l’utilisateur */
  public nbCaracteresCommandesAffichees: number = 0;
   /** Nombre de mots affichés avant le dernier effacement de l’écran */
  public nbMotsAffichesAvantEffacement: number = 0;
  /** Nombre de caractères affichés avant le dernier effacement de l’écran */
  public nbCaracteresAffichesAvantEffacement: number = 0;
}
