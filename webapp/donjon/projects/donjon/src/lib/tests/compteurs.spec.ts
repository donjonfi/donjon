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

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] Affichage d'un compteur dans un coin de l'écran
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Affichage compteur dans un coin', () => {

  it('La bourse est affichée en haut à droite', () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      'La bourse est affichée en haut à droite. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs).toHaveSize(1);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it('Le score est affiché en haut à gauche', () => {
    const scenario = '' +
      'Le score est un compteur initialisé à 0. ' +
      'Le score est affiché en haut à gauche. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-gauche');
  });

  it('Les vies sont affichées en bas à droite', () => {
    const scenario = '' +
      'Les vies sont un compteur initialisé à 3. ' +
      'Les vies sont affichées en bas à droite. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-droite');
  });

  it('Sans direction latérale → droite par défaut (en haut)', () => {
    const scenario = '' +
      'Le score est un compteur initialisé à 0. ' +
      'Le score est affiché en haut. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it('Compteur sans position → positionAffichage undefined', () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 50. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toBeUndefined();
  });

  it('Deux compteurs dans des coins différents', () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      'Les vies sont un compteur initialisé à 3. ' +
      'La bourse est affichée en haut à droite. ' +
      'Les vies sont affichées en bas à gauche. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs).toHaveSize(2);
    const bourse = ctx.jeu.compteurs.find(c => c.nom === 'bourse');
    const vies = ctx.jeu.compteurs.find(c => c.nom === 'vies');
    expect(bourse?.positionAffichage).toEqual('haut-droite');
    expect(vies?.positionAffichage).toEqual('bas-gauche');
  });

});