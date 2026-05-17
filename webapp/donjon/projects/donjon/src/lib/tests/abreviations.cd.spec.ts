import { Abreviations } from "../utils/jeu/abreviations";
import { TestUtils } from "../utils/test-utils";

describe('Abreviations — raccourci « cd »', () => {

  it('[F053-T001] « cd salon » → ajoute « le » par défaut', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd salon', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans le salon');
  });

  it('[F053-T002] « cd le salon » → garde « le »', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd le salon', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans le salon');
  });

  it('[F053-T003] « cd la cuisine » → garde « la »', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd la cuisine', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans la cuisine');
  });

  it('[F053-T004] « cd les jardins » → garde « les »', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd les jardins', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans les jardins');
  });

  it('[F053-T005] « cd l\'entrée » → garde l\'élision (apostrophe droite)', () => {
    const resultat = Abreviations.obtenirCommandeComplete("cd l'entrée", []);
    expect(resultat).toEqual("déboguer changer le joueur se trouve dans l'entrée");
  });

  it('[F053-T006] « cd l’entrée » → garde l’élision (apostrophe typographique)', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd l’entrée', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans l’entrée');
  });

  it('[F053-T007] « cd grand salon » (lieu en plusieurs mots) → ajoute « le »', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd grand salon', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans le grand salon');
  });

  it('[F053-T008] « cd » seul → laisse intact (pas de lieu fourni)', () => {
    const resultat = Abreviations.obtenirCommandeComplete('cd', []);
    expect(resultat).toEqual('cd');
  });

  it('[F053-T009] casse + espaces — « CD   Salon »', () => {
    const resultat = Abreviations.obtenirCommandeComplete('CD   Salon', []);
    expect(resultat).toEqual('déboguer changer le joueur se trouve dans le salon');
  });

  // ─────────────────────────────────────────────────────────────
  // Avec la liste des lieux : accorder le déterminant au genre/nombre
  // ─────────────────────────────────────────────────────────────

  it('[F053-T010] « cd cuisine » avec lieu féminin → « la cuisine »', () => {
    const jeu = TestUtils.genererLeJeu(`
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
`);
    const r = Abreviations.obtenirCommandeComplete('cd cuisine', [], jeu.lieux);
    expect(r).toEqual('déboguer changer le joueur se trouve dans la cuisine');
  });

  it('[F053-T011] « cd salon » avec lieu masculin → « le salon »', () => {
    const jeu = TestUtils.genererLeJeu(`
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
`);
    const r = Abreviations.obtenirCommandeComplete('cd salon', [], jeu.lieux);
    expect(r).toEqual('déboguer changer le joueur se trouve dans le salon');
  });

  it('[F053-T012] « cd jardins » avec lieu pluriel → « les jardins »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le hall est un lieu.
Les jardins (m) sont des lieux au nord du hall.
`);
    const r = Abreviations.obtenirCommandeComplete('cd jardins', [], jeu.lieux);
    expect(r).toEqual('déboguer changer le joueur se trouve dans les jardins');
  });

  it('[F053-T013] « cd alcôve » avec lieu féminin commençant par voyelle → « l\'alcôve »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le hall est un lieu.
L'alcôve (f) est un lieu au nord du hall.
`);
    const r = Abreviations.obtenirCommandeComplete('cd alcôve', [], jeu.lieux);
    expect(r.startsWith("déboguer changer le joueur se trouve dans l")).toBe(true);
    expect(r).toContain('alcôve');
  });

  it('[F053-T015] « lc salon » → alias de « cd »', () => {
    const r = Abreviations.obtenirCommandeComplete('lc salon', []);
    expect(r).toEqual('déboguer changer le joueur se trouve dans le salon');
  });

  it('[F053-T016] « lc cuisine » avec lieu féminin → « la cuisine »', () => {
    const jeu = TestUtils.genererLeJeu(`
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
`);
    const r = Abreviations.obtenirCommandeComplete('lc cuisine', [], jeu.lieux);
    expect(r).toEqual('déboguer changer le joueur se trouve dans la cuisine');
  });

  it('[F053-T017] « lc » seul → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('lc', []);
    expect(r).toEqual('lc');
  });

  it('[F053-T014] lieu introuvable → fallback « le »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le hall est un lieu.
`);
    const r = Abreviations.obtenirCommandeComplete('cd jardin secret', [], jeu.lieux);
    expect(r).toEqual('déboguer changer le joueur se trouve dans le jardin secret');
  });

});
