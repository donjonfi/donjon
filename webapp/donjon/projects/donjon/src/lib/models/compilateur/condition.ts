import { GroupeNominal } from '../commun/groupe-nominal';

export enum LienCondition {
  /** aucun lien */
  aucun = "-",
  /** lien « et » */
  et = "et",
  /** lien « ou inclusif » */
  ou = "ou",
  /** lien « ou exclusif » */
  soit = "soit",
  /** lien « et chainé » */
  etsi = "et si",
  /** lien « ou chainé » */
  ousi = "ou si",
}

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
