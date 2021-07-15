import { GroupeNominal } from "../commun/groupe-nominal";

export class ConditionSolo {
  constructor(
    public sujet: GroupeNominal,
    public verbe: string,
    public negation: string,
    public complement: string,
    public sujetComplement: GroupeNominal,
  ) { }
}
