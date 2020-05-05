import { ElementsPhrase } from '../commun/elements-phrase';
import { GroupeNominal } from '../commun/groupe-nominal';
import { TypeRegle } from '../compilateur/type-regle';

export class Auditeur {
  type: TypeRegle;
  sujet: GroupeNominal;
  verbe: string;
  complement: string;
  instructions: ElementsPhrase[];
}
