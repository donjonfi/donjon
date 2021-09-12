import { Evenement } from './evenement';
import { Instruction } from '../compilateur/instruction';
import { TypeRegle } from '../compilateur/type-regle';

export class Auditeur {
  type: TypeRegle;
  evenements: Evenement[];
  instructions: Instruction[];
  /** nombre de déclenchements de l’auditeur */
  declenchements: number = 0;
  estRegleActionQuelconque: boolean = false;
}
