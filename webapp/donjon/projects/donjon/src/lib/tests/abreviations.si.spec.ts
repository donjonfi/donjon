import { Abreviations } from "../utils/jeu/abreviations";

describe('Abreviations — raccourci « si »', () => {

  it('[F054-T001] « si X est Y » → déboguer dire "[si …]vrai[sinon]faux[fin]"', () => {
    const r = Abreviations.obtenirCommandeComplete('si le joueur se trouve dans le salon', []);
    expect(r).toEqual('déboguer dire "[si le joueur se trouve dans le salon]vrai[sinon]faux[fin]"');
  });

  it('[F054-T002] condition composée avec « et que » conservée telle quelle', () => {
    const r = Abreviations.obtenirCommandeComplete(
      'si le joueur se trouve dans le salon et que le chien est dans la niche', []);
    expect(r).toEqual(
      'déboguer dire "[si le joueur se trouve dans le salon et que le chien est dans la niche]vrai[sinon]faux[fin]"');
  });

  it('[F054-T003] casse + espaces multiples — « SI   le chien EST dans la niche »', () => {
    const r = Abreviations.obtenirCommandeComplete('SI   le chien EST dans la niche', []);
    expect(r).toEqual('déboguer dire "[si le chien est dans la niche]vrai[sinon]faux[fin]"');
  });

  it('[F054-T004] « si » seul → laisse intact (pas de condition fournie)', () => {
    const r = Abreviations.obtenirCommandeComplete('si', []);
    expect(r).toEqual('si');
  });

  it('[F054-T005] « vf <condition> » → même conversion que « si »', () => {
    const r = Abreviations.obtenirCommandeComplete('vf le joueur se trouve dans le salon', []);
    expect(r).toEqual('déboguer dire "[si le joueur se trouve dans le salon]vrai[sinon]faux[fin]"');
  });

  it('[F054-T006] « vf si <condition> » → le « si » optionnel est ignoré', () => {
    const r = Abreviations.obtenirCommandeComplete('vf si le chien est dans la niche', []);
    expect(r).toEqual('déboguer dire "[si le chien est dans la niche]vrai[sinon]faux[fin]"');
  });

  it('[F054-T007] « vf » seul → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('vf', []);
    expect(r).toEqual('vf');
  });

  it('[F054-T008] « vf si » seul (sans condition) → laisse intact', () => {
    const r = Abreviations.obtenirCommandeComplete('vf si', []);
    expect(r).toEqual('vf si');
  });

});
