export class Sauvegarde {

  public readonly type: string = "sauvegarde";

  /** La version de Donjon utilisée pour générer la sauvegarde */
  public version: number;

  /** Le scénario du jeu */
  public scenario: string;

  /** 
   * Les commandes exécutées par le joueur. 
   * 
   * Légende:
   *  - r: réponse
   *  - d: déclenchement
   *  - g: graine
   *  - c: commande
  */
  public etapesSauvegarde: string[];

  /** 
   * La graine utilisée pour initialiser le générateur
   * de nombres aléatoires.
   * (sauvegarde V1)
   */
  public graine: string;

  // /**
  //  * Historique de l’ensemble des graines utilisées pour
  //  * initialiser le générateur de nombres aléatoires.
  //  * (sauvegarde V2)
  //  */
  // public historiqueGraines: GraineSauvegarde[];

  // /**
  //  * Historique des routines programmées déjà déclenchées.
  //  * (sauvegarde V2)
  //  */
  // public historiqueDeclenchements: DeclenchementPasse[];

  /**
   * Liste des routines programmées pas encore déclenchées.
   * (sauvegarde V2)
   */
  public declenchementsFuturs: DeclenchementFutur[];
}

/**
 * Graine pour le générateur de hasard et commande qui suit
 * la mise en place de cette graine.
 */
export class GraineSauvegarde{
  public graine: number;
  public idxComSuivante: number;
}

/**
 * Nom de la routine et commande qui suit le déclenchement
 * de cette routine.
 */
export class DeclenchementPasse{
  public routine: string;
  public idxComSuivante: number;
}

/**
 * Nom de la routine et temps restant, en millisecondes,
 * avant le déclenchement de cette routine.
 */
export class DeclenchementFutur{
  public routine: string;
  public tempsMs: number;
}
