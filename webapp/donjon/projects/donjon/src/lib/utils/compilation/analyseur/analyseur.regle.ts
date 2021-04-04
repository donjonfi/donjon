import { Condition } from "../../../models/compilateur/condition";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementsPhrase } from "../../../models/commun/elements-phrase";
import { Evenement } from "../../../models/jouer/evenement";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Regle } from "../../../models/compilateur/regle";
import { StringUtils } from "../../commun/string.utils";
import { TypeRegle } from "../../../models/compilateur/type-regle";

export class AnalyseurRegle {

    /**
   * Tester la phrase afin d’y trouver une règle.
   */
     public static testerPourRegle(phrase: Phrase, ctxAnalyse: ContexteAnalyse) : Regle{
      let resultRegle = ExprReg.rAvantApresRemplacer.exec(phrase.phrase[0]);
  
      if (resultRegle !== null) {
  
        let typeRegle: TypeRegle;
        let motCle = StringUtils.normaliserMot(resultRegle[1]);
        let condition: Condition = null;
        let evenements: Evenement[] = null;
        let commande: ElementsPhrase = null;
  
        switch (motCle) {
          // case 'si':
          //   typeRegle = TypeRegle.si;
          //   condition = PhraseUtils.getCondition(resultRegle[2]);
          //   if (!condition) {
          //     erreurs.push(("00000" + phrase.ligne).slice(-5) + " : condition : " + resultRegle[2]);
          //   }
          //   break;
  
          // case 'quand':
          case 'avant':
          case 'apres':
            typeRegle = TypeRegle[motCle];
            evenements = PhraseUtils.getEvenements(resultRegle[2]);
            if (!evenements?.length) {
              ctxAnalyse.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : évènement(s) : " + resultRegle[2]);
            }
            break;
  
          // case 'remplacer':
          //   typeRegle = TypeRegle.remplacer;
          //   commande = PhraseUtils.getCommande(resultRegle[2]);
          //   if (!commande) {
          //     erreurs.push(("00000" + phrase.ligne).slice(-5) + " : commande : " + resultRegle[2]);
          //   }
          //   break;
  
          default:
            ctxAnalyse.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : type règle : " + resultRegle[2]);
            console.error("tester regle: opérateur inconnu:", resultRegle[1]);
            typeRegle = TypeRegle.inconnu;
            break;
        }
  
        let nouvelleRegle = new Regle(typeRegle, condition, evenements, commande, resultRegle[3]);
  
        ctxAnalyse.regles.push(nouvelleRegle);
  
        // si phrase morcelée, rassembler les morceaux
        if (phrase.phrase.length > 1) {
          for (let index = 1; index < phrase.phrase.length; index++) {
            nouvelleRegle.consequencesBrutes += phrase.phrase[index];
          }
        }
  
        return nouvelleRegle; // trouvé une règle
      } else {
        return null; // rien trouvé
      }
    }

}