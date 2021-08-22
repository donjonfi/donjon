import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurSynonymes {

  /**
   * Rechecher un synonyme d’action ou d’élment du jeu
   */
  public static testerSynonyme(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let resultatTrouve = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xSynonymes.exec(phrase.phrase[0]);
    if (result !== null) {

      const synonymesBruts = result[1];
      const listeSynonymesBruts = PhraseUtils.separerListeIntitulesEtOu(synonymesBruts);
      const originalBrut = result[2];

      // tester si l’original est un VERBE
      let resultatVerbe = ExprReg.xVerbeInfinitif.exec(originalBrut);
      // si l’original est un verbe
      if (resultatVerbe) {
        // retrouver les action liés à ce verbe
        let infinitif = resultatVerbe[1];
        let actionsTrouvees = ctxAnalyse.actions.filter(x => x.infinitif === infinitif);
        if (actionsTrouvees.length !== 0) {
          // parcourir les synonymes
          listeSynonymesBruts.forEach(synonymeBrut => {
            // s’il s’agit d’un verbe, l’ajouter la liste des synonymes
            resultatVerbe = ExprReg.xVerbeInfinitif.exec(synonymeBrut);
            if (resultatVerbe) {
              let synonyme = resultatVerbe[1];
              // parcourir les actions trouvées
              actionsTrouvees.forEach(action => {
                // ajouter le synonyme à l’action
                action.synonymes.push(synonyme);
              });
              resultatTrouve = ResultatAnalysePhrase.synonyme;
            } else {
              AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "synonymes d’une action : le synonyme n’est pas un verbe : " + synonymeBrut);
            }
          });
        } else {
          AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "synonymes d’une action : action originale pas trouvée : " + infinitif);
        }
      } else {
        // tester si l’original est un GROUPE NOMINAL
        let resultatGn = ExprReg.xGroupeNominal.exec(originalBrut);
        if (resultatGn) {
          let determinant = resultatGn[1] ? resultatGn[1] : null;
          let nom = resultatGn[2];
          let epithete = resultatGn[3] ? resultatGn[3] : null;
          // retrouver l’élément générique correspondant
          let nomLower = nom.toLowerCase();
          let epiLower = epithete?.toLowerCase();
          const elementsTrouves = ctxAnalyse.elementsGeneriques.filter(x => x.nom.toLowerCase() == nomLower && x.epithete?.toLowerCase() == epiLower);
          // 1 élément trouvé
          if (elementsTrouves.length === 1) {
            let elementTrouve = elementsTrouves[0];
            listeSynonymesBruts.forEach(synonymeBrut => {
              // s’il s’agit d’un verbe, l’ajouter la liste des synonymes
              resultatGn = ExprReg.xGroupeNominal.exec(synonymeBrut);
              if (resultatGn) {
                determinant = resultatGn[1] ? resultatGn[1] : null;
                nom = resultatGn[2];
                epithete = resultatGn[3] ? resultatGn[3] : null;
                const synonyme = new GroupeNominal(determinant, nom, epithete);
                // ajouter le synonyme à l’élément
                elementTrouve.synonymes.push(synonyme);
              } else {
                AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "synonymes d’un élément du jeu : le synonyme n’est pas un groupe nominal : " + synonymeBrut);
              }
            });
            resultatTrouve = ResultatAnalysePhrase.synonyme;

            // AUCUN élément trouvé
          } else if (elementsTrouves.length === 0) {
            AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "synonymes d’un élément du jeu : élément original pas trouvé : " + originalBrut);
            // PLUSIEURS éléments trouvés
          } else {
            AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "synonymes d’un élément du jeu : plusieurs éléments trouvés pour : " + originalBrut);
          }
        }
      }
    }
    return resultatTrouve;
  }

}