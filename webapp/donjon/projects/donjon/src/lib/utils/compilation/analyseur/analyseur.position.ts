import { AnalyseurUtils } from "./analyseur.utils";
import { ClasseUtils } from "../../commun/classe-utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { PositionSujetString } from "../../../models/compilateur/position-sujet";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { StringUtils } from "../../commun/string.utils";

export class AnalyseurPosition {

  /**
   * Tester phrase de type pronom personnel (il/elle) suivit d’attributs.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerPositionElement(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    console.log("@@@@@ testerPositionElement");
    

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom personnel attributs
    const result = ExprReg.xDefinirPositionElement.exec(phrase.phrase[0]);
    if (result !== null) {

      const elementBrut = result[1];
      const positionBrut = result[2];

      if (/par rapport (?:à|au|aux) /i.exec(elementBrut)) {
        const morceauxPosition = PhraseUtils.separerListeIntitulesEt(positionBrut);
        const elementBrutNettoye = elementBrut.replace(/par rapport (?:à|au|aux) /i, "");
        const elementEtAutreElement = PhraseUtils.separerListeIntitulesEt(elementBrutNettoye);
        // trouver les positions relatives
        morceauxPosition.forEach(morceauPosition => {
          elementTrouve = this.testerPositionRelative(elementEtAutreElement[0], morceauPosition + ' de ' + elementEtAutreElement[1], phrase, ctxAnalyse);
        });
      } else {
        // il peut y avoir plusieurs positions relatives
        const morceauxPosition = PhraseUtils.separerListeIntitulesEt(positionBrut);
        // trouver les positions relatives
        morceauxPosition.forEach(morceauPosition => {
          elementTrouve = this.testerPositionRelative(elementBrut, morceauPosition, phrase, ctxAnalyse);
        });
      }
    }

    return elementTrouve;
  }

  private static testerPositionRelative(elementConcerneBrut: string, positionBrut: string, phrase: Phrase, ctxAnalyse: ContexteAnalyse) {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // vérifier si l'élément est un nom valide
    const resultElementConcerne = ExprReg.xGroupeNominalArticleDefiniEtIndefini.exec(elementConcerneBrut);
    if (resultElementConcerne) {

      const elementConcerneNom = resultElementConcerne[2].toLowerCase();
      const elementConcerneEpithete = resultElementConcerne[3] ? resultElementConcerne[3].toLowerCase() : null;

      // vérifier si la position est valide
      const resultPosition = ExprReg.xPositionRelative.exec(positionBrut);
      if (resultPosition) {
        const positionSuivieBrut = resultPosition[1];
        const autreElementBrut = resultPosition[2];
        const positionSoloBrut = resultPosition[3];
        console.log("positionSuivieBrut:", positionSuivieBrut);
        console.log("autreElementBrut:", autreElementBrut);
        console.log("positionSoloBrut:", positionSoloBrut);
        // s'il s'agit d'une position suivie, vérifier l'autre élément
        if (positionSuivieBrut) {
          // vérifier l'autre élément
          const resultAutreElement = ExprReg.xGroupeNominalArticleDefiniEtIndefini.exec(autreElementBrut);
          if (resultAutreElement) {

            // retrouver l’élément générique concerné
            let elementConcerne = AnalyseurUtils.trouverCorrespondance(elementConcerneNom, elementConcerneEpithete, ctxAnalyse);

            if (elementConcerne) {
              elementConcerne.positionString.push(
                new PositionSujetString(elementConcerneBrut, autreElementBrut, positionSuivieBrut)
              );

              // résultat
              elementTrouve = ResultatAnalysePhrase.positionElement;
              console.log("ça marche A !");
              
            } else {
              ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : l'élément concerné n'a pas été trouvé : " + elementConcerneBrut);
            }
          } else {
            ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : le nom de l'autre élément n'est pas supporté : " + autreElementBrut)
          }
        } else {
          // résultat
          elementTrouve = ResultatAnalysePhrase.positionElement;
          console.log("ça marche B !");
        }
      } else {
        ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : la position de l’élément n'est pas supportée : " + positionBrut)
      }
    } else {
      ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : le nom de l’élément n'est pas supporté : " + elementConcerneBrut)
    }
    return elementTrouve;
  }


}