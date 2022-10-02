// import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
// import { Evenement } from "../../../models/jouer/evenement";
// import { ExprReg } from "../expr-reg";
// import { Phrase } from "../../../models/compilateur/phrase";
// import { PhraseUtils } from "../../commun/phrase-utils";
// import { RegleBeta } from "../../../models/compilateur/regle-beta";
// import { StringUtils } from "../../commun/string.utils";
// import { TypeRegle } from "../../../models/compilateur/type-regle";

// export class AnalyseurBetaRegle {

//     /**
//    * Tester la phrase afin d’y trouver une règle.
//    */
//      public static testerPourRegle(phrase: Phrase, ctxAnalyse: ContexteAnalyse) : RegleBeta{
//       let resultRegle = ExprReg.rAvantApresRemplacer.exec(phrase.morceaux[0]);

//       if (resultRegle !== null) {
  
//         let typeRegle: TypeRegle;
//         let motCle = StringUtils.normaliserMot(resultRegle[1]);
//         let evenementsBruts = resultRegle[2];
//         let instructionsBrutes = resultRegle[3];

//         let evenements: Evenement[] = null;
  
//         switch (motCle) {

//           case 'avant':
//           case 'apres':
//             typeRegle = TypeRegle[motCle];
//             evenements = PhraseUtils.getEvenementsRegle(evenementsBruts);
//             if (!evenements?.length) {
//               ctxAnalyse.ajouterErreur(phrase.ligne, "évènement(s) : " + evenementsBruts);
//             }
//             break;
  
//           default:
//             ctxAnalyse.ajouterErreur(phrase.ligne, "type règle : " + motCle);
//             console.error("tester regle: opérateur inconnu:", motCle);
//             typeRegle = TypeRegle.inconnu;
//             break;
//         }
  
//         let nouvelleRegle = new RegleBeta(typeRegle, evenements, instructionsBrutes);
  
//         ctxAnalyse.regles.push(nouvelleRegle);
  
//         // si phrase morcelée, rassembler les morceaux
//         if (phrase.morceaux.length > 1) {
//           for (let index = 1; index < phrase.morceaux.length; index++) {
//             nouvelleRegle.instructionsBrutes += phrase.morceaux[index];
//           }
//         }
  
//         return nouvelleRegle; // trouvé une règle
//       } else {
//         return null; // rien trouvé
//       }
//     }

// }