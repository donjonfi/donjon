import { TestUtils } from "../utils/test-utils";

describe('Instructions - Sélectionner', () => {

  it('Sélectionner - afficher mémoire nombre compris entre 3 et 3', () => {
    const scenario =
      'le salon est un lieu. ' +
      'action tester: ' +
      '  sélectionner un nombre compris entre 3 et 3. ' +
      '  dire "[mémoire nombre]". ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester", false);
    expect(ctxCom.sortie).toEqual("3");
  });

  it('Sélectionner - condition sur nombre compris entre 200 et 200', () => {
    const scenario =
      'le salon est un lieu. ' +
      'action tester: ' +
      '  sélectionner un nombre compris entre 200 et 200. ' +
      '  si le nombre dépasse 2: ' +
      '    dire "il vaut plus que 2". ' +
      '  sinon ' +
      '    dire "il ne dépasse pas 2". ' +
      '  fin si ' +
      'fin action '
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester", false);
    expect(ctxCom.sortie).toEqual("il vaut plus que 2");
  });

  it('Sélectionner - afficher mémoire dé1 compris entre cinq et cinq', () => {
    const scenario =
      'le salon est un lieu. ' +
      'action tester: ' +
      '  sélectionner le dé1 compris entre cinq et cinq. ' +
      '  dire "[mémoire dé1]". ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester", false);
    expect(ctxCom.sortie).toEqual("5");
  });

});