import { TestUtils } from "../utils/test-utils";

// =====================================================
// #174 — "ce dernier" et "le [verbe]"
// =====================================================

// Note : les actions avec "un objet" (classe) fonctionnent correctement dans
// trouverActionPersonnalisee (cibleCeci défini), contrairement au "ceci" générique.
const scenarioBase = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La pomme est un objet dans le salon.
Le livre est un objet dans le salon.
action voir un objet:
  dire "Vous voyez [intitule ceci].{n}".
fin action
`;

describe('"ce dernier" — référence au dernier élément manipulé — #174', () => {

  it('après "voir la pomme", "voir ce dernier" voit la pomme', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir la pomme', false);
    const sortie = ctxPartie.com.executerCommande('voir ce dernier', false);
    expect(sortie.sortie).toContain('pomme');
  });

  it('après "voir le livre", "voir ce dernier" voit le livre', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir le livre', false);
    const sortie = ctxPartie.com.executerCommande('voir ce dernier', false);
    expect(sortie.sortie).toContain('livre');
  });

  it('"ce dernier" se met à jour : après pomme puis livre, "ce dernier" = livre', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir la pomme', false);
    ctxPartie.com.executerCommande('voir le livre', false);
    const sortie = ctxPartie.com.executerCommande('voir ce dernier', false);
    expect(sortie.sortie).toContain('livre');
    expect(sortie.sortie).not.toContain('pomme');
  });

  it('"ce dernier" sans manipulation préalable ne cause pas de crash', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    expect(() => ctxPartie.com.executerCommande('voir ce dernier', false)).not.toThrow();
  });

});

const scenarioPorte = `
Le joueur se trouve dans le couloir.
Le couloir est un lieu.
La porte est un objet dans le couloir.
action voir un objet:
  dire "Vous voyez [intitule ceci].{n}".
fin action
action ouvrir un objet:
  dire "Vous ouvrez [intitule ceci].{n}".
fin action
`;

describe('"le/la/les/l\' [verbe]" — raccourci pour "[verbe] ce dernier" — #174', () => {

  it('"la voir" après "voir la pomme" voit la pomme', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir la pomme', false);
    const sortie = ctxPartie.com.executerCommande('la voir', false);
    expect(sortie.sortie).toContain('pomme');
  });

  it('"le voir" après "voir le livre" voit le livre', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir le livre', false);
    const sortie = ctxPartie.com.executerCommande('le voir', false);
    expect(sortie.sortie).toContain('livre');
  });

  it('"la clé" n\'est PAS interprété comme "[verbe] ce dernier" (pas de terminaison er/ir/re)', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    const sortie = ctxPartie.com.executerCommande('la clé', false);
    expect(sortie.sortie).not.toContain('Vous voyez');
  });

  it('"l\'ouvrir" après "voir la porte" ouvre la porte', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPorte, false);
    ctxPartie.com.executerCommande('voir la porte', false);
    const sortie = ctxPartie.com.executerCommande("l'ouvrir", false);
    expect(sortie.sortie).toContain('porte');
  });

});

const scenarioPorteObstacle = `
Le joueur se trouve dans l'entrée.
L'entrée est un lieu.
Le couloir est un lieu au nord de l'entrée.
La porte en fer est une porte fermée au nord de l'entrée.
action regarder:
  dire "[décrire objets ici]".
fin action
action ouvrir une porte:
  dire "Vous ouvrez [intitule ceci].{n}".
fin action
`;

describe('"ce dernier" — porte/obstacle décrit dans la description du lieu — #174', () => {

  it('après "regarder", derniersElementIds contient la porte en fer', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPorteObstacle, false);
    ctxPartie.com.executerCommande('regarder', false);
    const porte = ctxPartie.jeu.objets.find(o => o.nom === 'porte en fer');
    expect(ctxPartie.jeu.derniersElementIds).toContain(porte.id);
  });

  it('après "regarder" qui décrit la porte, "l\'ouvrir" ouvre la porte en fer', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPorteObstacle, false);
    ctxPartie.com.executerCommande('regarder', false);
    const sortie = ctxPartie.com.executerCommande("l'ouvrir", false);
    expect(sortie.sortie).toContain('porte en fer');
  });

});

const scenarioCoffre = `
Le joueur se trouve dans la chambre forte.
La chambre forte est un lieu.
Sa description est "Une pièce illuminée. Un grand coffre[#grand coffre] trône au centre.".
Le grand coffre est un objet dans la chambre forte.
action ouvrir un objet:
  dire "Vous ouvrez [intitule ceci].{n}".
fin action
action regarder:
  dire "[description ici][décrire objets ici]".
fin action
`;

describe('"ce dernier" — objet mentionné via [#] dans une description — #174', () => {

  it('après "regarder" qui mentionne le coffre via [#], derniersElementIds contient le coffre', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioCoffre, false);
    ctxPartie.com.executerCommande('regarder', false);
    const coffre = ctxPartie.jeu.objets.find(o => o.nom === 'grand coffre');
    expect(ctxPartie.jeu.derniersElementIds).toContain(coffre.id);
  });

  it('après "regarder" qui mentionne le coffre via [#], "l\'ouvrir" ouvre le grand coffre', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioCoffre, false);
    ctxPartie.com.executerCommande('regarder', false);
    const sortie = ctxPartie.com.executerCommande("l'ouvrir", false);
    expect(sortie.sortie).toContain('grand coffre');
  });

});

describe('"derniersElementIds" — persistance dans jeu — #174', () => {

  it('derniersElementIds est vide au départ', () => {
    const jeu = TestUtils.genererLeJeu(scenarioBase);
    expect(jeu.derniersElementIds).toEqual([]);
  });

  it('derniersElementIds contient l\'ID de l\'élément après une action sur un objet', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('voir la pomme', false);
    expect(ctxPartie.jeu.derniersElementIds.length).toBeGreaterThan(0);
    const pomme = ctxPartie.jeu.objets.find(o => o.nom === 'pomme');
    expect(ctxPartie.jeu.derniersElementIds).toContain(pomme.id);
  });

});
