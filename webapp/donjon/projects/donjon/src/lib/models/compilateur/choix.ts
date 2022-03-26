import { Instruction } from "./instruction";
import { StringUtils } from "../../utils/commun/string.utils";
import { Valeur } from "../jeu/valeur";

export class Choix {
  public valeurNormalisee: string;
  constructor(
    public valeur: Valeur,
    public instructions: Instruction[],
  ) {
    this.valeurNormalisee = StringUtils.normaliserReponse(valeur.toString());
  }
}