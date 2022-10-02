import { TestUtils } from "../utils/test-utils";

describe('Conditions: si/sinonsi/sinon durant le jeu', () => {

  it('si le joueur se trouve dans le salon (court)', function () {
    const scenario =
      'le salon est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon, changer le joueur est saloné. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();

  });


  it('si le joueur se trouve dans le salon (complet)', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné. ' +
      '  fin si ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();

  });

  it('si le joueur se trouve dans la chambre (complet)', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();

  });

  it('si/sinon le joueur se trouve dans le salon', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné. ' +
      '  sinon' +
      '    changer le joueur est chambré. ' +
      '  fin si ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();

  });

  it('SI/sinon le joueur se trouve dans le salon', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  SI le joueur se trouve dans le salon: ' +
      '    changer le joueur est saloné. ' +
      '  sinon ' +
      '    changer le joueur est chambré. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();

  });

  it('si/sinon le joueur se trouve dans la chambre', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  sinon' +
      '    changer le joueur est saloné. ' +
      '  fin si ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();

  });

  it('si/Sinon le joueur se trouve dans la chambre', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  Sinon' +
      '    changer le joueur est saloné. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();

  });

  it('SI/SINON le joueur se trouve dans la chambre', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  SI le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  SINON' +
      '    changer le joueur est saloné. ' +
      '  FIN SI. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();

  });

  it('si/sinon/sinonsi le joueur se trouve dans le salon', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'la cuisine est un lieu. ' +
      'le joueur se trouve dans le salon. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné. ' +
      '  sinonsi le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  sinon' +
      '    changer le joueur est cuisiné. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'cuisiné', ctx.eju)).toBeFalse();

  });

  it('si/sinon/sinonsi le joueur se trouve dans la chambre', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'la cuisine est un lieu. ' +
      'le joueur se trouve dans la chambre. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné. ' +
      '  sinonsi le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  sinon' +
      '    changer le joueur est cuisiné. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'cuisiné', ctx.eju)).toBeFalse();

  });

  it('si/sinon/sinonsi le joueur se trouve dans la cuisine', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'la cuisine est un lieu. ' +
      'le joueur se trouve dans la cuisine. ' +
      'action tester: ' +
      '  si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné. ' +
      '  sinonsi le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  sinon' +
      '    changer le joueur est cuisiné. ' +
      '  fin si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'cuisiné', ctx.eju)).toBeTrue();

  });

  it('Si/Sinon/SinonSi le joueur se trouve dans la cuisine', function () {
    const scenario =
      'le salon est un lieu. ' +
      'la chambre est un lieu. ' +
      'la cuisine est un lieu. ' +
      'le joueur se trouve dans la cuisine. ' +
      'action tester: ' +
      '  Si le joueur se trouve dans le salon:' +
      '    changer le joueur est saloné.' +
      '  SinonSi le joueur se trouve dans la chambre:' +
      '    changer le joueur est chambré. ' +
      '  Sinon' +
      '    changer le joueur est cuisiné. ' +
      '  Fin Si. ' +
      'fin action ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    ctx.com.executerCommande("tester");
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'saloné', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'chambré', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'cuisiné', ctx.eju)).toBeTrue();

  });

});