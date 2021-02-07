import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from './instruction';

export class Reaction {

  constructor(
    public sujets: GroupeNominal[] = null,
    public instructionsBrutes: string = null,
    public instructions: Instruction[] = [],
  ) { }

  public nbAffichageReaction = 0;

  public static reactionIntitule(reaction: Reaction) {
    let retVal = "(aucun sujet)";
    let sujet = reaction.sujets[0];
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
