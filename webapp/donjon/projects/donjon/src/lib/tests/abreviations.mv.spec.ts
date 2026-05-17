import { Abreviations } from "../utils/jeu/abreviations";
import { TestUtils } from "../utils/test-utils";

describe('Abreviations — raccourci « mv »', () => {

  it('[F055-T001] « mv tomate vers salon » sans listes → « le tomate » / « le salon » par défaut', () => {
    const r = Abreviations.obtenirCommandeComplete('mv tomate vers salon', []);
    expect(r).toEqual('déboguer changer le tomate se trouve dans le salon');
  });

  it('[F055-T002] « mv la tomate vers le salon » → déterminants conservés', () => {
    const r = Abreviations.obtenirCommandeComplete('mv la tomate vers le salon', []);
    expect(r).toEqual('déboguer changer la tomate se trouve dans le salon');
  });

  it('[F055-T003] avec listes : tomate (f) + salon (m) → « la tomate » / « le salon »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le salon est un lieu.
La tomate est un objet dans le salon.
`);
    const r = Abreviations.obtenirCommandeComplete('mv tomate vers salon', [], jeu.lieux, jeu.objets);
    expect(r).toEqual('déboguer changer la tomate se trouve dans le salon');
  });

  it('[F055-T004] avec listes : épée (f, voyelle) + alcôve (f, voyelle) → élision', () => {
    const jeu = TestUtils.genererLeJeu(`
L'alcôve (f) est un lieu.
L'épée (f) est un objet dans l'alcôve.
`);
    const r = Abreviations.obtenirCommandeComplete('mv épée vers alcôve', [], jeu.lieux, jeu.objets);
    expect(r.startsWith("déboguer changer l")).toBe(true);
    expect(r).toContain('épée se trouve dans l');
    expect(r).toContain('alcôve');
  });

  it('[F055-T005] objet en plusieurs mots : « mv grosse tomate vers salon »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le salon est un lieu.
La grosse tomate est un objet dans le salon.
`);
    const r = Abreviations.obtenirCommandeComplete('mv grosse tomate vers salon', [], jeu.lieux, jeu.objets);
    expect(r).toEqual('déboguer changer la grosse tomate se trouve dans le salon');
  });

  it('[F055-T006] « mv » seul → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('mv', []);
    expect(r).toEqual('mv');
  });

  it('[F055-T007] « mv tomate » (pas de « vers ») → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('mv tomate', []);
    expect(r).toEqual('mv tomate');
  });

  it('[F055-T008] « mv tomate vers » (rien après « vers ») → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('mv tomate vers', []);
    expect(r).toEqual('mv tomate vers');
  });

  it('[F055-T009] « mv vers salon » (pas d\'objet) → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('mv vers salon', []);
    expect(r).toEqual('mv vers salon');
  });

  it('[F055-T010] « dp tomate vers salon » → alias de « mv »', () => {
    const jeu = TestUtils.genererLeJeu(`
Le salon est un lieu.
La tomate est un objet dans le salon.
`);
    const r = Abreviations.obtenirCommandeComplete('dp tomate vers salon', [], jeu.lieux, jeu.objets);
    expect(r).toEqual('déboguer changer la tomate se trouve dans le salon');
  });

  it('[F055-T011] « déplacer tomate vers salon » → reste une vraie commande, pas un alias', () => {
    const r = Abreviations.obtenirCommandeComplete('déplacer tomate vers salon', []);
    expect(r).toEqual('déplacer tomate vers salon');
  });

  it('[F055-T012] « mv tomate to salon » → séparateur « to » accepté', () => {
    const r = Abreviations.obtenirCommandeComplete('mv tomate to salon', []);
    expect(r).toEqual('déboguer changer le tomate se trouve dans le salon');
  });

  it('[F055-T013] « dp la tomate to le salon » → « to » + déterminants conservés', () => {
    const r = Abreviations.obtenirCommandeComplete('dp la tomate to le salon', []);
    expect(r).toEqual('déboguer changer la tomate se trouve dans le salon');
  });

});
