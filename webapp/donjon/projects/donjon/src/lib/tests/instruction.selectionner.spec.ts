import { TestUtils } from "../utils/test-utils";

describe('Instructions - Sélectionner', () => {

  it('Sélectionner - afficher mémoire nombre compris entre 3 et 3', () => {
    const scenario =
      'le salon est un lieu. ' +
      'le joueur peut tester: ' +
      '  sélectionner un nombre compris entre 3 et 3; ' +
      '  dire "[mémoire nombre]".'
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester");
    expect(ctxCom.sortie).toEqual("3");
  });

  it('Sélectionner - condition sur nombre compris entre 200 et 200', () => {
    const scenario =
      'le salon est un lieu. ' +
      'le joueur peut tester: ' +
      '  sélectionner un nombre compris entre 200 et 200; ' +
      '  si le nombre dépasse 2: ' +
      '    dire "il vaut plus que 2"; ' +
      '  sinon ' +
      '    dire "il ne dépasse pas 2"; ' +
      '  fin si. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester");
    expect(ctxCom.sortie).toEqual("il vaut plus que 2");
  });

  it('Sélectionner - afficher mémoire dé1 compris entre cinq et cinq', () => {
    const scenario =
      'le salon est un lieu. ' +
      'le joueur peut tester: ' +
      '  sélectionner le dé1 compris entre cinq et cinq; ' +
      '  dire "[mémoire dé1]".'
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const ctxCom = ctx.com.executerCommande("tester");
    expect(ctxCom.sortie).toEqual("5");
  });

});