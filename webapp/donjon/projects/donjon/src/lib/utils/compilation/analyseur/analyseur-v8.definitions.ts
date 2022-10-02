import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { AnalyseurAttributs } from "./analyseur.attributs";
import { AnalyseurBeta } from "./analyseur-beta";
import { AnalyseurCapacite } from "./analyseur.capacite";
import { AnalyseurDivers } from "./analyseur.divers";
import { AnalyseurElementPosition } from "./analyseur.element.position";
import { AnalyseurElementSimple } from "./analyseur.element.simple";
import { AnalyseurListe } from "./analyseur.liste";
import { AnalyseurPosition } from "./analyseur.position";
import { AnalyseurPropriete } from "./analyseur.propriete";
import { AnalyseurSynonymes } from "./analyseur.synonymes";
import { AnalyseurType } from "./analyseur.type";
import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { EClasseRacine } from "../../../models/commun/constantes";
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
      definitionTrouvee = true;
    } else {
      ctx.logResultatKo(`pas trouvé définition`);
      definitionTrouvee = false;
      ctx.probleme(phrase, undefined, 
        CategorieMessage.syntaxeDefinition, CodeMessage.definitionAction, 
        "Définition attendue",
        `Une définition est attendue ici mais la phrase ne ressemble pas à une formulation de définition connue.`
        );
    }
    // passer à la phrase suivante
    ctx.indexProchainePhrase++;
    return definitionTrouvee;
  }

  public static testerDefinition(phrase: Phrase, ctx: ContexteAnalyseV8): ResultatAnalysePhrase {
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
      elementTrouve = this.testerDefinitionElement(phrase, ctx);
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
  private static testerCommentaireEtSection(phrase: Phrase, ctx: ContexteAnalyseV8, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // COMMENTAIRE (-- commentaire)
    // rem: normalement les commentaires sont déjà retirés du scénario avant d’arriver ici.
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      if (phrase.morceaux[0].trim().slice(0, 2) === "--") {
        phrase.traitee = true;
        elementTrouve = ResultatAnalysePhrase.commentaire;
        ctx.logResultatOk(`commentaire trouvé`);
      }
    }

    // ===============================================
    // SECTIONS (parties, chapitres, ...)
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerSection(phrase, ctx);
      if (elementTrouve === ResultatAnalysePhrase.section) {
        ctx.logResultatOk(`section trouvée`);
      }
    }

    return elementTrouve;
  }

  /** 
   * Tester si la phrase définit l'aide pour une action.
   * Ex: 
   *  - L'aide pour l'action regarder est "{*Regarder*}{n}Permet de regarder autours de vous.".
   */
  private static testerAide(phrase: Phrase, ctx: ContexteAnalyseV8, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // AIDE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerAide(phrase, ctx);
      if (elementTrouve === ResultatAnalysePhrase.aide) {
        ctx.logResultatOk(`fiche aide trouvée`);
      }
    }
    return elementTrouve;
  }

  /** 
   * Tester si la phrase (dés)active un paramètre.
   * Ex: 
   *  - Désactiver l'affichage des sorties.
   */
  private static testerParametre(phrase: Phrase, ctx: ContexteAnalyseV8, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // ACTIVER / DÉSACTIVER PARAMÈTRE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurDivers.testerActiverDesactiverParametre(phrase, ctx);
      if (elementTrouve === ResultatAnalysePhrase.activerParametre) {
        ctx.logResultatOk("trouvé (dé)activation paramètre");
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
  private static testerSynonymeEtAbreviation(phrase: Phrase, ctx: ContexteAnalyseV8, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // SYNONYMES
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurSynonymes.testerSynonyme(phrase, ctx)
      if (elementTrouve === ResultatAnalysePhrase.synonyme) {
        ctx.logResultatOk("trouvé synonyme(s)");
      }
    }

    // ===============================================
    // ABRÉVIATIONS
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurSynonymes.testerAbreviation(phrase, ctx)
      if (elementTrouve === ResultatAnalysePhrase.abreviation) {
        ctx.logResultatOk("trouvé abrévitation");
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
  private static testerType(phrase: Phrase, ctx: ContexteAnalyseV8, elementTrouve: ResultatAnalysePhrase): ResultatAnalysePhrase {

    // ===============================================
    // NOUVEAU TYPE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurType.testerNouveauType(phrase, ctx);
      if (elementTrouve === ResultatAnalysePhrase.type) {
        ctx.logResultatOk("trouvé type");
      }
    }

    // ===============================================
    // PRÉCISION TYPE
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurType.testerPrecisionType(phrase, ctx);
      if (elementTrouve === ResultatAnalysePhrase.precisionType) {
        ctx.logResultatOk("trouvé précision type");
      }
    }

    return elementTrouve;
  }

  private static testerDefinitionElement(phrase: Phrase, ctx: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // ===================================================================
    // ÉLÉMENT 0 - TESTER POSITION ÉLÉMENT
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
    // ÉLÉMENT 1 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) AVEC POSITION
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
    // ÉLÉMENT 2 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) SANS POSITION
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
    // ÉLÉMENT 3 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM DÉMONSTRATIF (C’EST UN) > TYPE + ATTRIBUTS
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
    // ÉLÉMENT 4 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL (IL/ELLE) > POSITION
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
    // ÉLÉMENT 5 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL (IL/ELLE) > ATTRIBUT
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
    // ÉLÉMENT 6 - PROPRIÉTÉ/RÉACTION SE RAPPORTANT À UN ÉLÉMENT EXISTANT
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
    // ÉLÉMENT 7 - CAPACITÉ SE RAPPORTANT À UN ÉLÉMENT EXISTANT
    // ==========================================================================================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      elementTrouve = AnalyseurCapacite.testerPourCapacite(phrase, ctx);
      if (ctx.verbeux && elementTrouve === ResultatAnalysePhrase.capacite) {
        console.log("=> trouvé capacité :", ctx.dernierElementGenerique);
      }
    }

    return elementTrouve;

  }


}