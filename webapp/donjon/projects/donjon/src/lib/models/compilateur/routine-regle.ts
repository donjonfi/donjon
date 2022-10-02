import { ERoutine, Routine } from "./routine";

import { Evenement } from "../jouer/evenement";
import { Instruction } from "./instruction";
import { Regle } from "../../interfaces/compilateur/regle";
import { TypeRegle } from "./type-regle";
import { ExprReg } from "../../utils/compilation/expr-reg";
import { StringUtils } from "../../utils/commun/string.utils";
import { PhraseUtils } from "../../utils/commun/phrase-utils";

export class RoutineRegle extends Routine implements Regle {

  public typeRegle: TypeRegle;
  public evenements: Evenement[];
  public instructions: Instruction[] = [];

  /**
   * Nouvelle routine action
   * @param motCle 'avant' ou 'après'
   * @param evenements 1 ou plusieurs évènements. ex: 'aller au nord, aller au sud ou sortir'
   * @param ligneDebut ligne du scénario contenant le début du bloc
   */
  public constructor(typeRegle: TypeRegle, evenements: Evenement[], ligneDebut: number) {
    super(ERoutine.regle, ligneDebut, true);

    this.typeRegle = typeRegle;
    this.evenements = evenements;

  }

  public override get titre(): string {
    return `règle « ${this.intitule} »`
  }

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
