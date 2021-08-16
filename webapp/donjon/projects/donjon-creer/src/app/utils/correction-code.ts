import { ExprReg } from "@donjon/core";

export class CorrectionCode {

  public static corrigerPoints(scenario: string) {
    let codeNettoye = scenario;

    // terminer par un « . » les parties, chapitre et scènes.
    codeNettoye = scenario.replace(/^((?:partie|chapitre|scène) (?:.*?))(\.)?$/mig, "$1.");

    // on retire les commentaire mais pas les lignes car il faut
    // que les numéros de lignes de changent pas !
    let codeAnalyse = codeNettoye.replace(/^((?: *)--(?:.*))$/gm, " ");

    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    codeAnalyse = codeAnalyse
      .replace(/(\r\n|\r|\n)/g, ExprReg.caractereRetourLigne)
      .replace(/( +)/g, " ")
      .trim();

    // séparer les chaines de caractères (entre " ") du code
    const blocsInstructionEtTexte = codeAnalyse.split('"');

    // terminer par un « . » ou un « ; » les textes dynamiques ( "xxxxx" )
    


  }

}