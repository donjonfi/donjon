import { Evenement } from './evenement';
import { Instruction } from '../compilateur/instruction';
import { TypeRegle } from '../compilateur/type-regle';

export class Auditeur {
  type: TypeRegle;
  evenement: Evenement;
  instructions: Instruction[];
}
