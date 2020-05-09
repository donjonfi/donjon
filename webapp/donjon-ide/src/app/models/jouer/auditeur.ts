import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from '../compilateur/instruction';
import { TypeRegle } from '../compilateur/type-regle';

export class Auditeur {
  type: TypeRegle;
  sujet: GroupeNominal;
  verbe: string;
  complement: string;
  instructions: Instruction[];
}
