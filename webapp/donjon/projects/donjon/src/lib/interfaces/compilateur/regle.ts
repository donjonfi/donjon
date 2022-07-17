import { Evenement } from "../../models/jouer/evenement";
import { Instruction } from "../../models/compilateur/instruction";
import { TypeRegle } from "../../models/compilateur/type-regle";

export interface Regle {

  /** Le type de règle */
  typeRegle: TypeRegle,

  /**  */
  evenements: Evenement[],

  /** Les instructions à exécuter lorsque la règle se déclanche. */
  instructions: Instruction[];

  /** Intitulé de la règle (utilisé pour les messages affichés au créateur) */
  get intitule(): string;

}
