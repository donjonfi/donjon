import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

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

const scenarioContenant = `
Le joueur se trouve dans la cuisine.
La cuisine est un lieu.
Le sac est un contenant dans la cuisine.
Le sac est ouvert.
La pomme rouge est un objet dans le sac.
action examiner un contenant:
  dire "Vous examinez [intitule ceci].{n}[lister objets dans ceci]".
fin action
action prendre un objet:
  dire "Vous prenez [intitule ceci].{n}".
fin action
`;

describe('"ce dernier" — objet dans un contenant listé via [lister contenu] — #174', () => {

  it('après "examiner le sac", derniersElementIds contient la pomme rouge', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioContenant, false);
    ctxPartie.com.executerCommande('examiner le sac', false);
    const pomme = ctxPartie.jeu.objets.find(o => o.nom === 'pomme rouge');
    expect(ctxPartie.jeu.derniersElementIds).toContain(pomme.id);
  });

  it('après "examiner le sac", "la prendre" prend la pomme rouge', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioContenant, false);
    ctxPartie.com.executerCommande('examiner le sac', false);
    const sortie = ctxPartie.com.executerCommande('la prendre', false);
    expect(sortie.sortie).toContain('pomme rouge');
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

// =====================================================
// #174 — "lui", "elle", "leur" → dernier élément
// =====================================================

const scenarioPersonnes = actions + `
Le joueur se trouve dans la clairière.
La clairière est un lieu.
Le druide est une personne vu dans la clairière.
La druidesse est une personne vu dans la clairière.
réactions du druide:
  basique:
    dire "Je connais les secrets de la forêt.{n}".
fin réactions
réactions de la druidesse:
  basique:
    dire "Je suis gardienne de ce lieu.{n}".
fin réactions
`;

describe('"lui parler" — pronom indirect en tête résolu vers le dernier élément — #174', () => {

  it('après "parler avec le druide", "lui parler" reparle au druide (masculin)', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec le druide', false);
    const sortie = ctxPartie.com.executerCommande('lui parler', false);
    expect(sortie.sortie).toContain('secrets de la forêt');
  });

  it('après "parler avec la druidesse", "lui parler" reparle à la druidesse (féminin)', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec la druidesse', false);
    const sortie = ctxPartie.com.executerCommande('lui parler', false);
    expect(sortie.sortie).toContain('gardienne de ce lieu');
  });

});

describe('"parler avec lui/elle" — pronom tonique en complément résolu vers le dernier élément — #174', () => {

  it('après "parler avec le druide", "parler avec lui" reparle au druide', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec le druide', false);
    const sortie = ctxPartie.com.executerCommande('parler avec lui', false);
    expect(sortie.sortie).toContain('secrets de la forêt');
  });

  it('après "parler avec la druidesse", "parler avec elle" reparle à la druidesse', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec la druidesse', false);
    const sortie = ctxPartie.com.executerCommande('parler avec elle', false);
    expect(sortie.sortie).toContain('gardienne de ce lieu');
  });

});

describe('"leur parler" — pronom indirect pluriel résolu vers le dernier élément — #174', () => {

  it('après "parler avec le druide", "leur parler" reparle au druide', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec le druide', false);
    const sortie = ctxPartie.com.executerCommande('leur parler', false);
    expect(sortie.sortie).toContain('secrets de la forêt');
  });

  it('après "parler avec la druidesse", "leur parler" reparle à la druidesse', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioPersonnes, false);
    ctxPartie.com.executerCommande('parler avec la druidesse', false);
    const sortie = ctxPartie.com.executerCommande('leur parler', false);
    expect(sortie.sortie).toContain('gardienne de ce lieu');
  });

});
