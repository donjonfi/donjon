import { Action } from "./action";
import { CibleAction } from "./cible-action";
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

    // par défaut, ceci et cela pointent chacun un objet visible
    if (this.action.ceci) {
      this.action.cibleCeci = new CibleAction('un', 'objet', 'visible');
      if (this.action.cela) {
        this.action.cibleCela = new CibleAction('un', 'objet', 'visible');
      }
    }
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

/**
 * Les différentes phases d’une action.
 */
export enum PhaseAction {
  /** phase prérequis: cette phase peut empècher l’exécution de l’action si certains conditions sont remplies. */
  prerequis = 1,
  /** phase exécution: cette phase permet de modifier le jeu suite à l’exécution de l’action. */
  execution = 2,
  /** phase épilogue: cette phase informe le joueur du résultat de l’exécution de l’action. */
  epilogue = 3
}