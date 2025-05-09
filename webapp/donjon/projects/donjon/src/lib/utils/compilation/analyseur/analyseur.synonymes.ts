import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { Abreviation } from "../../../models/compilateur/abreviation";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { TexteUtils } from "../../commun/texte-utils";

export class AnalyseurSynonymes {

  /**
   * Rechercher une abréviation de commande
   */
  public static testerAbreviation(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let resultatTrouve = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xAbreviation.exec(phrase.morceaux[0]);
    if (result !== null) {
      const abreviation = result[1];
      if (phrase.morceaux[1]) {
        const commande = TexteUtils.enleverGuillemets(phrase.morceaux[1], false);
        if (commande?.length) {
          ctxAnalyse.abreviations.push(new Abreviation(abreviation, commande));
          resultatTrouve = ResultatAnalysePhrase.abreviation;
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "abréviation d’une commande : la commande est vide.");
        }
      } else {
        ctxAnalyse.ajouterErreur(phrase.ligne, "abréviation d’une commande : la commande n'a pas été spécifiée entre guillemets.");
      }
    }

    return resultatTrouve;
  }

  /**
   * Rechecher un synonyme pour une action ou un élément du jeu.
   * Ex: Interpréter xxx comme le yyy.
   */
  public static testerSynonyme(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let resultatTrouve = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xSynonymes.exec(phrase.morceaux[0]);
    if (result !== null) {

      resultatTrouve = ResultatAnalysePhrase.synonyme;

      const synonymesBruts = result[1];
      const listeSynonymesBruts = PhraseUtils.separerListeIntitulesEtOu(synonymesBruts, true);
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
                action.ajouterSynonyme(synonyme);
              });

              // vérifier si ce synonyme n’a pas déjà été utilisé pour une autre action
              let listeAutresSynonymes: string[] = [];
              ctxAnalyse.actions.forEach(autreAction => {
                if (autreAction.infinitif !== infinitif) {
                  autreAction.synonymes.forEach(autreSynonyme => {
                    if (autreSynonyme == synonyme) {
                      if (!listeAutresSynonymes.includes(autreAction.infinitif)) {
                        listeAutresSynonymes.push(autreAction.infinitif);
                      }
                    }
                  });
                }
              });
              if (listeAutresSynonymes.length) {
                let message = "Le synonyme « " + synonymeBrut + " » est défini pour plusieurs actions différentes (";
                listeAutresSynonymes.forEach(autreSynonyme => {
                  message += autreSynonyme + ", ";
                });
                message = message.slice(0, message.length - 2);
                message += " et " + originalBrut + "), cela ne fonctionnera pas.";
                ctxAnalyse.probleme(phrase, undefined, 
                  CategorieMessage.synonyme, CodeMessage.synonymeDefiniPourPlusieursVerbes,
                  "Synonyme déjà utilisé pour une autre action",
                  message);
              }
            } else {
              ctxAnalyse.ajouterErreur(phrase.ligne, "synonymes d’une action : le synonyme n’est pas un verbe : " + synonymeBrut);
            }
          });
        } else {
          // ctxAnalyse.ajouterErreur(phrase.ligne, "synonymes d’une action : action originale pas trouvée : " + infinitif);
          ctxAnalyse.probleme(phrase, undefined, 
            CategorieMessage.synonyme, CodeMessage.synonymeDefiniPourPlusieursVerbes,
            "Synonyme d’une action inexistante",
            `L’action originale « ${infinitif} » n’a pas été trouvée pour le synonyme « ${synonymesBruts} ».`);
        }
      } else {
        // tester si l’original est un GROUPE NOMINAL
        let resultatGn = ExprReg.xGroupeNominalArticleDefini.exec(originalBrut);
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
              resultatGn = ExprReg.xGroupeNominalArticleDefini.exec(synonymeBrut);
              if (resultatGn) {
                determinant = resultatGn[1] ? resultatGn[1] : null;
                nom = resultatGn[2];
                epithete = resultatGn[3] ? resultatGn[3] : null;
                const synonyme = new GroupeNominal(determinant, nom, epithete);
                // ajouter le synonyme à l’élément
                elementTrouve.synonymes.push(synonyme);
              } else {
                ctxAnalyse.ajouterErreur(phrase.ligne, "synonymes d’un élément du jeu : le synonyme n’est pas un groupe nominal : " + synonymeBrut);
              }
            });

            // AUCUN élément trouvé
          } else if (elementsTrouves.length === 0) {
            ctxAnalyse.ajouterErreur(phrase.ligne, "synonymes d’un élément du jeu : élément original pas trouvé : " + originalBrut);
            // PLUSIEURS éléments trouvés
          } else {
            ctxAnalyse.ajouterErreur(phrase.ligne, "synonymes d’un élément du jeu : plusieurs éléments trouvés pour : " + originalBrut);
          }
        }
      }
    }
    return resultatTrouve;
  }

}