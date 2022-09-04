import { Choix } from './choix';
import { ConditionMulti } from './condition-multi';
import { ElementsPhrase } from '../commun/elements-phrase';
import { TypeChoisir } from './bloc-instructions';

export class Instruction {
  constructor(
    public instruction: ElementsPhrase | undefined,
    public choix: Choix[] = undefined,
    public condition: ConditionMulti = null,
    public instructionsSiConditionVerifiee: Instruction[] = null,
    public instructionsSiConditionPasVerifiee: Instruction[] = null,
  ) { }

  /** Nombre de fois que cette instruction a déjà été exécutée. */
  public nbExecutions = 0;

  /**
   * S’il s’agit d’une instruction de contrôle « choisir », 
   * son type (statique, dynamique, libre) 
   */
  public typeChoisir: TypeChoisir | undefined;

  /** (Compilateur BETA) L'instruction est-elle un "choisir librement" ? */
  public choixLibre = false;

}
