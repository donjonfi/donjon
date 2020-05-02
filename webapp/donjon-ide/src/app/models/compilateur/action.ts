import { Condition } from './condition';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from '../jouer/instruction';
import { Verification } from './verification';

export class Action {

  constructor(
    public verbe: string,
    public cibleA: GroupeNominal = null,
    public cibleB: GroupeNominal = null,
    public verifications: Verification[] = [],
    public instructions: Instruction[] = [],
    public instructionsFinales: Instruction[] = []
  ) { }

}
