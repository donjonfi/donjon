import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// =====================================================
// #185 — Balise [énumérer] : liste de mots séparés par des virgules
// =====================================================

// -------------------------------------------------------
//  [énumérer maListe] — valeurs d'une liste
// -------------------------------------------------------

describe('Balise [énumérer maListe] — #185', () => {

  it('[F033-T001] [énumérer maListe] avec 1 élément : pas de virgule ni de "et"', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  dire "[énumérer maListe]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('tester', false);
    expect(ctx.sortie).toContain('pomme');
    expect(ctx.sortie).not.toContain(',');
    expect(ctx.sortie).not.toContain(' et ');
    expect(ctx.sortie).not.toContain('@problème balise@');
  });

  it('[F033-T002] [énumérer maListe] avec 2 éléments : séparés par "et" sans virgule', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  changer maListe contient "livre".
  dire "[énumérer maListe]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('tester', false);
    expect(ctx.sortie).toContain('pomme');
    expect(ctx.sortie).toContain('livre');
    expect(ctx.sortie).toContain(' et ');
    expect(ctx.sortie).not.toContain(',');
  });

  it('[F033-T003] [énumérer maListe] avec 3 éléments : virgules + "et" avant le dernier', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  changer maListe contient "livre".
  changer maListe contient "clé".
  dire "[énumérer maListe]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('tester', false);
    expect(ctx.sortie).toContain('pomme');
    expect(ctx.sortie).toContain('livre');
    expect(ctx.sortie).toContain('clé');
    expect(ctx.sortie).toContain(',');
    expect(ctx.sortie).toContain(' et ');
  });

  it('[F033-T004] [énumérer maListe] avec liste vide : produit une chaîne vide (intégrable dans une phrase)', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  dire "avant[énumérer maListe]après{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('tester', false);
    expect(ctx.sortie).toContain('avantaprès');
  });

  it('[F033-T005] [énumérer maListe] intégré dans une phrase prédéfinie', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  changer maListe contient "livre".
  dire "Dans le coffre : [énumérer maListe].{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('tester', false);
    expect(ctx.sortie).toContain('Dans le coffre :');
    expect(ctx.sortie).toContain('pomme');
    expect(ctx.sortie).toContain('livre');
    expect(ctx.sortie).not.toContain('•');
    expect(ctx.sortie).not.toContain('@problème balise@');
  });

});

// -------------------------------------------------------
//  [énumérer objets dans/sur <contenant>] — contenants
// -------------------------------------------------------

describe('Balise [énumérer objets dans <contenant>] — #185', () => {

  it('[F033-T006] [énumérer objets dans le coffre] — 1 objet : pas de virgule ni de "et"', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).toContain("pomme");
    expect(sortie.sortie).not.toContain(" et ");
    expect(sortie.sortie).not.toContain(",");
    expect(sortie.sortie).not.toContain("Dedans");
    expect(sortie.sortie).not.toContain("•");
  });

  it('[F033-T007] [énumérer objets dans le coffre] — 2 objets : séparés par "et"', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).toContain("pomme");
    expect(sortie.sortie).toContain("livre");
    expect(sortie.sortie).toContain(" et ");
    expect(sortie.sortie).not.toContain(",");
  });

  it('[F033-T008] [énumérer objets dans le coffre] — 3 objets : virgules + "et" avant le dernier', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. " +
      "La clé est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).toContain("pomme");
    expect(sortie.sortie).toContain("livre");
    expect(sortie.sortie).toContain("clé");
    expect(sortie.sortie).toContain(",");
    expect(sortie.sortie).toContain(" et ");
  });

  it('[F033-T009] [énumérer objets dans le coffre] — coffre vide : chaîne vide (intégrable dans une phrase)', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"avant[énumérer objets dans le coffre]après\". ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).toContain("avantaprès");
  });

  it('[F033-T010] [énumérer objets dans ceci] — cible spéciale', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"[énumérer objets dans ceci]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le coffre", false);
    expect(sortie.sortie).toContain("pomme");
    expect(sortie.sortie).toContain("livre");
    expect(sortie.sortie).toContain(" et ");
  });

  it('[F033-T011] [énumérer objets dans le coffre] intégré dans une phrase prédéfinie', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"Dans le coffre, il y a [énumérer objets dans le coffre].\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).toContain("Dans le coffre, il y a");
    expect(sortie.sortie).toContain("pomme");
    expect(sortie.sortie).toContain("livre");
    expect(sortie.sortie).not.toContain("•");
    expect(sortie.sortie).not.toContain("Dedans");
  });

});
