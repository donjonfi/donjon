import { Classe } from '../commun/classe';
import { TypeEvenement } from './type-evenement';

export class Evenement {
  constructor(
    public type: TypeEvenement,
    /** Action */
    public infinitif: string,
    /** Y a-t-il un ceci avec l’action (1er complément) */
    public isCeci: boolean = false,
    /** Préposition qui précède ceci */
    public prepositionCeci: string = null,
    /** Quantité ceci (facultatif) */
    public quantiteCeci: number = null,
    /** Ceci (1er complément) */
    public ceci: string = null,
    /** Classe de ceci (2e complément) */
    public classeCeci: Classe = null,
    /** Y a-t-il un cela avec l’action (2e complément) */
    public isCela: boolean = false,
    /** Préposition qui précède cela */
    public prepositionCela: string = "",
    /** Quantité ceci (facultatif) */
    public quantiteCela: number = null,
    /** Cela (2e complément) */
    public cela: string = null,
    /** Classe de cela (2e complément) */
    public classeCela: Classe = null,
    /** La commande correspondant à l’évènement */
    public commandeComprise: string | undefined = undefined,
  ) { }

  /**
   * Orientation du déplacement (nom de la direction : nord, sud, haut, …) lorsque l’évènement
   * est un déplacement du joueur. Permet aux règles ciblant une direction (« après aller vers
   * le nord ») de se déclencher même quand ceci a été remplacé par le lieu de destination.
   */
  public orientationDeplacement: string | null = null;

  toString(): string {
    return this.infinitif + (this.isCeci ? (" " + (this.prepositionCeci ? this.prepositionCeci + " " : "") + this.ceci) : "") + (this.isCela ? (" " + (this.prepositionCela ? this.prepositionCela + " " : "") + this.cela) : "")
  }
}