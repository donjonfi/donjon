export class Sauvegarde {

  public readonly type: string = "sauvegarde";

  /** La version de Donjon utlisée pour générer la sauvegarde */
  public version: number;

  /** Le scénario du jeu */
  public scenario: string;

  /** Les commandes exécutées par le joueur. */
  public commandes: string[];

  /** 
   * La graine utilisée pour initialiser le générateur
   * de nombres aléatoires.
   */
  public graine: string;

}