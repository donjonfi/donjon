import { CompilateurV8 } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

/** Compile AVEC les actions de base (parler/interroger/…), absentes de genererEtCommencerLeJeu. */
function compilerAvecActions(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  return new ContextePartie(Generateur.genererJeu(rc));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//   [F077] GROUPES NOMINAUX — résolution d'un élément à attribut ANTÉPOSÉ par les chemins annexes
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// La DÉFINITION d'un élément passe par le nouvel analyseur central (GroupeNominal.analyser), qui
// sépare l'attribut antéposé : « Le grand chat poilu » → nom=chat, avant=[grand], après=poilu.
//
// Mais plusieurs CHEMINS qui DÉSIGNENT un élément déjà défini (propriété explicite, synonyme,
// interlocuteur de réaction, génération singulier/pluriel, contenu de liste) ont leur propre
// décomposition de groupe nominal (l'ancienne ExprReg.xGroupeNominalArticleDefini, qui ne sépare
// PAS l'attribut antéposé). Ces tests vérifient que ces chemins restent cohérents avec la définition.
//
// Plusieurs de ces tests ÉCHOUENT tant que ces chemins n'ont pas été alignés sur l'analyseur
// central — c'est leur rôle : caractériser les oublis (partie A de la revue).
//
// Chemins INVESTIGUÉS et écartés (pas de test) :
//  - FOND (analyseur.fond.ts) : les fonds (sol/mur/plafond/ciel) se nomment par attribut postposé
//    (« le sol sale ») ; un attribut antéposé n'y est pas naturel.
//  - COMPTEUR runtime (compteurs-utils.ts:227) : résolution d'une valeur-nombre via le nom d'un
//    compteur ; le cas « compteur nommé avec un attribut antéposé servant de valeur » est trop
//    contrivé pour constituer un test représentatif.

describe("[F077] Résolution annexe d'un élément à attribut antéposé", () => {

  // ----------------------------------------------------------------------------------------------
  //  A1 — Propriété attribuée via l'intitulé COMPLET (« La description du grand chat poilu … »)
  // ----------------------------------------------------------------------------------------------
  it("[F077-T130] propriété explicite : « La description du grand chat poilu est … » s'attache", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le grand chat poilu est un objet ici.
      La description du grand chat poilu est "Un félin majestueux.".
    `);
    const chat = ctx.jeu.objets.find(o => o.intitule?.nom === "chat");
    expect(chat).toBeDefined();
    expect(chat.description).toBe("Un félin majestueux.");
  });

  // ----------------------------------------------------------------------------------------------
  //  A1 — Synonyme statique d'un élément référencé par son intitulé complet
  // ----------------------------------------------------------------------------------------------
  it("[F077-T131] synonyme : « Interpréter minou comme le grand chat poilu » s'attache", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le grand chat poilu est un objet ici.
      Interpréter minou comme le grand chat poilu.
    `);
    const chat = ctx.jeu.objets.find(o => o.intitule?.nom === "chat");
    expect(chat).toBeDefined();
    expect(chat.synonymes.some(s => s.nom === "minou")).toBeTrue();
  });

  // ----------------------------------------------------------------------------------------------
  //  A2 — Interlocuteur d'une réaction nommé avec un attribut antéposé
  // ----------------------------------------------------------------------------------------------
  // Contrôle : nom SIMPLE. Doit passer — valide que le setup (actions de base + réaction) est correct.
  it("[F077-T132a] contrôle : « parler avec la vendeuse » (nom simple) déclenche la réaction", () => {
    const ctx = compilerAvecActions(`
      La boutique est un lieu.
      La vendeuse est une personne dans la boutique.

      réactions de la vendeuse:
        basique:
          dire "Bienvenue !".
      fin réactions
    `);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("parler avec la vendeuse", false).sortie;
    expect(sortie).toContain("Bienvenue"); // (espace insécable avant « ! » → on ne teste que le mot)
  });

  // Détecteur : nom ANTÉPOSÉ. Si T132a passe et celui-ci échoue → bug runtime sur l'attribut antéposé.
  it("[F077-T132b] interlocuteur « la grande vendeuse » (antéposé) déclenche la réaction", () => {
    const ctx = compilerAvecActions(`
      La boutique est un lieu.
      La grande vendeuse est une personne dans la boutique.

      réactions de la grande vendeuse:
        basique:
          dire "Bienvenue !".
      fin réactions
    `);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("parler avec la grande vendeuse", false).sortie;
    expect(sortie).toContain("Bienvenue"); // (espace insécable avant « ! » → on ne teste que le mot)
  });

  // ----------------------------------------------------------------------------------------------
  //  A3 — Génération du singulier/pluriel : l'attribut antéposé doit s'accorder en nombre
  // ----------------------------------------------------------------------------------------------
  it("[F077-T133] pluriel → singulier : « Les grands coffres » → intituléS = « grand coffre »", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Les grands coffres sont des objets ici.
    `);
    const coffre = ctx.jeu.objets.find(o => o.intitule?.nom === "coffre" || o.intitule?.nom === "coffres");
    expect(coffre).toBeDefined();
    expect(coffre.intituleS.nomEpithete).toBe("grand coffre");
  });

  it("[F077-T134] singulier → pluriel : « Le grand coffre » → intituléP = « grands coffres »", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le grand coffre est un objet ici.
    `);
    const coffre = ctx.jeu.objets.find(o => o.intitule?.nom === "coffre");
    expect(coffre).toBeDefined();
    expect(coffre.intituleP.nomEpithete).toBe("grands coffres");
  });

  // ----------------------------------------------------------------------------------------------
  //  A1 — Contenu de liste référencé par intitulé complet (« Elle contient le grand chat poilu. »)
  //       Assertion au niveau COMPILATEUR : la valeur-intitulé stockée doit refléter l'intitulé
  //       complet (avant + nom + après), pas une décomposition tronquée par l'ancienne regex.
  // ----------------------------------------------------------------------------------------------
  it("[F077-T136] liste : « Elle contient le grand chat poilu » stocke l'intitulé complet", () => {
    const rc = CompilateurV8.analyserScenarioSeul(`
      Le bois est un lieu.
      Le grand chat poilu est un objet ici.
      Les animaux observés sont une liste. Elle contient le grand chat poilu.
    `);
    expect(rc.erreurs.length).withContext("aucune erreur de compilation").toBe(0);
    expect(rc.listes.length).toBeGreaterThan(0);
    const valeurs = rc.listes[0]?.valeursIntitule ?? [];
    expect(valeurs.length).toBe(1);
    expect(valeurs[0]?.nom).toBe("chat");
    expect(valeurs[0]?.epithetesAvant).toEqual(["grand"]);
    expect(valeurs[0]?.nomEpithete).toBe("grand chat poilu");
  });

  // ----------------------------------------------------------------------------------------------
  //  A4 — Déterminant INDÉFINI réservé aux ressources : aucune des deux formes (non positionnée
  //       « Une pomme est un objet » ; positionnée « Un chat est un objet dans le bois ») ne doit
  //       créer un objet ordinaire non-ressource. Régression de la règle « un/une/des = ressource ».
  //       (Empiriquement : la forme positionnée est rejetée par un message ; la non positionnée est
  //       silencieusement ignorée. Les deux tests vérifient l'absence d'objet créé.)
  // ----------------------------------------------------------------------------------------------
  it("[F077-T135a] non positionnée : « Une pomme est un objet » ne crée pas d'objet ordinaire", () => {
    const rc = CompilateurV8.analyserScenarioSeul(`
      Le bois est un lieu.
      Une pomme est un objet.
    `);
    const pomme = rc.monde.objets.find(e => e.nom?.toLowerCase() === "pomme"
      && e.classeIntitule !== "ressource");
    expect(pomme).withContext("aucun objet non-ressource ne doit être créé avec « une »").toBeUndefined();
  });

  it("[F077-T135b] positionnée : « Un chat est un objet dans le bois » ne crée pas d'objet ordinaire", () => {
    const rc = CompilateurV8.analyserScenarioSeul(`
      Le bois est un lieu.
      Un chat est un objet dans le bois.
    `);
    const chat = rc.monde.objets.find(e => e.nom?.toLowerCase() === "chat"
      && e.classeIntitule !== "ressource");
    expect(chat).withContext("aucun objet non-ressource ne doit être créé avec « un » positionné").toBeUndefined();
  });
});
