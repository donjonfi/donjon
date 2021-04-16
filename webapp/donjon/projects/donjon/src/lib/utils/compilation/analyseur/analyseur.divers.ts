import { Aide } from "../../../models/commun/aide";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { StringUtils } from "../../commun/string.utils";
import { AnalyseurUtils } from "./analyseur.utils";

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
  public static testerActiverDesactiverParametre(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xActiverDesactiver.exec(phrase.phrase[0]);

    if (result) {
      elementTrouve = ResultatAnalysePhrase.activerParametre;

      const isActiver = result[1].trim().toLowerCase() == 'activer';
      const parametre = result[2].trim();
      // enlever caractères spéciaux et premier déterminant
      const parametreNormalise = StringUtils.normaliserMot(result[2]).trim();

      switch (parametreNormalise) {
        case 'commandes de base':
          // ne rien faire ici car déja interprété au début de la compilation.
          break;

        case 'affichage des sorties':
          ctxAnalyse.parametres.activerAffichageSorties = isActiver;
          break;

        case 'affichage des directions des sorties':
          ctxAnalyse.parametres.activerAffichageDirectionSorties = isActiver;
          break;

        default:
          AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "Activer/Désactiver : paramètre inconnu : « " + parametre + " »")
          break;
      }

    }

    return elementTrouve;
  }

}