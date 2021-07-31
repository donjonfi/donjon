import { GroupeNominal } from '../commun/groupe-nominal';
import { LienCondition } from './lien-condition';

export class Condition {
  constructor(
    public typeLien: LienCondition,
    public sujet: GroupeNominal,
    public verbe: string,
    public negation: string,
    public complement: string,
    public sujetComplement: GroupeNominal,
  ) { }

  lien: Condition;
}
