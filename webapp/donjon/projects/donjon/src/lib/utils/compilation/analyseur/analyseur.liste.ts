import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurListe {

  /**
   * Ajouter la phrase fournie pour y trouver le contenu d’une liste.
   * @param phrase phrase à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static testerContenuListe(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

      console.log("Tadada");

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom personnel + contenu
    const result = ExprReg.xPronomPersonnelContenu.exec(phrase.phrase[0]);

    if (result !== null) {

      
      elementTrouve = ResultatAnalysePhrase.pronomPersonnelContenuListe;

      const contenuBrut = result[1];


      // vérifier qu’il y a un élément avant le pronom
      if (ctxAnalyse.dernierElementGenerique) {
        if (ctxAnalyse.dernierElementGenerique.classeIntitule == 'liste') {

        }
      } else {

      }
    }

    return elementTrouve;
  }

}