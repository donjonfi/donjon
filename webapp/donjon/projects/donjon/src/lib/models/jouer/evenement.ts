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
  ) { }

}