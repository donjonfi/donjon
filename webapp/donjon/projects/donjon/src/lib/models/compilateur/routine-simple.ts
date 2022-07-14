import { ERoutine, Routine } from "./routine";

import { Instruction } from "./instruction";

export class RoutineSimple extends Routine {

  nom: string;
  instructions: Instruction[] = [];

  /**
   * Nouvelle routine simple.
   * @param nom nom de la routine
   * @param ligneDebut ligne du scénario contenant le début du bloc
   */
  public constructor(nom: string, ligneDebut: number) {
    super(ERoutine.simple, ligneDebut, true);
    this.nom = nom;
  }

}