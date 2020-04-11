import { ElementsPhrase } from '../commun/elements-phrase';
import { Instruction } from './instruction';
import { TypeRegle } from '../compilateur/type-regle';

export class Auditeur {
  type: TypeRegle;
  determinant: string;
  sujet: string;
  verbe: string;
  complement: string;
  instructions: ElementsPhrase[];
}
