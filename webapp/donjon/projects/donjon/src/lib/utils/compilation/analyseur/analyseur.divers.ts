import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { Aide } from "../../../models/commun/aide";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { StringUtils } from "../../commun/string.utils";
import { TexteUtils } from "../../commun/texte-utils";

export class AnalyseurDivers {


  /**
   * Tester si la phrase contient l’aide d’une commande.
   * @param phrase 
   * @param ctxAnalyse 
   * @returns 
   */
  public static testerAide(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const aide = ExprReg.xAide.exec(phrase.morceaux[0]);
    if (aide) {
      // reconstituer le texte complet
      let texteAide = "";
      for (let index = 1; index < phrase.morceaux.length; index++) {
        texteAide += TexteUtils.retrouverTexteOriginal(phrase.morceaux[index]);
      }
      // enlever les guillemets autours du texte
      texteAide = texteAide.trim().replace(/^\"|\"$/g, '');

      ctxAnalyse.aides.push(
        new Aide(aide[1], texteAide)
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
  public static testerSection(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;
    const sectionTrouvee = ExprReg.xSection.test(phrase.morceaux[0]);
    if (sectionTrouvee) {
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
  public static testerActiverDesactiverParametre(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xActiverDesactiver.exec(phrase.morceaux[0]);

    if (result) {
      elementTrouve = ResultatAnalysePhrase.activerParametre;

      const isActiver = result[1].trim().toLowerCase() == 'activer';
      const parametre = result[2].trim();
      // enlever caractères spéciaux et premier déterminant
      const parametreNormalise = StringUtils.normaliserMot(result[2]).trim();

      switch (parametreNormalise) {
        case 'commandes de base':
        case 'actions de base':
          // ne rien faire ici car déja interprété au début de la compilation.
          break;

        case 'affichage des sorties':
          ctxAnalyse.parametres.activerAffichageSorties = isActiver;
          break;

        case 'affichage des directions des sorties':
          ctxAnalyse.parametres.activerAffichageDirectionSorties = isActiver;
          break;

        case 'affichage des lieux inconnus':
          ctxAnalyse.parametres.activerAffichageLieuxInconnus = isActiver;
          break;

        case 'description des objets sur les supports':
        case 'description des objets supportes':
          ctxAnalyse.parametres.activerDescriptionDesObjetsSupportes = isActiver;
          break;

        case 'audio':
        case 'son':
        case 'sons':
        case 'musique':
        case 'musiques':
          ctxAnalyse.parametres.activerAudio = isActiver;
          break;

        case 'remplacement de la destination des déplacements':
        case 'remplacement de la destination des deplacements':
          ctxAnalyse.parametres.activerRemplacementDestinationDeplacements = isActiver;
          break;

        case 'synonymes auto':
        case 'synonymes automatiques':
        case 'synonymes autos':
          ctxAnalyse.parametres.activerSynonymesAuto = isActiver;
          break;
          
        default:
          ctxAnalyse.probleme(phrase, undefined,
            CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
            'Paramètre inconnu',
            `Activer/Désactiver: ce paramètre n’existe pas : « ${parametre} ».`
          );
          break;
      }

    }

    return elementTrouve;
  }

}