import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';
import { Evenement } from '../jouer/evenement';
import { Instruction } from './instruction';
import { TypeRegle } from './type-regle';

export class Regle {

  public instructions: Instruction[] = [];

  constructor(
    public typeRegle: TypeRegle,
    public condition: Condition,
    public evenements: Evenement[],
    public commande: ElementsPhrase,
    public consequencesBrutes: string,
  ) { }

  /** Obtenir l’intitulé de la règle */
  public static regleIntitule(regle: Regle) {
    let retVal = "(aucune règle)";
    if (regle) {
      let ev = regle.evenements[0];
      retVal = regle.typeRegle + " ";

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

    }
    return retVal;
  }

}
