// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] TEXTES DYNAMIQUES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

import { TestUtils } from "../utils/test-utils";

describe('Textes dynamiques', () => {


  it('Test description 1ère fois, puis', () => {

    const scenario = '' +
      'La pomme est un objet. ' +
      'Sa description est "[1ère fois]première description[puis]autre description[fin choix].". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.objets).toHaveSize(3);
    expect(ctx.jeu.objets[2].intitule.toString()).toEqual('la pomme');

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description pomme]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("première description.{N}");
    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description pomme]', 1, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("autre description.{N}");

  });


  it('Test aperçu 1ère fois, puis', () => {

    const scenario = '' +
      'La pomme est un objet. ' +
      'Son aperçu est "[1ère fois]premier aperçu[puis]autre aperçu[fin choix].". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.objets).toHaveSize(3); // l’inventaire, le joueur + 1
    expect(ctx.jeu.objets[2].intitule.toString()).toEqual('la pomme');

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[aperçu pomme]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("premier aperçu.{N}");
    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[aperçu pomme]', 1, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("autre aperçu.{N}");

  });

});