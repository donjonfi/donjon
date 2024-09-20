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

    // par défaut, ceci et cela pointent chacun un objet visible et accessible
    if (this.action.ceci) {
      this.action.cibleCeci = new CibleAction('un', 'objet', 'visible et accessible');
      if (this.action.cela) {
        this.action.cibleCela = new CibleAction('un', 'objet', 'visible et accessible');
      }
    }
  }

  /**
   * Intitule de l’action (utilisé pour les messages d’erreur affichés au créateur).
   */
  public override get titre(): string {
    return `action « ${this.action.infinitif}${this.action.ceci ? (this.action.prepositionCeci ? (` ${this.action.prepositionCeci} ceci`) : ' ceci') : ''}${this.action.cela ? (this.action.prepositionCela ? (` ${this.action.prepositionCela} cela`) : ' cela') : ''} »`;
  }

}

/**
 * Les différentes phases d’une action.
 */
export enum EtiquetteAction {
  /** phase prérequis: cette phase peut empêcher l’exécution de l’action si certains conditions sont remplies. */
  phasePrerequis = 1,
  /** phase exécution: cette phase permet de modifier le jeu suite à l’exécution de l’action. */
  phaseExecution = 2,
  /** phase épilogue: cette phase informe le joueur du résultat de l’exécution de l’action. */
  phaseEpilogue = 3,
  /** définitions actions: ceci, cela, déplacement, … */
  definitions = 4,
}

export enum SujetDefinitionAction {
  autre = 0,
  ceci = 1,
  cela = 2,
}

export enum TypeResultatDefinitionAction {
  aucun = 0,
  typeEtats = 1,
  etatsPrioritaires = 2,
  elementJeu = 3,
  destinationDeplacement = 4,
}