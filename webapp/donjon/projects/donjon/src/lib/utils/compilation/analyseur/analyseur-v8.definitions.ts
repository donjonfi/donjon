import { AnalyseurBeta } from "./analyseur-beta";
import { AnalyseurDivers } from "./analyseur.divers";
import { AnalyseurListe } from "./analyseur.liste";
import { AnalyseurSynonymes } from "./analyseur.synonymes";
import { AnalyseurType } from "./analyseur.type";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurV8Definitions {

  /**
   * Traiter la définition qui devrait correspondre à la prochaine phrase.
   * @returns true si une définition a effectivement été trouvée.
   */
  public static traiterDefinition(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    let definitionTrouvee: boolean;
    let elementTrouve: ResultatAnalysePhrase = AnalyseurV8Definitions.testerDefinition(phrase, ctx);

    if (elementTrouve !== ResultatAnalysePhrase.aucun) {
      if (ctx.verbeux) {
        console.log(`[AnalyseurV8] l.${phrase.ligne}: définition trouvée (${phrase})`);
      }
      definitionTrouvee = true;
    } else {
      if (ctx.verbeux) {
        console.warn(`[AnalyseurV8] l.${phrase.ligne}: pas trouvé de définition (${phrase})`);
      }
      definitionTrouvee = false;
    }
    // passer à la phrase suivante
    ctx.indexProchainePhrase++;
    return definitionTrouvee;
  }

  private static testerDefinition(phrase: Phrase, ctx: ContexteAnalyse): ResultatAnalysePhrase {
    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // Commentaire ou Section (partie, chapitre, ...)
    elementTrouve = this.testerCommentaireEtSection(phrase, ctx, elementTrouve);
    // Aide (action)
    elementTrouve = this.testerAide(phrase, ctx, elementTrouve);
    // Synonyme (élément, action) ou Abréviation (commande)
    elementTrouve = this.testerSynonymeEtAbreviation(phrase, ctx, elementTrouve);
    // Type
    elementTrouve = this.testerType(phrase, ctx, elementTrouve);
    // Paramètre (jeu)
    elementTrouve = this.testerParametre(phrase, ctx, elementTrouve);
    // Élément
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurBeta.testerDefinitionElement(phrase, ctx);
    }
    // Contenu liste
    elementTrouve = this.testerContenuListe(phrase, ctx, elementTrouve);
    return elementTrouve;
  }

  /** 
   * Tester si la phrase définit le contenu d'une liste.
   * Ex: 
   *  - Elle contient 8, 9 et 10.
   * 
   */
  private static testerContenuListe(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ==========================================================================================================
    // CONTENU SE RAPPORTANT À UNE LISTE EXISTANTE
    // ==========================================================================================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurListe.testerContenuListe(phrase, ctx);
      // TODO: gérer nom d'une liste en plus du pronom personnel.
      if (elementTrouve === ResultatAnalysePhrase.pronomPersonnelContenuListe) {
        if (ctx.verbeux) {
          console.log("=> trouvé contenu liste (pronom personnel) :", ctx.dernierElementGenerique);
        }
      }
    }

    return elementTrouve;

  }

  /** 
   * Tester si la phrase est un commentaire ou le début d'une section (partie, chapitre,...)
   * Ex: 
   *  - -- définition de la maison
   *  - chapitre "La maison"
   * 
   */
  private static testerCommentaireEtSection(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // COMMENTAIRE (-- commentaire)
    // rem: normalement les commentaires sont déjà retirés du scénario avant d’arriver ici.
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      if (phrase.morceaux[0].trim().slice(0, 2) === "--") {
        phrase.traitee = true;
        elementTrouve = ResultatAnalysePhrase.commentaire;
        if (ctx.verbeux) {
          console.log("=> commentaire trouvé");
        }
      }
    }

    // ===============================================
    // SECTIONS (parties, chapitres, ...)
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerSection(phrase, ctx);
      if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.section) {
        console.log("=> section trouvée");
      }
    }

    return elementTrouve;
  }

  /** 
   * Tester si la phrase définit l'aide pour une action.
   * Ex: 
   *  - L'aide pour l'action regarder est "{*Regarder*}{n}Permet de regarder autours de vous.".
   */
  private static testerAide(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // AIDE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerAide(phrase, ctx);
      if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.aide) {
        console.log("=> aide trouvée");
      }
    }
    return elementTrouve;
  }

  /** 
   * Tester si la phrase (dés)active un paramètre.
   * Ex: 
   *  - Désactiver l'affichage des sorties.
   */
  private static testerParametre(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // ACTIVER / DÉSACTIVER PARAMÈTRE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerActiverDesactiverParametre(phrase, ctx);
      if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.activerParametre) {
        console.log("=> trouvé activer/désactiver paramètre.");
      }
    }
    return elementTrouve;
  }

  /**
   * Tester si la phrase définit un synonyme (action ou élément) ou une abréviation (commande). 
   * 
   * Ex: 
   * - Interpréter pirate et barbu comme le capitaine.
   * - L'abréviation sos correspond à "envoyer sos".
   */
  private static testerSynonymeEtAbreviation(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

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

    return elementTrouve;

  }

  /**
   * Tester si la phrase définit un nouveau type ou une précision pour un type existant.
   * Ex:
   *  - Un lutin est une personne.
   *  - Un lutin est magique.
   */
  private static testerType(phrase: Phrase, ctx: ContexteAnalyse, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

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

    return elementTrouve;
  }


}