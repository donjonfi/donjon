import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { Lieu } from '../jeu/lieu';
import { Objet } from '../jeu/objet';

export class Instruction {
  constructor(
    public instruction: ElementsPhrase,
    public condition: Condition = null,
    public instructionsSiConditionVerifiee: Instruction[] = null,
    public instructionsSiConditionPasVerifiee: Instruction[] = null,

  ) { }

  /** Nombre de fois que cette instruction a déjà été exécutée. */
  public nbExecutions = 0;

}
