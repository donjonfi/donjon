import { AnalyseurAttributs } from './analyseur.attributs';
import { AnalyseurCapacite } from './analyseur.capacite';
import { AnalyseurElementPosition } from './analyseur.element.position';
import { AnalyseurElementSimple } from './analyseur.element.simple';
import { AnalyseurPosition } from './analyseur.position';
import { AnalyseurPropriete } from './analyseur.propriete';
import { AnalyseurUtils } from './analyseur.utils';
import { ContexteAnalyse } from '../../../models/compilateur/contexte-analyse';
import { ContexteAnalyseV8 } from '../../../models/compilateur/contexte-analyse-v8';
import { EClasseRacine } from '../../../models/commun/constantes';
import { Phrase } from '../../../models/compilateur/phrase';
import { ResultatAnalysePhrase } from '../../../models/compilateur/resultat-analyse-phrase';

export class AnalyseurBeta {


  // /**
  //  * Analyser les phrases fournies et ajouter les résultats dans le contexte de l’analyse.
  //  * @param phrases phrases à analyser.
  //  * @param ctx contexte de l’analyse.
  //  */
  // public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyse) {
  //   phrases.forEach(phrase => {
  //     AnalyseurBeta.analyserPhrase(phrase, ctx);
  //   });
  // }

  // /**
  //  * Ajouter la phrase fournie et ajouter les résultats dans le contexte de l’analyse.
  //  * @param phrase phrase à analyser.
  //  * @param ctx contexte de l’analyse.
  //  */
  // public static analyserPhrase(phrase: Phrase, ctx: ContexteAnalyse): ResultatAnalysePhrase {
  //   let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

  //   // CODE DESCRIPTIF OU REGLE

  //   if (ctx.verbeux) {
  //     console.log("Analyse: ", phrase);
  //   }

  //   // 0 - SI PREMIER CARACTÈRE EST UN TIRET (-), NE PAS INTERPRÉTER
  //   // rem: normalement les commentaires sont déjà retirés du scénario avant d’arriver ici.
  //   if (phrase.morceaux[0].trim().slice(0, 2) === "--") {
  //     phrase.traitee = true;
  //     if (ctx.verbeux) {
  //       console.log("=> commentaire trouvé");
  //     }
  //   } else {

  //     // ===============================================
  //     // SECTIONS (parties, chapitres, ...)
  //     // ===============================================
  //     elementTrouve = AnalyseurDivers.testerSection(phrase, ctx);
  //     if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.section) {
  //       console.log("=> section trouvée");
  //     }

  //     // ===============================================
  //     // AIDE
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurDivers.testerAide(phrase, ctx);
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.aide) {
  //         console.log("=> aide trouvée");
  //       }
  //     }

  //     // ===============================================
  //     // RÈGLES
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       const regleTrouvee = AnalyseurBetaRegle.testerPourRegle(phrase, ctx);
  //       if (regleTrouvee !== null) {
  //         elementTrouve = ResultatAnalysePhrase.regle;
  //         if (ctx.verbeux) {
  //           console.log("=> trouvé règle :", regleTrouvee);
  //         }
  //       }
  //     }

  //     // ===============================================
  //     // SYNONYMES
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurSynonymes.testerSynonyme(phrase, ctx)
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.synonyme) {
  //         console.log("=> trouvé synonyme(s)");
  //       }
  //     }

  //     // ===============================================
  //     // ABRÉVIATIONS
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurSynonymes.testerAbreviation(phrase, ctx)
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.abreviation) {
  //         console.log("=> trouvé abréviation");
  //       }
  //     }

  //     // ===============================================
  //     // ACTIONS
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       const actionTrouvee = AnalyseurBetaAction.testerAction(phrase, ctx);
  //       if (actionTrouvee) {
  //         elementTrouve = ResultatAnalysePhrase.action;
  //         if (ctx.verbeux) {
  //           console.log("=> trouvé Action:", actionTrouvee);
  //         }
  //       }
  //     }


  //     // ===============================================
  //     // NOUVEAU TYPE
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurType.testerNouveauType(phrase, ctx);
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.type) {
  //         console.log("=> trouvé type");
  //       }
  //     }

  //     // ===============================================
  //     // PRÉCISION TYPE
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurType.testerPrecisionType(phrase, ctx);
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.precisionType) {
  //         console.log("=> trouvé précision type");
  //       }
  //     }

  //     // ===============================================
  //     // ACTIVER / DÉSACTIVER PARAMÈTRE
  //     // ===============================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurDivers.testerActiverDesactiverParametre(phrase, ctx);
  //       if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.activerParametre) {
  //         console.log("=> trouvé Activer/Désactier.");
  //       }
  //     }

  //     // ==========================================================================================================
  //     // ÉLÉMENT
  //     // ==========================================================================================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurBeta.testerDefinitionElement(phrase, ctx);
  //     }

  //     // ==========================================================================================================
  //     // CONTENU SE RAPPORTANT À UNE LISTE EXISTANTE
  //     // ==========================================================================================================
  //     if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //       elementTrouve = AnalyseurListe.testerContenuListe(phrase, ctx);
  //       if (elementTrouve === ResultatAnalysePhrase.pronomPersonnelContenuListe) {
  //         if (ctx.verbeux) {
  //           console.log("=> trouvé contenu liste (pronom personnel) :", ctx.dernierElementGenerique);
  //         }
  //       }
  //     }


  //   }

  //   // ===============================================
  //   // IMPORT D’UN AUTRE FICHIER DE CODE (TODO)
  //   // ===============================================
  //   if (elementTrouve === ResultatAnalysePhrase.aucun) {

  //   } // fin test import

  //   // ==========================================================================================================
  //   // AUCUN DES TESTS N’A PERMIS DE COMPRENDRE CETTE PHRASE
  //   // ==========================================================================================================
  //   if (elementTrouve === ResultatAnalysePhrase.aucun) {
  //     // résultat
  //     ctx.ajouterErreur(phrase.ligne, phrase.morceaux[0]);
  //     if (ctx.verbeux) {
  //       console.warn("=> PAS trouvé de signification.");
  //     }
  //   }

  //   return elementTrouve;

  // }



}