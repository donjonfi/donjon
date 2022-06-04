import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { PositionSujetString } from "../../../models/compilateur/position-sujet";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurPosition {

  /**
   * Tester phrase de type pronom personnel (il/elle) suivit d’attributs.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerPositionElement(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {


    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom personnel attributs
    const result = ExprReg.xDefinirPositionElement.exec(phrase.morceaux[0]);
    if (result !== null) {

      const elementBrut = result[1];
      const positionBrut = result[2];

      if (/par rapport (?:à|au|aux) /i.exec(elementBrut)) {
        const morceauxPosition = PhraseUtils.separerListeIntitulesEt(positionBrut, true);
        const elementBrutNettoye = elementBrut.replace(/par rapport (?:à|au|aux) /i, "");
        const elementEtAutreElement = PhraseUtils.separerListeIntitulesEt(elementBrutNettoye, true);
        // trouver les positions relatives
        morceauxPosition.forEach(morceauPosition => {
          let curPositionBrut: string;
          // de le => du
          if(elementEtAutreElement[1].toLocaleLowerCase().startsWith("le ")){
            curPositionBrut = morceauPosition + ' du ' + elementEtAutreElement[1].slice(3);
          // autres
          }else{
            curPositionBrut = morceauPosition + ' de ' + elementEtAutreElement[1];
          }
          
          elementTrouve = this.testerPositionRelative(elementEtAutreElement[0], curPositionBrut , phrase, ctxAnalyse);
        });
      } else {
        // il peut y avoir plusieurs positions relatives
        const morceauxPosition = PhraseUtils.separerListeIntitulesEt(positionBrut, true);
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

      // retrouver l’élément générique concerné
      const elementConcerneNom = resultElementConcerne[2].toLowerCase();
      const elementConcerneEpithete = resultElementConcerne[3] ? resultElementConcerne[3].toLowerCase() : null;
      let elementConcerne = AnalyseurUtils.trouverCorrespondance(elementConcerneNom, elementConcerneEpithete, ctxAnalyse);
      if (elementConcerne) {

        // vérifier si la position est valide
        const resultPosition = ExprReg.xPositionRelative.exec(positionBrut);
        if (resultPosition) {
          const positionSuivieBrut = resultPosition[1];
          const autreElementBrut = resultPosition[2];
          const positionSoloBrut = resultPosition[3];
          // console.log("positionSuivieBrut:", positionSuivieBrut);
          // console.log("autreElementBrut:", autreElementBrut);
          // console.log("positionSoloBrut:", positionSoloBrut);
          // s'il s'agit d'une position suivie, vérifier l'autre élément
          if (positionSuivieBrut) {
            // vérifier l'autre élément
            const resultAutreElement = ExprReg.xGroupeNominalArticleDefiniEtIndefini.exec(autreElementBrut);
            if (resultAutreElement) {

              elementConcerne.ajouterPositionString(
                new PositionSujetString(
                  // sujet
                  elementConcerne.nom.toLowerCase() + (elementConcerne.epithete ? (' ' + elementConcerne.epithete.toLowerCase()) : ''),
                  // complément
                  autreElementBrut,
                  // position
                  positionSuivieBrut
                )
              );

              // modifier le dernier élément de la liste
              ctxAnalyse.dernierElementGenerique = elementConcerne;
              // modifier éventuellement le dernier lieu de la liste
              if (elementConcerne.classeIntitule == EClasseRacine.lieu) {
                ctxAnalyse.dernierLieu = elementConcerne;
              }

              // résultat
              elementTrouve = ResultatAnalysePhrase.positionElement;

            } else {
              ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : le nom de l'autre élément n'est pas supporté : " + autreElementBrut)
            }
          } else {

            // console.log("positionSuivieBrut:", positionSuivieBrut);
            // console.log("autreElementBrut:", autreElementBrut);
            // console.log("positionSoloBrut:", positionSoloBrut);

            // même si il y a une erreur, on a tout de même compris la formulation
            elementTrouve = ResultatAnalysePhrase.positionElement;

            const nouvellePosition = AnalyseurUtils.trouverPositionIciDedansDessusDessous(elementConcerne, positionSoloBrut, phrase, ctxAnalyse);

            if (nouvellePosition) {
              elementConcerne.ajouterPositionString(nouvellePosition);
              // résultat

              // modifier le dernier élément de la liste
              ctxAnalyse.dernierElementGenerique = elementConcerne;
              // modifier éventuellement le dernier lieu de la liste
              if (elementConcerne.classeIntitule == EClasseRacine.lieu) {
                ctxAnalyse.dernierLieu = elementConcerne;
              }
            } else {
              // (erreur déjà générée par trouverPositionIciDedansDessusDessous)
            }

          }
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : la position de l’élément n'est pas supportée : " + positionBrut)
        }
      } else {
        ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : l'élément concerné n'a pas été trouvé : " + elementConcerneBrut);
      }
    } else {
      ctxAnalyse.ajouterErreur(phrase.ligne, "Position relative : le nom de l’élément n'est pas supporté : " + elementConcerneBrut)
    }

    return elementTrouve;
  }
}

