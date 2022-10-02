import { ERoutine, Routine } from "./routine";

import { Instruction } from "./instruction";

export class RoutineSimple extends Routine {

  /**
   * Le nom de la routine.
   */
  nom: string;

  /**
   * Les instructions qui composent la routine.
   */
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

  /**
   * Intitule complet de la routine (utilisé pour les messages d’erreur affichés au créateur).
   */
  public override get titre(): string {
    return `routine « ${this.nom} »`;
  }

}
