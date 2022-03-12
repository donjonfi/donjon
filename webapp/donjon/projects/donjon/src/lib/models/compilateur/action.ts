import { CibleAction } from './cible-action';
import { ElementJeu } from '../jeu/element-jeu';
import { Instruction } from './instruction';
import { Intitule } from '../jeu/intitule';
import { Verification } from './verification';

export class Action {

  constructor(
    public infinitif: string,
    public prepositionCeci: string,
    public ceci: boolean,
    public prepositionCela: string,
    public cela: boolean,
  ) { }

  public cibleCeci: CibleAction = null;
  public cibleCela: CibleAction = null;
  public verificationsBrutes: string = null;
  public verifications: Verification[] = [];
  public instructionsBrutes: string = null;
  public instructions: Instruction[] = [];
  public instructionsFinalesBrutes: string = null;
  public instructionsFinales: Instruction[] = []
  public synonymes: string[] = [];

  /** Les actions simplifiees (le joueur peut xxx) ne peuvent pas être modifiées ensuite */
  public simplifiee: boolean = false;

  /** Cette action va déplacer le joueur vers destinationDeplacement */
  public destinationDeplacement: string | undefined;

}

export class ActionCeciCela {

  constructor(
    public action: Action,
    public ceci: ElementJeu | Intitule,
    public cela: ElementJeu | Intitule
  ) { }
}

export class CandidatActionCeciCela {

  constructor(
    public action: Action,
    public ceci: Array<ElementJeu | Intitule>,
    public cela: Array<ElementJeu | Intitule>,
  ) { }
}
