import { Instruction } from "./instruction";
import { Valeur } from "../jeu/valeur";

export class Choix {
  constructor(
    public valeur: Valeur,
    public instructions: Instruction[],
  ) { }
}