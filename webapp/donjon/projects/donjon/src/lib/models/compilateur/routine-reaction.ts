import { ERoutine, Routine } from "./routine";

import { GroupeNominal } from "../commun/groupe-nominal";
import { Instruction } from "./instruction";
import { Objet } from "../jeu/objet";
import { Reaction } from "../../interfaces/compilateur/reaction";

export class RoutineReaction extends Routine implements Reaction {

  personne: Objet;
  sujets: GroupeNominal[];
  instructions: Instruction[];

  /**
   * Nouvelle routine action
   * @param ligneDebut ligne du scénario contenant le début du bloc
   */
  public constructor(sujets: GroupeNominal[], ligneDebut: number) {
    super(ERoutine.action, ligneDebut, true);
    this.sujets = sujets;
  }

  /**
   * Intitule de l’action (utilisé pour les messages d’erreur affichés au créateur).
   */
  public override get titre(): string {
    return `réaction concernant « ${this.intitule} »`;
  }

  public get intitule(): string {
    let retVal = "(aucun sujet)";
    let sujet = this.sujets[0];
    if (sujet) {
      if (sujet.determinant) {
        retVal = sujet.determinant + sujet.nom;
      } else {
        retVal = sujet.nom;
      }
      if (sujet.epithete) {
        retVal += " " + sujet.epithete;
      }
    }
    return retVal;
  }

}
