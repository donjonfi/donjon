import { Action } from "./action";
import { ERoutine, Routine } from "./routine";

export class RoutineAction extends Routine {

  public action: Action;

  /**
   * Nouvelle routine action
   * @param ligneDebut ligne du scénario contenant le début du bloc
   */
  public constructor(infinitif: string, prepositionCeci: string, ceci: boolean, prepositionCela: string, cela: boolean, ligneDebut: number) {
    super(ERoutine.action, ligneDebut, true);
    this.action = new Action(infinitif, prepositionCeci, ceci, prepositionCela, cela);
  }

  /**
   * Intitule de l’action (utilisé pour les messages d’erreur affichés au créateur).
   */
  public override get titre(): string {
    return `action « ${this.action.infinitif}
      ${this.action.ceci ? (this.action.prepositionCeci ? (this.action.prepositionCeci + 'ceci') : '') : ''}
      ${this.action.cela ? (this.action.prepositionCela ? (this.action.prepositionCela + 'cela') : '') : ''}
       »`;
  }

}
