import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { Aide } from "../../../models/commun/aide";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { StringUtils } from "../../commun/string.utils";
import { TexteUtils } from "../../commun/texte-utils";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { TypeListeActionsTactiles } from "../../../models/jeu/regle-actions-tactiles";

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

        case 'affichage des sorties sur une ligne':
        case 'affichage des sorties en ligne':
          ctxAnalyse.parametres.activerSortiesEnLigne = isActiver;
          break;

        case 'affichage des directions des sorties':
          ctxAnalyse.parametres.activerAffichageDirectionSorties = isActiver;
          break;

        case 'affichage des lieux inconnus':
          ctxAnalyse.parametres.activerAffichageLieuxInconnus = isActiver;
          break;

        case 'affichage des obstacles':
          ctxAnalyse.parametres.activerAffichageObstacles = isActiver;
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

        case 'choix numeriques':
        case 'choix numerotes':
        case 'numerotation des choix':
          ctxAnalyse.parametres.activerChoixNumeriques = isActiver;
          break;

        case 'attendre':
          ctxAnalyse.parametres.activerAttendre = isActiver;
          break;

        case 'mode mobile':
        case 'mode tactile':
        case 'interface mobile':
        case 'interface tactile':
          ctxAnalyse.parametres.activerInterfaceTactile = isActiver;
          break;

        case 'creation automatique des etats':
        case 'creation auto des etats':
        case 'creation des etats automatique':
          ctxAnalyse.parametres.activerCreationAutomatiqueEtats = isActiver;
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

  /**
   * La phrase déclare les actions principales ou secondaires proposées par
   * l’interface tactile pour une classe d’éléments ou un élément précis
   * (remplace la liste héritée), ou en ajoute à la liste héritée.
   * Ex :
   *  - Les actions principales pour les objets sont examiner, prendre et utiliser.
   *  - L’action principale pour les lieux est regarder.
   *  - Ajouter attaquer et insulter aux actions principales du bandit.
   *  - Les actions principales supplémentaires pour les objets ouvrables sont ouvrir et fermer.
   */
  public static testerActionsTactiles(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const declaration = ExprReg.xActionsTactiles.exec(phrase.morceaux[0]);
    const ajout = declaration ? null : ExprReg.xAjouterActionsTactiles.exec(phrase.morceaux[0]);
    // règle globale (sans cible) : « Les actions principales sont … »
    const globale = (declaration || ajout) ? null : ExprReg.xActionsTactilesGlobales.exec(phrase.morceaux[0]);
    // « <cible> a aussi <verbes> comme action(s) courante(s)/complémentaire(s) » : ajout à la liste héritée (cible en tête)
    const ajoutComme = (declaration || ajout || globale) ? null : ExprReg.xActionsTactilesAjoutComme.exec(phrase.morceaux[0]);

    if (declaration || ajout || globale || ajoutComme) {
      elementTrouve = ResultatAnalysePhrase.actionsTactiles;

      const groupeType = declaration ? declaration[1] : (globale ? globale[1] : (ajout ? ajout[2] : ajoutComme[3]));
      // courante => principales, complémentaire => secondaires (mots-clés recommandés, alias de l'interne)
      const lowerType = groupeType.toLowerCase();
      const typeListe: TypeListeActionsTactiles = (lowerType.startsWith('principale') || lowerType.startsWith('courante')) ? 'principales' : 'secondaires';
      // « supplémentaires » : complète la liste héritée au lieu de la remplacer
      const supplementaires = declaration ? !!declaration[2] : (globale ? !!globale[2] : false);
      const infinitifsBruts = (declaration ? declaration[4] : (globale ? globale[3] : (ajout ? ajout[1] : ajoutComme[2]))).trim();

      // règle globale : aucune cible (constructeur de commande global du menu tactile)
      let cible: GroupeNominal | null = null;
      if (!globale) {
        const cibleBrute = (declaration ? declaration[3] : (ajout ? ajout[3] : ajoutComme[1])).trim();
        cible = PhraseUtils.getGroupeNominalDefiniOuIndefini(cibleBrute, true);
        if (!cible) {
          ctxAnalyse.probleme(phrase, undefined,
            CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
            'Cible pas comprise',
            `Actions ${typeListe} : cible pas comprise : « ${cibleBrute} ».`,
          );
          return elementTrouve;
        }
      }

      const infinitifs: string[] = [];
      PhraseUtils.separerListeIntitulesEtOu(infinitifsBruts, true).forEach(item => {
        const infinitif = item.trim().toLowerCase();
        if (ExprReg.xVerbeInfinitif.test(infinitif)) {
          infinitifs.push(infinitif);
        } else {
          ctxAnalyse.probleme(phrase, undefined,
            CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
            'Infinitif attendu',
            `Actions ${typeListe} : « ${item.trim()} » devrait être un verbe à l\u2019infinitif (-er, -ir ou -re).`,
          );
        }
      });

      if (infinitifs.length) {
        ctxAnalyse.actionsTactiles.push({
          typeListe,
          cible,
          mode: ((declaration || globale) && !supplementaires) ? 'remplacer' : 'ajouter',
          infinitifs,
        });
      }
    }

    return elementTrouve;
  }

  /**
   * La phrase demande d'afficher un compteur dans un coin de l'écran.
   * Ex: La bourse est affichée en haut à droite.
   */
  public static testerAfficherCompteur(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xAfficherCompteur.exec(phrase.morceaux[0]);

    if (result) {
      elementTrouve = ResultatAnalysePhrase.afficherCompteur;
      let nomBrut = result[1].trim();
      // Ressource : mot-clé optionnel de périmètre en suffixe du nom (« possédé(e)(s) » / « disponible(s) »).
      //  Ex: « L'argent possédé est affiché… », « Le bois disponible est affiché… ».
      let scopeAffichage: 'possede' | 'disponible' | undefined;
      const mScope = /^(.+?)\s+(poss[ée]d[ée]e?s?|disponibles?)$/i.exec(nomBrut);
      if (mScope) {
        nomBrut = mScope[1].trim();
        scopeAffichage = /^disponible/i.test(mScope[2]) ? 'disponible' : 'possede';
      }
      const verticalite = (result[2] ?? 'haut').toLowerCase();
      const lateralite = (result[3] ?? 'droite').toLowerCase();
      const position = `${verticalite}-${lateralite}` as 'haut-gauche' | 'haut-droite' | 'bas-gauche' | 'bas-droite';
      const options = (result[4] ?? '').toLowerCase();
      // Valider chaque option « sans X » et signaler les options inconnues
      let sansIntitule = false;
      let sansUnite = false;
      let optionInconnue: string | null = null;
      const xSansItem = /sans (\S+)/g;
      let mSans: RegExpExecArray | null;
      while ((mSans = xSansItem.exec(options)) !== null) {
        const opt = mSans[1].toLowerCase();
        if (opt === 'titre' || opt === 'intitulé') {
          sansIntitule = true;
        } else if (opt === 'unité') {
          sansUnite = true;
        } else if (!optionInconnue) {
          optionInconnue = mSans[1];
        }
      }
      if (optionInconnue) {
        ctxAnalyse.probleme(phrase, undefined,
          CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
          'Option d\'affichage inconnue',
          `Afficher compteur: option « sans ${optionInconnue} » inconnue. Options valides : « sans titre », « sans unité ».`
        );
      }

      const motMinuscule = nomBrut.toLowerCase();
      const estPronomPersonnel = motMinuscule === 'il' || motMinuscule === 'elle' || motMinuscule === 'ils' || motMinuscule === 'elles';

      let cpt;
      if (estPronomPersonnel) {
        cpt = ctxAnalyse.dernierElementGenerique;
      } else {
        const nomNormalise = StringUtils.normaliserMot(nomBrut).trim();
        // Match sur le nom, mais aussi sur les formes singulier/pluriel : une ressource
        //  déclarée « Les fruits » (nom singularisé « fruit ») doit être trouvable via
        //  « Les fruits sont affichés ».
        const correspond = (valeur: string | null | undefined) =>
          !!valeur && StringUtils.normaliserMot(valeur).trim() === nomNormalise;
        cpt = ctxAnalyse.elementsGeneriques.find(el =>
          correspond(el.nom) || correspond(el.nomP) || correspond(el.nomS)
        );
      }

      if (cpt) {
        cpt.positionAffichage = position;
        if (sansIntitule) cpt.sansIntitule = true;
        if (sansUnite) cpt.sansUnite = true;
        if (scopeAffichage) cpt.scopeAffichage = scopeAffichage;
      } else if (estPronomPersonnel) {
        ctxAnalyse.probleme(phrase, undefined,
          CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
          'Compteur inconnu',
          `Afficher compteur: aucun élément précédent auquel rattacher « ${nomBrut} ».`
        );
      } else {
        ctxAnalyse.probleme(phrase, undefined,
          CategorieMessage.referenceElementGenerique, CodeMessage.nomElementCiblePasSupporte,
          'Compteur inconnu',
          `Afficher compteur: ce compteur n'existe pas : « ${nomBrut} ».`
        );
      }
    }

    return elementTrouve;
  }

  /**
   * La phrase indique où afficher le titre du lieu actuel.
   * Ex:
   *  - Afficher le lieu dans le cartouche du haut.
   *  - Afficher le titre du lieu dans le cartouche du bas.
   *  - Ne pas afficher le titre du lieu dans le cartouche.
   */
  public static testerAfficherLieu(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xAfficherLieuCartouche.exec(phrase.morceaux[0]);

    if (result) {
      elementTrouve = ResultatAnalysePhrase.afficherLieu;
      const negation = !!result[1];
      const position = result[2]?.toLowerCase();

      if (negation) {
        ctxAnalyse.parametres.afficherTitreLieu = 'aucun';
      } else if (position === 'bas') {
        ctxAnalyse.parametres.afficherTitreLieu = 'bas';
      } else {
        ctxAnalyse.parametres.afficherTitreLieu = 'haut';
      }
    }

    return elementTrouve;
  }

}
