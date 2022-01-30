import { AnalyseurUtils } from "./analyseur.utils";
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
        let evenementsBruts = resultRegle[2];
        let instructionsBrutes = resultRegle[3];

        let evenements: Evenement[] = null;
        let condition: Condition = null;
        let commande: ElementsPhrase = null;
  
        switch (motCle) {

          case 'avant':
          case 'apres':
            typeRegle = TypeRegle[motCle];
            evenements = PhraseUtils.getEvenementsRegle(evenementsBruts);
            if (!evenements?.length) {
              AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "évènement(s) : " + evenementsBruts);
            }
            break;
  
          default:
            AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "type règle : " + motCle);
            console.error("tester regle: opérateur inconnu:", motCle);
            typeRegle = TypeRegle.inconnu;
            break;
        }
  
        let nouvelleRegle = new Regle(typeRegle, condition, evenements, commande, instructionsBrutes);
  
        ctxAnalyse.regles.push(nouvelleRegle);
  
        // si phrase morcelée, rassembler les morceaux
        if (phrase.phrase.length > 1) {
          for (let index = 1; index < phrase.phrase.length; index++) {
            nouvelleRegle.instructionsBrutes += phrase.phrase[index];
          }
        }
  
        return nouvelleRegle; // trouvé une règle
      } else {
        return null; // rien trouvé
      }
    }

}