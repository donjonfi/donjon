import { CompilateurV8, Generateur } from "../../public-api";

import { actions as scenarioActions } from "./scenario_actions";

// Le scénario est inliné ici (les tests Karma ne peuvent pas lire le disque).
// Ceci est le miroir de ressources/scenarios/exemples/etats/etats_personnalises_dragon_licorne.djn
const scenario = `
Le titre du jeu est "Test − états personnalisés : dragon et licorne".
L'auteur du jeu est "DonjonFI".

enchanté est un état.
enragé est un état.
malade est un état.
maudit est un état.

féroce et paisible forment une bascule.
pure et corrompue forment une bascule.

éveillé, endormi et hiverné se contredisent.

enragé implique éveillé.

pure exclut malade et maudit.

La clairière enchantée est un lieu.

La grotte du dragon est un lieu au nord de la clairière enchantée.

Le dragon est un animal féroce et éveillé dans la grotte du dragon.
La licorne est un animal pure et éveillée dans la clairière enchantée.

La lance enchantée est un objet enchanté et non décoratif dans la clairière enchantée.
La pomme magique est un objet enchanté et mangeable dans la clairière enchantée.
La pomme magique n'est pas mangeable.
`;

describe("Scénario : dragon et licorne (états personnalisés)", () => {

  it("[F004-T200] compile sans erreur et génère le jeu", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    expect(rc.erreurs?.length ?? 0).toBe(0);
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F004-T201] les 11 états personnalisés sont créés avec leurs relations", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    const jeu = Generateur.genererJeu(rc);
    // états simples
    const enchante = jeu.etats.trouverEtatSilencieux("enchanté");
    const enrage = jeu.etats.trouverEtatSilencieux("enragé");
    const malade = jeu.etats.trouverEtatSilencieux("malade");
    const maudit = jeu.etats.trouverEtatSilencieux("maudit");
    expect(enchante).not.toBeNull();
    expect(enrage).not.toBeNull();
    expect(malade).not.toBeNull();
    expect(maudit).not.toBeNull();
    // bascules
    const feroce = jeu.etats.trouverEtatSilencieux("féroce");
    const paisible = jeu.etats.trouverEtatSilencieux("paisible");
    expect(feroce.bascule).toBe(paisible.id);
    expect(paisible.bascule).toBe(feroce.id);
    const pure = jeu.etats.trouverEtatSilencieux("pure");
    const corrompue = jeu.etats.trouverEtatSilencieux("corrompue");
    expect(pure.bascule).toBe(corrompue.id);
    expect(corrompue.bascule).toBe(pure.id);
    // groupe
    const eveille = jeu.etats.trouverEtatSilencieux("éveillé");
    const endormi = jeu.etats.trouverEtatSilencieux("endormi");
    const hiverne = jeu.etats.trouverEtatSilencieux("hiverné");
    expect(eveille.groupe).not.toBeNull();
    expect(endormi.groupe).toBe(eveille.groupe);
    expect(hiverne.groupe).toBe(eveille.groupe);
    // implication
    expect(enrage.implications).toContain(eveille.id);
    // exclusion (bilatérale, liste 2)
    expect(pure.contradictions).toContain(malade.id);
    expect(pure.contradictions).toContain(maudit.id);
    expect(malade.contradictions).toContain(pure.id);
    expect(maudit.contradictions).toContain(pure.id);
    // mais malade et maudit ne se contredisent PAS entre eux
    expect((malade.contradictions || []).includes(maudit.id)).toBe(false);
  });

  it("[F004-T202] dragon initial : féroce + éveillé", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    const jeu = Generateur.genererJeu(rc);
    const dragon = jeu.objets.find(o => o.nom === "dragon");
    expect(dragon).toBeDefined();
    const feroce = jeu.etats.trouverEtatSilencieux("féroce");
    const eveille = jeu.etats.trouverEtatSilencieux("éveillé");
    expect(dragon.etats).toContain(feroce.id);
    expect(dragon.etats).toContain(eveille.id);
  });

  it("[F004-T203] licorne initiale : pure + éveillée", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    const jeu = Generateur.genererJeu(rc);
    const licorne = jeu.objets.find(o => o.nom === "licorne");
    expect(licorne).toBeDefined();
    const pure = jeu.etats.trouverEtatSilencieux("pure");
    const eveille = jeu.etats.trouverEtatSilencieux("éveillé");
    expect(licorne.etats).toContain(pure.id);
    expect(licorne.etats).toContain(eveille.id);
  });

  it("[F004-T204] négation inline : la lance n'est PAS décorative", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    const jeu = Generateur.genererJeu(rc);
    const lance = jeu.objets.find(o => o.nom.startsWith("lance"));
    expect(lance).toBeDefined();
    const decoratif = jeu.etats.trouverEtatSilencieux("décoratif");
    expect(lance.etats).not.toContain(decoratif.id);
    // mais a bien l'état enchanté
    const enchante = jeu.etats.trouverEtatSilencieux("enchanté");
    expect(lance.etats).toContain(enchante.id);
  });

  it("[F004-T205] négation verbale : la pomme n'est PAS mangeable", () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, scenarioActions, false);
    const jeu = Generateur.genererJeu(rc);
    const pomme = jeu.objets.find(o => o.nom.startsWith("pomme"));
    expect(pomme).toBeDefined();
    const mangeable = jeu.etats.trouverEtatSilencieux("mangeable");
    expect(pomme.etats).not.toContain(mangeable.id);
  });

});
