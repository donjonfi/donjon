import { AleatoireUtils } from "./aleatoire-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { ExprReg } from "../compilation/expr-reg";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";

export class InstructionSelectionner {

  constructor(
    private verbeux: boolean,
  ) { }

  public executerSelectionner(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(false, '', 1);

    // sélectionner un nombre compris entre 1 et 10.

    const suiteSelNb = instruction.complement1.match(ExprReg.xSuiteInstructionSelectionnerNombre);

    if (suiteSelNb) {
      const quantite = StringUtils.getNombreEntierDepuisChiffresOuLettres(suiteSelNb[1], suiteSelNb[2], undefined);
      const intitule = suiteSelNb[3] + (suiteSelNb[4] ? (' ' + suiteSelNb[4]) : '');
      const min = StringUtils.getNombreEntierDepuisChiffresOuLettres(suiteSelNb[5], suiteSelNb[6], undefined);
      const max = StringUtils.getNombreEntierDepuisChiffresOuLettres(suiteSelNb[7], suiteSelNb[8], undefined);

      if (quantite != 1) {
        contexteTour.ajouterErreurInstruction(instruction, 'Sélectionner nombre: actuellement on ne peut séelctionner qu’un seul nombre à la fois.');
      } else if (min > max) {
        contexteTour.ajouterErreurInstruction(instruction, 'Sélectionner nombre: le nombre maximum ne peut pas être inférieur au nombre mininum.');
      } else {
        console.log("quantite=", quantite, "min=", min, "max=", max);
        const valeur = AleatoireUtils.nombreEntierPositif(min, max);
        contexteTour.ajouterValeur(intitule, valeur);
        console.log("contexteTour=", contexteTour);

        resultat.succes = true;
      }
    } else {
      contexteTour.ajouterErreurInstruction(instruction, 'Sélectionner: actuellement on peut seulement « sélectionner un nombre compris entre X et Y »');
    }

    return resultat;

  }

}