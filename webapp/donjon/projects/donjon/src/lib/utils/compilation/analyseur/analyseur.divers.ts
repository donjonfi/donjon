import { Aide } from "../../../models/commun/aide";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurDivers {


  /**
   * Tester si la phrase contient l’aide d’une commande.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerAide(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const aide = ExprReg.xAide.exec(phrase.phrase[0]);
    if (aide) {
      ctxAnalyse.aides.push(
        new Aide(aide[1],
          phrase.phrase[1]
            .replace(ExprReg.xCaractereDebutCommentaire, '')
            .replace(ExprReg.xCaractereFinCommentaire, '')
            .replace(ExprReg.xCaractereRetourLigne, '\n')
            .replace(ExprReg.xCaracterePointVirgule, ';')
            .replace(ExprReg.xCaractereVirgule, ',')
        )
      );
      elementTrouve = ResultatAnalysePhrase.aide;
    }

    return elementTrouve;
  }

  /**
   * Tester si la phrase est une nouvelle section (partie, chapitre, scène).
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerSection(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;
    const section = ExprReg.xSection.exec(phrase.phrase[0]);
    if (section) {
      elementTrouve = ResultatAnalysePhrase.section;
    }
    return elementTrouve;
  }

  /**
   * La phrase contient une règle activer/désactiver.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerActiverDesactiver(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const trouveDesactiver = ExprReg.xActiverDesactiver.test(phrase.phrase[0]) !== false;
    if (trouveDesactiver) {
      elementTrouve = ResultatAnalysePhrase.desactiver;
    }

    return elementTrouve;
  }

}