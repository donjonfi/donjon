import { ConditionMulti } from './condition-multi';
import { ElementsPhrase } from '../commun/elements-phrase';

export class Instruction {
  constructor(
    public instruction: ElementsPhrase,
    public condition: ConditionMulti = null,
    public instructionsSiConditionVerifiee: Instruction[] = null,
    public instructionsSiConditionPasVerifiee: Instruction[] = null,

  ) { }

  /** Nombre de fois que cette instruction a déjà été exécutée. */
  public nbExecutions = 0;

}
