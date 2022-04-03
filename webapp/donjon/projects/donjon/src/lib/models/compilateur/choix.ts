import { Instruction } from "./instruction";
import { StringUtils } from "../../utils/commun/string.utils";
import { Valeur } from "../jeu/valeur";

export class Choix {
  public valeursNormalisees: string[];
  constructor(
    public valeurs: Valeur[],
    public instructions: Instruction[],
  ) {
    // définir les valeurs normalisées
    this.valeursNormalisees = [];
    valeurs.forEach(valeur => {
      this.valeursNormalisees.push(StringUtils.normaliserReponse(valeur.toString()));
    });

  }
}