import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] Définition d'un compteur
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Compteurs', () => {

  it('Le score est un compteur', () => {

    const scenario = '' +
      'Le score est un compteur. ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.objets).toHaveSize(2); // (il y a tjs joueur (0) et inventaire (1))
    expect(ctx.jeu.compteurs).toHaveSize(1);
    expect(ctx.jeu.compteurs[0].intitule.toString()).toEqual('le score');
  });

  it('La bourse est un compteur initialisé à 100', () => {

    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.objets).toHaveSize(2); // (il y a tjs joueur (0) et inventaire (1))
    expect(ctx.jeu.compteurs).toHaveSize(1);
    expect(ctx.jeu.compteurs[0].intitule.toString()).toEqual('la bourse');
    expect(ctx.jeu.compteurs[0].valeur).toEqual(100);
  });
  
});