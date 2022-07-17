import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { Evenement } from '../jouer/evenement';
import { Instruction } from './instruction';
import { Regle } from '../../interfaces/compilateur/regle';
import { TypeRegle } from './type-regle';

export class RegleBeta implements Regle {

  public instructions: Instruction[] = [];

  constructor(
    public typeRegle: TypeRegle,
    public evenements: Evenement[],
    public instructionsBrutes: string,
  ) { }

  public get intitule(): string {
    let retVal = "(aucune règle)";
    let ev = this.evenements[0];
    retVal = this.typeRegle + " ";

    if (ev.infinitif) {
      retVal += ev.infinitif;
    } else {
      if (ev.isCeci || ev.isCela) {
        retVal += "une action impliquant"
      } else {
        retVal += "une action quelconque"
      }
    }

    // 1er complément (ceci)
    if (ev.ceci) {
      // préposition ceci
      if (ev.prepositionCeci) {
        retVal += " " + ev.prepositionCeci;
      }
      // ceci
      retVal += " " + ev.ceci;
      // 2e complément (cela)
      if (ev.cela) {
        // préposition cela
        if (ev.prepositionCela) {
          retVal += " " + ev.prepositionCela;
        }
        // cela
        retVal += " " + ev.cela;
      }
    }
    return retVal;
  }

}
