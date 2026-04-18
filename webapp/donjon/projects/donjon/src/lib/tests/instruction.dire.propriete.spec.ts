import { TestUtils } from "../utils/test-utils";

// =====================================================
// #186 — Propriété d'un objet via [prop nomObjet]
// =====================================================

describe('Balise [prop nomObjet] dans dire — #186', () => {

  it('[affichage ceci] dans dire fonctionne (ceci = pomme)', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La pomme est un objet vu dans le salon.
Son affichage est "POMME".
action montrer ceci:
  dire "[affichage ceci]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('montrer la pomme', false);
    expect(ctx.sortie).toEqual('POMME{n}');
  });

  it('[affichage nomObjet] dans dire fonctionne (nom direct)', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La pomme est un objet dans le salon.
Son affichage est "POMME".
action montrer:
  dire "[affichage pomme]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('montrer', false);
    expect(ctx.sortie).toEqual('POMME{n}');
  });

});

describe('Balise [prop nomObjet] dans changer liste — #186', () => {

  it('[affichage nomObjet] stocké dans liste, affiché via lister', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La pomme est un objet dans le salon.
Son affichage est "POMME".
La objetTable est une liste.
action stocker:
  changer objetTable contient "[affichage pomme]".
  dire "[lister objetTable]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('stocker', false);
    expect(ctx.sortie).not.toContain('@problème balise@');
    expect(ctx.sortie).toContain('"POMME"');
  });

  it('[affichage ceci] stocké dans liste via changer, affiché via lister', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La pomme est un objet vu dans le salon.
Son affichage est "POMME".
La objetTable est une liste.
action stocker ceci:
  changer objetTable contient "[affichage ceci]".
  dire "[lister objetTable]{n}".
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const ctx = ctxPartie.com.executerCommande('stocker la pomme', false);
    expect(ctx.sortie).not.toContain('@problème balise@');
    expect(ctx.sortie).toContain('"POMME"');
  });

});
