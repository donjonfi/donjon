import { TestUtils } from "../utils/test-utils";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//   [F077] GROUPES NOMINAUX — intégration compilation (définition d’objets à attributs avant/après)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// Vérifie que la définition d’un objet portant un attribut ANTÉPOSÉ et/ou des attributs postposés
// COORDONNÉS produit le bon intitulé compilé. (La résolution par commande joueur « examiner … »
// relève de l’étape 5 ; le matching partiel en partie, de l’étape 6.)

describe("[F077] Intégration — définition d’objets avec attributs", () => {

  it("[F077-T100] « Le grand chat poilu est un objet » → nom=chat, avant=[grand], après=poilu", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le grand chat poilu est un objet.
    `);
    const chat = ctx.jeu.objets.find(o => o.intitule?.nom === "chat");
    expect(chat).toBeDefined();
    expect(chat.intitule.nom).toBe("chat");
    expect(chat.intitule.epithetesAvant).toEqual(["grand"]);
    expect(chat.intitule.epithete).toBe("poilu");
    expect(chat.intitule.nomEpithete).toBe("grand chat poilu");
    expect(chat.nom).toBe("grand chat poilu"); // Objet.nom = nomEpithete complet
  });

  it("[F077-T101] « Le chaton rouge et blanc est un objet » → après coordonné", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le chaton rouge et blanc est un objet.
    `);
    const chaton = ctx.jeu.objets.find(o => o.intitule?.nom === "chaton");
    expect(chaton).toBeDefined();
    expect(chaton.intitule.nom).toBe("chaton");
    expect(chaton.intitule.epithete).toBe("rouge et blanc");
    expect(chaton.intitule.nomEpithete).toBe("chaton rouge et blanc");
  });

  it("[F077-T102] « La tache de sang séché est un objet » → nom composé + après (inchangé)", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      La tache de sang séché est un objet.
    `);
    const tache = ctx.jeu.objets.find(o => o.intitule?.nom === "tache de sang");
    expect(tache).toBeDefined();
    expect(tache.intitule.epithete).toBe("séché");
    expect(tache.intitule.epithetesAvant).toEqual([]);
  });

  it("[F077-T103] « La belle salle de bain est un objet » → avant=[belle], nom composé", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      La belle salle de bain est un objet.
    `);
    const salle = ctx.jeu.objets.find(o => o.intitule?.nom === "salle de bain");
    expect(salle).toBeDefined();
    expect(salle.intitule.epithetesAvant).toEqual(["belle"]);
    expect(salle.intitule.nomEpithete).toBe("belle salle de bain");
  });

  // --- définitions POSITIONNÉES (regex dérivée xPositionElementGeneriqueDefini1GN) ---

  it("[F077-T110] positionné « … dans le bois » avec attribut antéposé", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le grand chat poilu est un objet dans le bois.
    `);
    const chat = ctx.jeu.objets.find(o => o.intitule?.nom === "chat");
    expect(chat).toBeDefined();
    expect(chat.intitule.epithetesAvant).toEqual(["grand"]);
    expect(chat.intitule.epithete).toBe("poilu");
    expect(chat.intitule.nomEpithete).toBe("grand chat poilu");
  });

  it("[F077-T111] positionné « … ici » avec attributs coordonnés", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      Le bois est un lieu.
      Le chaton rouge et blanc est un objet ici.
    `);
    const chaton = ctx.jeu.objets.find(o => o.intitule?.nom === "chaton");
    expect(chaton).toBeDefined();
    expect(chaton.intitule.epithete).toBe("rouge et blanc");
    expect(chaton.intitule.nomEpithete).toBe("chaton rouge et blanc");
  });

  // --- résolution de commande joueur (étape 5) + matching tolérant en partie (étape 6) ---

  /** Résout le complément direct (ceci) d'une commande et indique si l'objet « chat » est trouvé. */
  function resoutLeChat(scenario: string, commande: string): boolean {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.decomposerCommande(commande);
    const elems = ctxCom.candidats?.[0]?.correspondCeci?.elements ?? [];
    return elems.some((e: any) => e.intitule?.nom === "chat");
  }

  const SCENARIO_CHAT = `
    Le bois est un lieu.
    Le grand chat poilu est un objet ici.
  `;

  it("[F077-T120] commande EXACTE : « examiner le grand chat poilu » résout l'objet", () => {
    expect(resoutLeChat(SCENARIO_CHAT, "examiner le grand chat poilu")).toBeTrue();
  });

  it("[F077-T121] en partie : « examiner le chat » (morceau) retrouve « le grand chat poilu »", () => {
    expect(resoutLeChat(SCENARIO_CHAT, "examiner le chat")).toBeTrue();
  });

  it("[F077-T122] en partie : « examiner le chat poilu » (morceau ordonné) résout aussi", () => {
    expect(resoutLeChat(SCENARIO_CHAT, "examiner le chat poilu")).toBeTrue();
  });

  it("[F077-T123] en partie : « examiner le chat bleu » (mauvais attribut) ne résout PAS", () => {
    expect(resoutLeChat(SCENARIO_CHAT, "examiner le chat bleu")).toBeFalse();
  });
});
