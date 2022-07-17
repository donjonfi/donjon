import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from './instruction';
import { Reaction } from '../../interfaces/compilateur/reaction';

export class ReactionBeta implements Reaction {

  constructor(
    public sujets: GroupeNominal[] = null,
    public instructionsBrutes: string = null,
    public instructions: Instruction[] = [],
  ) { }

  public nbAffichageReaction = 0;

  public get intitule(): string {
    let retVal = "(aucun sujet)";
    let sujet = this.sujets[0];
    if (sujet) {
      if (sujet.determinant) {
        retVal = sujet.determinant + sujet.nom;
      } else {
        retVal = sujet.nom;
      }
      if (sujet.epithete) {
        retVal += " " + sujet.epithete;
      }
    }
    return retVal;
  }

}
