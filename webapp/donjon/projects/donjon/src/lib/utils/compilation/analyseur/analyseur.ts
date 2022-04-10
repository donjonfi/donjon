import { AnalyseurAction } from './analyseur.action';
import { AnalyseurAttributs } from './analyseur.attributs';
import { AnalyseurCapacite } from './analyseur.capacite';
import { AnalyseurDivers } from './analyseur.divers';
import { AnalyseurElementPosition } from './analyseur.element.position';
import { AnalyseurElementSimple } from './analyseur.element.simple';
import { AnalyseurListe } from './analyseur.liste';
import { AnalyseurPosition } from './analyseur.position';
import { AnalyseurPropriete } from './analyseur.propriete';
import { AnalyseurRegle } from './analyseur.regle';
import { AnalyseurSynonymes } from './analyseur.synonymes';
import { AnalyseurType } from './analyseur.type';
import { AnalyseurUtils } from './analyseur.utils';
import { ContexteAnalyse } from '../../../models/compilateur/contexte-analyse';
import { EClasseRacine } from '../../../models/commun/constantes';
import { Phrase } from '../../../models/compilateur/phrase';
import { ResultatAnalysePhrase } from '../../../models/compilateur/resultat-analyse-phrase';

export class Analyseur {


  /**
   * Analyser les phrases fournies et ajouter les résultats dans le contexte de l’analyse.
   * @param phrases phrases à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyse) {
    phrases.forEach(phrase => {
      Analyseur.analyserPhrase(phrase, ctx);
    });
  }

  /**
   * Ajouter la phrase fournie et ajouter les résultats dans le contexte de l’analyse.
   * @param phrase phrase à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static analyserPhrase(phrase: Phrase, ctx: ContexteAnalyse): ResultatAnalysePhrase {
    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // CODE DESCRIPTIF OU REGLE

    if (ctx.verbeux) {
      console.log("Analyse: ", phrase);
    }

    // 0 - SI PREMIER CARACTÈRE EST UN TIRET (-), NE PAS INTERPRÉTER
    // rem: normalement les commentaires sont déjà retirés du scénario avant d’arriver ici.
    if (phrase.phrase[0].trim().slice(0, 2) === "--") {
      phrase.traitee = true;
      if (ctx.verbeux) {
        console.log("=> commentaire trouvé");
      }
    } else {

      // ===============================================
      // SECTIONS (parties, chapitres, ...)
      // ===============================================
      elementTrouve = AnalyseurDivers.testerSection(phrase, ctx);
      if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.section) {
        console.log("=> section trouvée");
      }

      // ===============================================
      // AIDE
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurDivers.testerAide(phrase, ctx);
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.aide) {
          console.log("=> aide trouvée");
        }
      }

      // ===============================================
      // RÈGLES
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const regleTrouvee = AnalyseurRegle.testerPourRegle(phrase, ctx);
        if (regleTrouvee !== null) {
          elementTrouve = ResultatAnalysePhrase.regle;
          if (ctx.verbeux) {
            console.log("=> trouvé règle :", regleTrouvee);
          }
        }
      }

      // ===============================================
      // SYNONYMES
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurSynonymes.testerSynonyme(phrase, ctx)
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.synonyme) {
          console.log("=> trouvé synonyme(s)");
        }
      }

      // ===============================================
      // ABRÉVIATIONS
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurSynonymes.testerAbreviation(phrase, ctx)
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.abreviation) {
          console.log("=> trouvé abréviation");
        }
      }

      // ===============================================
      // ACTIONS
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const actionTrouvee = AnalyseurAction.testerAction(phrase, ctx);
        if (actionTrouvee) {
          elementTrouve = ResultatAnalysePhrase.action;
          if (ctx.verbeux) {
            console.log("=> trouvé Action:", actionTrouvee);
          }
        }
      }


      // ===============================================
      // NOUVEAU TYPE
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurType.testerNouveauType(phrase, ctx);
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.type) {
          console.log("=> trouvé type");
        }
      }

      // ===============================================
      // PRÉCISION TYPE
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurType.testerPrecisionType(phrase, ctx);
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.precisionType) {
          console.log("=> trouvé précision type");
        }
      }

      // ===============================================
      // ACTIVER / DÉSACTIVER PARAMÈTRE
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurDivers.testerActiverDesactiverParametre(phrase, ctx);
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.activerParametre) {
          console.log("=> trouvé Activer/Désactier.");
        }
      }

      // ===================================================================
      // MONDE 0 - TESTER POSITION ÉLÉMENT
      // ===================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurPosition.testerPositionElement(phrase, ctx);
        if (elementTrouve == ResultatAnalysePhrase.positionElement) {
          if (ctx.verbeux) {
            console.log("=> trouvé position élément:", ctx.dernierElementGenerique);
            console.log("=> => nbPos: ", ctx.dernierElementGenerique.positionString.length);
          }
        }
      }

      // ===================================================================
      // MONDE 1 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) AVEC POSITION
      // ===================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const elementConcerne = AnalyseurElementPosition.testerElementAvecPosition(phrase, ctx);
        if (elementConcerne) {
          ctx.dernierElementGenerique = elementConcerne;
          // si l’élément concernée est un lieu, il s’agit du dernier lieu
          if (elementConcerne.classeIntitule == EClasseRacine.lieu) {
            ctx.dernierLieu = elementConcerne;
          }
          AnalyseurUtils.ajouterDescriptionDernierElement(phrase, ctx);
          elementTrouve = ResultatAnalysePhrase.elementAvecPosition;
          if (ctx.verbeux) {
            console.log("=> trouvé élément avec position:", ctx.dernierElementGenerique);
          }
        }
      }

      // ===================================================================
      // MONDE 2 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) SANS POSITION
      // ===================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const elementConcerne = AnalyseurElementSimple.testerElementSansPosition(phrase, ctx);
        if (elementConcerne) {
          ctx.dernierElementGenerique = elementConcerne;
          // si l’élément concernée est un lieu, il s’agit du dernier lieu
          if (elementConcerne.classeIntitule == EClasseRacine.lieu) {
            ctx.dernierLieu = elementConcerne;
          }
          AnalyseurUtils.ajouterDescriptionDernierElement(phrase, ctx);
          elementTrouve = ResultatAnalysePhrase.elementSansPosition;
          if (ctx.verbeux) {
            console.log("=> trouvé testerElementSansPosition:", ctx.dernierElementGenerique);
          }
        }
      }

      // =====================================================================================================
      // MONDE 3 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM DÉMONSTRATIF (C’EST UN) > TYPE + ATTRIBUTS
      // =====================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(phrase, ctx);
        if (elementTrouve === ResultatAnalysePhrase.pronomDemontratifTypeAttribut) {
          // ajout d’une éventuelle description
          AnalyseurUtils.ajouterDescriptionDernierElement(phrase, ctx);
          if (ctx.verbeux) {
            console.log("=> trouvé type dernier élément (+ attributs) (pronom démonstratif) :", ctx.dernierElementGenerique);
          }
          // si l’élément concernée est un lieu, il s’agit du dernier lieu
          if (ctx.dernierElementGenerique.classeIntitule == EClasseRacine.lieu) {
            ctx.dernierLieu = ctx.dernierElementGenerique;
          }
        }
      }

      // ==========================================================================================================
      // MONDE 4 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL (IL/ELLE) > POSITION
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurElementPosition.testerPronomPersonnelPosition(phrase, ctx);
        if (elementTrouve === ResultatAnalysePhrase.pronomPersonnelPosition) {
          // ajout d’une éventuelle description
          AnalyseurUtils.ajouterDescriptionDernierElement(phrase, ctx);
          if (ctx.verbeux) {
            console.log("=> trouvé position (pronom personnel) :", ctx.dernierElementGenerique);
          }
        }
      }


      // ==========================================================================================================
      // MONDE 5 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL (IL/ELLE) > ATTRIBUT
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurAttributs.testerPronomPersonnelAttributs(phrase, ctx);
        if (elementTrouve === ResultatAnalysePhrase.pronomPersonnelAttribut) {
          // ajout d’une éventuelle description
          AnalyseurUtils.ajouterDescriptionDernierElement(phrase, ctx);
          if (ctx.verbeux) {
            console.log("=> trouvé attribut (pronom personnel) :", ctx.dernierElementGenerique);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 6 - PROPRIÉTÉ/RÉACTION SE RAPPORTANT À UN ÉLÉMENT EXISTANT
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurPropriete.testerPourProprieteReaction(phrase, ctx);
        if (ctx.verbeux && elementTrouve !== ResultatAnalysePhrase.aucun) {
          let elementCible = ctx.dernierElementGenerique;
          if (elementTrouve === ResultatAnalysePhrase.propriete) {
            console.log("=> trouvé propriété :", elementCible);
          } else if (elementTrouve === ResultatAnalysePhrase.reaction) {
            console.log("=> trouvé réaction :", elementCible);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 7 - CONTENU SE RAPPORTANT À UNE LISTE EXISTANTE
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurListe.testerContenuListe(phrase, ctx);
        if (elementTrouve === ResultatAnalysePhrase.pronomPersonnelContenuListe) {
          if (ctx.verbeux) {
            console.log("=> trouvé contenu liste (pronom personnel) :", ctx.dernierElementGenerique);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 8 - CAPACITÉ SE RAPPORTANT À UN ÉLÉMENT EXISTANT
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        elementTrouve = AnalyseurCapacite.testerPourCapacite(phrase, ctx);
        if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.capacite) {
          console.log("=> trouvé capacité :", ctx.dernierElementGenerique);
        }
      }
    }

    // ===============================================
    // IMPORT D’UN AUTRE FICHIER DE CODE (TODO)
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {

    } // fin test import

    // ==========================================================================================================
    // AUCUN DES TESTS N’A PERMIS DE COMPRENDRE CETTE PHRASE
    // ==========================================================================================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      // résultat
      ctx.ajouterErreur(phrase.ligne, phrase.phrase[0]);
      if (ctx.verbeux) {
        console.warn("=> PAS trouvé de signification.");
      }
    }

    return elementTrouve;
  }


}