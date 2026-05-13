import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Régression : un personnage dont l'intitulé commence par « L » + lettre accentuée
 * (ex: « Léon ») doit être correctement reconnu :
 *   1. au moment de la compilation (élément créé),
 *   2. comme déclencheur d'une règle (« règle avant parler à Léon »),
 *   3. comme valeur de comparaison dans une condition (« si ceci est Léon »),
 *      y compris sans article — comparaison directe entre `ceci` et l'élément
 *      nommé du jeu (gérée dans `verifierConditionEst`).
 */

const scenarioLeon = `
Le salon est un lieu.
Léon est une personne ici.

règle avant parler à Léon:
  dire "Mauvaise idée !".
  refuser l’action.
fin règle

règle avant examiner ceci:
  si ceci est Léon:
    dire "Vous n’allez pas examiner Léon !".
    refuser l’action.
  fin si
fin règle
`;

// Version « Bob » de référence pour comparaison (nom sans accent).
const scenarioBob = `
Le salon est un lieu.
Bob est une personne ici.

règle avant parler à Bob:
  dire "Mauvaise idée !".
  refuser l’action.
fin règle

règle avant examiner ceci:
  si ceci est Bob:
    dire "Vous n’allez pas examiner Bob !".
    refuser l’action.
  fin si
fin règle
`;

function preparerJeu(scenario: string) {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
  expect(rc.erreurs).toHaveSize(0);
  const jeu = Generateur.genererJeu(rc);
  const ctxPartie = new ContextePartie(jeu);
  ctxPartie.com.executerCommande("commencer le jeu", true);
  return ctxPartie;
}

describe('Règle/condition avec nom accentué (« Léon »)', () => {

  it('[F029-T001] le scénario compile sans erreur', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioLeon, actions, true);
    expect(rc.erreurs).toHaveSize(0);
    const jeu = Generateur.genererJeu(rc);
    // Léon doit exister dans le jeu
    const leon = jeu.objets.find(o => o.intitule?.toString().toLowerCase().includes('léon'));
    expect(leon).toBeTruthy();
  });

  it('[F029-T002] « parler à Léon » déclenche la règle avant', () => {
    const ctx = preparerJeu(scenarioLeon);
    const sortie = ctx.com.executerCommande("parler à Léon", false).sortie;
    expect(sortie).toContain("Mauvaise idée");
  });

  it('[F029-T003] « examiner Léon » déclenche la condition « si ceci est Léon »', () => {
    const ctx = preparerJeu(scenarioLeon);
    const sortie = ctx.com.executerCommande("examiner Léon", false).sortie;
    expect(sortie).toContain("Vous n’allez pas examiner Léon");
  });

  // Test de contrôle : la même structure avec « Bob » (nom sans accent).
  it('[F029-T004] référence « Bob » : « parler à Bob » déclenche la règle avant', () => {
    const ctx = preparerJeu(scenarioBob);
    const sortie = ctx.com.executerCommande("parler à Bob", false).sortie;
    expect(sortie).toContain("Mauvaise idée");
  });

  it('[F029-T005] référence « Bob » : « examiner Bob » déclenche « si ceci est Bob »', () => {
    const ctx = preparerJeu(scenarioBob);
    const sortie = ctx.com.executerCommande("examiner Bob", false).sortie;
    expect(sortie).toContain("Vous n’allez pas examiner Bob");
  });

  it('[F029-T006] « si ceci est Léon » ne pousse PAS de conseil (Léon est un élément connu)', () => {
    const ctx = preparerJeu(scenarioLeon);
    const avant = ctx.jeu.tamponConseils.length;
    ctx.com.executerCommande("examiner Léon", false);
    const conseils = ctx.jeu.tamponConseils.slice(avant);
    expect(conseils.some(c => c.includes("Léon"))).toBeFalse();
  });

  it('[F029-T008] pas de conseil parasite « examiner » via scenario_actions ; conseil légitime pour état inexistant « épuisé »', () => {
    const scenarioImbrique = `
Le salon est un lieu.
Léon est une personne ici.

règle avant examiner ceci:
  si ceci est Léon:
    dire "Vous n’allez pas examiner Léon !".
    si léon est épuisé:
      dire "Léon est épuisé.".
    sinon
      dire "Léon a encore de l’énergie.".
    fin si
    refuser l’action.
  fin si
fin règle
`;
    const ctx = preparerJeu(scenarioImbrique);
    const avant = ctx.jeu.tamponConseils.length;
    ctx.com.executerCommande("examiner Léon", false);
    const conseils = ctx.jeu.tamponConseils.slice(avant);
    // Ne doit PAS pousser de conseil "examiner" (verbe d'action, pas un état)
    expect(conseils.some(c => c.includes("examiner"))).toBeFalse();
    // Doit pousser le conseil pour "épuisé" (état réellement inexistant)
    expect(conseils.some(c => c.includes("épuisé"))).toBeTrue();
  });

  it('[F029-T007] un complément inconnu (ni état, ni élément) pousse un conseil', () => {
    const scenarioTypo = `
Le salon est un lieu.
Léon est une personne ici.

règle avant examiner ceci:
  si ceci est inexistant:
    dire "Ne sera jamais affiché.".
  fin si
fin règle
`;
    const ctx = preparerJeu(scenarioTypo);
    const avant = ctx.jeu.tamponConseils.length;
    ctx.com.executerCommande("examiner Léon", false);
    const conseils = ctx.jeu.tamponConseils.slice(avant);
    expect(conseils.some(c => c.includes("inexistant"))).toBeTrue();
  });

});
