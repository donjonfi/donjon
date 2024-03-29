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

    // pronom démonstratif (C’est) + type (+ attributs)
    const result = ExprReg.xPronomDemonstratifTypeAttributs.exec(phrase.morceaux[0]);
    if (result !== null) {

      const type = result[2];
      const attributsBruts = result[3];

      // définir type de l'élément précédent
      if (type && type.trim() !== '') {
        ctxAnalyse.dernierElementGenerique.classeIntitule = type;
      }
      // attributs de l'élément précédent
      if (attributsBruts && attributsBruts.trim() !== '') {
        // découper les attributs
        const nouveauAttributs = PhraseUtils.separerListeIntitulesEt(attributsBruts, true);
        // ajouter les attributs
        ctxAnalyse.dernierElementGenerique.attributs = ctxAnalyse.dernierElementGenerique.attributs.concat(nouveauAttributs);
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
    const result = ExprReg.xPronomPersonnelAttribut.exec(phrase.morceaux[0]);
    if (result !== null) {

      const attributsBruts = result[1];

      // attributs de l'élément précédent
      if (attributsBruts && attributsBruts.trim() !== '') {
        // découper les attributs
        const nouveauAttributs = PhraseUtils.separerListeIntitulesEt(attributsBruts, true);
        // ajouter les attributs
        ctxAnalyse.dernierElementGenerique.attributs = ctxAnalyse.dernierElementGenerique.attributs.concat(nouveauAttributs);
      }
      // genre de l'élément précédent
      ctxAnalyse.dernierElementGenerique.genre = MotUtils.getGenre(phrase.morceaux[0].split(" ")[0], null);

      // résultat
      elementTrouve = ResultatAnalysePhrase.pronomPersonnelAttribut;
    }

    return elementTrouve;
  }


}