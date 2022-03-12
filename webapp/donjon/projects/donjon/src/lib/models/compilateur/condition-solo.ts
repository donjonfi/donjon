import { GroupeNominal } from "../commun/groupe-nominal";

export class ConditionSolo {
  constructor(
    public sujet: GroupeNominal,
    public verbe: string,
    public negation: string,
    public complement: string,
    public sujetComplement: GroupeNominal,
  ) { }

  toString() {

    let retVal = this.sujet.toString() + ' ' + this.verbe + ' ' + (this.negation ? (this.negation + ' ') : '');

    if (this.sujetComplement) {
      retVal += (this.sujetComplement ? (this.sujetComplement.toString() + ' ') : '');
    } else {
      retVal += (this.complement ? (this.complement + ' ') : '');
    }

    return retVal;
  }
}
