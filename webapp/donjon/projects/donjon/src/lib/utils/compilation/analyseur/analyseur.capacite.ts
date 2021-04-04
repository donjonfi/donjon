import { Capacite } from "../../../models/commun/capacite";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurCapacite {
  
  public static testerPourCapacite(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xCapacite.exec(phrase.phrase[0]);
    if (result) {
      const capacite = new Capacite(result[1], (result[2] ? result[2].trim() : null));
      // ajouter la capacité au dernier élément
      ctxAnalyse.dernierElementGenerique.capacites.push(capacite);
      // résultat
      elementTrouve = ResultatAnalysePhrase.capacite;
    }

    return elementTrouve;
  }

}