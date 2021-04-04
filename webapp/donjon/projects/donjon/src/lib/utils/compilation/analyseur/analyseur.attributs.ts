import { ClasseUtils } from "../../commun/classe-utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurAttributs {

  /**
   * Tester phrase de type pronom démonstratif (c’est) suivit d’un type et d’attributs.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerPronomDemonstratifTypeAttributs(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom démonstratif (C’est)
    const result = ExprReg.xPronomDemonstratif.exec(phrase.phrase[0]);
    if (result !== null) {
      // définir type de l'élément précédent
      if (result[2] && result[2].trim() !== '') {
        ctxAnalyse.dernierElementGenerique.classeIntitule = ClasseUtils.getClasseIntitule(result[2]);
      }
      // attributs de l'élément précédent
      if (result[3] && result[3].trim() !== '') {
        ctxAnalyse.dernierElementGenerique.attributs.push(result[3]);
      }

      // résultat
      elementTrouve = ResultatAnalysePhrase.pronomDemontratifTypeAttribut;
    }

    return elementTrouve;
  }

  /**
   * Tester phrase de type pronom personnel (il/elle) suivit d’attributs.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerPronomPersonnelAttributs(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom personnel attributs
    const result = ExprReg.xPronomPersonnelAttribut.exec(phrase.phrase[0]);
    if (result !== null) {
      // attributs de l'élément précédent
      if (result[1] && result[1].trim() !== '') {
        // découper les attributs
        const attributs = PhraseUtils.separerListeIntitules(result[1]);
        ctxAnalyse.dernierElementGenerique.attributs = ctxAnalyse.dernierElementGenerique.attributs.concat(attributs);
      }
      // genre de l'élément précédent
      ctxAnalyse.dernierElementGenerique.genre = MotUtils.getGenre(phrase.phrase[0].split(" ")[0], null);

      // résultat
      elementTrouve = ResultatAnalysePhrase.pronomPersonnelAttribut;
    }

    return elementTrouve;
  }


}