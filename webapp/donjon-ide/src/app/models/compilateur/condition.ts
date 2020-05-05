import { GroupeNominal } from '../commun/groupe-nominal';

export enum LienCondition {
  aucun = "-",
  et = "et",
  ou = "ou",
}

export class Condition {
  constructor(
    public typeLien: LienCondition,
    public sujet: GroupeNominal,
    public verbe: string,
    public negation: string,
    public complement: string
  ) { }

  lien: Condition;
}
