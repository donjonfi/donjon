import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { TexteUtils } from "../../commun/texte-utils";

export class AnalyseurListe {

  /**
   * Ajouter la phrase fournie pour y trouver le contenu d’une liste.
   * @param phrase phrase à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static testerContenuListe(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // pronom personnel + contenu
    const result = ExprReg.xPronomPersonnelContenu.exec(phrase.phrase[0]);

    if (result !== null) {

      // vérifier qu’il y a une liste avant le pronom
      if (ctxAnalyse.dernierElementGenerique && ctxAnalyse.dernierElementGenerique.classeIntitule == 'liste') {
        elementTrouve = ResultatAnalysePhrase.pronomPersonnelContenuListe;
        // il n’y a pas de liste qui précède le pronom
      } else {
        AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "Le pronom doit faire référence à une liste.");
      }

      if (elementTrouve == ResultatAnalysePhrase.pronomPersonnelContenuListe) {

        const contenuBrut = result[1];

        // s’il s’agit de textes, il faut les récupérer
        if (contenuBrut === undefined) {
          if (phrase.phrase.length > 0) {
            for (let index = 0; index < phrase.phrase.length; index++) {
              const morceau = phrase.phrase[index];
              // nombre impaire => valeur
              if (index % 2) {
                ctxAnalyse.dernierElementGenerique.valeursTexte.push(TexteUtils.retrouverTexteOriginal(morceau));
                // nombre paire => autre
              } else if (index > 0) {
                if (morceau != ',' && morceau != 'et') {
                  AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, 'Format attendu pour les valeurs à ajouter à la liste: élément1, élément2 et élément3. Il doit s’agir soit de nombres, soit d’intitulés, soit de textes.');
                  break;
                }
              }
            }
          } else {
            AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, 'Format attendu pour les valeurs à ajouter à la liste: élément1, élément2 et élément3. Il doit s’agir soit de nombres, soit d’intitulés, soit de textes.');
          }

          // sinon il faut juste les découper
        } else {
          let morceaux = PhraseUtils.separerListeIntitulesEt(contenuBrut);

          morceaux.forEach(morceau => {
            if (morceau.match(ExprReg.xNombreEntier)) {
              ctxAnalyse.dernierElementGenerique.valeursNombre.push(Number.parseInt(morceau));
            } else if (morceau.match(ExprReg.xNombreDecimal)) {
              ctxAnalyse.dernierElementGenerique.valeursNombre.push(Number.parseFloat(morceau));
            } else if (morceau.match(ExprReg.xGroupeNominalArticleDefini)) {
              ctxAnalyse.dernierElementGenerique.valeursIntitule.push(PhraseUtils.getGroupeNominalDefini(morceau, false));
            } else {
              AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, 'Format attendu pour les valeurs à ajouter à la liste: élément1, élément2 et élément3. Il doit s’agir soit de nombres, soit d’intitulés, soit de textes.');
            }
          });
        }
      }

    }

    return elementTrouve;
  }

}