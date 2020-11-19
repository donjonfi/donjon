import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from './instruction';

export class Reaction {

  constructor(
    public sujets: GroupeNominal[] = null,
    public instructionsBrutes: string = null,
    public instructions: Instruction[] = [],
  ) { }

  public nbAffichageReaction = 0;

}
