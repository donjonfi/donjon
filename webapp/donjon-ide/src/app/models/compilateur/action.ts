import { ElementsPhrase } from '../commun/elements-phrase';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Verification } from './verification';

export class Action {

  constructor(
    public verbe: string,
    public ceci: boolean,
    public cela: boolean,
    public cibleCeci: GroupeNominal = null,
    public cibleCela: GroupeNominal = null,
    public verificationsBrutes: string = null,
    public verifications: Verification[] = [],
    public instructionsBrutes: string = null,
    public instructions: ElementsPhrase[] = [],
    public instructionsFinalesBrutes: string = null,
    public instructionsFinales: ElementsPhrase[] = []
  ) { }

}
