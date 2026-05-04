import { CompilateurV8 } from "../../public-api";
import { Generateur } from "../utils/compilation/generateur";
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

  it('Compteur avec unité (sans initialisation)', () => {
    const scenario = '' +
      "La bourse est un compteur avec l'unité pièce. " +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs).toHaveSize(1);
    expect(ctx.jeu.compteurs[0].unite).toEqual('pièce');
    expect(ctx.jeu.compteurs[0].valeur).toEqual(0);
  });

  it("Compteur avec unité après l'initialisation", () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].valeur).toEqual(100);
    expect(ctx.jeu.compteurs[0].unite).toEqual('pièce');
  });

  it("Compteur avec unité avant l'initialisation", () => {
    const scenario = '' +
      "La bourse est un compteur avec l'unité pièce initialisé à 100. " +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].valeur).toEqual(100);
    expect(ctx.jeu.compteurs[0].unite).toEqual('pièce');
  });

  it('Compteur affiché sans intitulé', () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      'La bourse est affichée en haut à droite sans intitulé. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansUnite).toBeFalsy();
  });

  it('Compteur affiché sans unité', () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      'La bourse est affichée en haut à droite sans unité. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeFalsy();
  });

  it('Compteur affiché sans intitulé sans unité', () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      'La bourse est affichée en haut à droite sans intitulé sans unité. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
  });

  it('Compteur affiché sans intitulé et sans unité (avec « et »)', () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      'La bourse est affichée en haut à droite sans intitulé et sans unité. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
  });

  it('Compteur affiché sans unité et sans intitulé (avec « et », ordre inverse)', () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      'La bourse est affichée en haut à droite sans unité et sans intitulé. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
  });

  it('Compteur affiché sans unité sans intitulé (ordre inverse)', () => {
    const scenario = '' +
      "La bourse est un compteur initialisé à 100 avec l'unité pièce. " +
      'La bourse est affichée en haut à droite sans unité sans intitulé. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
  });

  it("« Il est affiché. » → en haut sous-entendu (droite par défaut)", () => {
    const scenario = '' +
      'Le score est un compteur initialisé à 0. ' +
      'Il est affiché. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it("« La bourse est affichée. » → en haut sous-entendu (droite par défaut)", () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      'La bourse est affichée. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it("« Il est affiché à gauche. » → en haut sous-entendu", () => {
    const scenario = '' +
      'Le score est un compteur initialisé à 0. ' +
      'Il est affiché à gauche. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-gauche');
  });

  it("« Il est affiché sans unité. » → en haut + droite par défaut + sans unité", () => {
    const scenario = '' +
      "Le score est un compteur initialisé à 0 avec l'unité point. " +
      'Il est affiché sans unité. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansUnite).toBeTrue();
  });

  it('Il est affiché en haut (pronom personnel masculin)', () => {
    const scenario = '' +
      'Le score est un compteur initialisé à 0. ' +
      'Il est affiché en haut. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it('Elle est affichée en bas à gauche (pronom personnel féminin)', () => {
    const scenario = '' +
      'La bourse est un compteur initialisé à 100. ' +
      'Elle est affichée en bas à gauche. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-gauche');
  });

  it('Ils sont affichés en haut à droite (pronom personnel masculin pluriel)', () => {
    const scenario = '' +
      'Les points sont un compteur initialisé à 0. ' +
      'Ils sont affichés en haut à droite. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it('Elles sont affichées en bas (pronom personnel féminin pluriel)', () => {
    const scenario = '' +
      'Les vies sont un compteur initialisé à 3. ' +
      'Elles sont affichées en bas. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-droite');
  });

  it('Il est affiché en haut sans intitulé (pronom personnel + options)', () => {
    const scenario = '' +
      "Le score est un compteur initialisé à 0 avec l'unité point. " +
      'Il est affiché en haut sans intitulé. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
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

  it('Sans titre (alias de sans intitulé)', () => {
    const scenario = `
Le score est un compteur initialisé à 0.
Le score est affiché en haut à droite sans titre.
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
  });

  it('Option « sans X » inconnue → message d’analyse, compteur tout de même affiché, option inconnue ignorée', () => {
    const scenario = `
Le score est un compteur initialisé à 0.
Le score est affiché en haut à droite sans tiitre.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(rc.erreurs).toHaveSize(0);
    expect(rc.messages.some(m => m.titre === 'Option d\'affichage inconnue')).toBeTrue();
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    expect(jeu.compteurs[0].sansIntitule).toBeFalsy();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [3/3] Titre d'un compteur
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Titre d\'un compteur', () => {

  it('Pas de titre défini → titre undefined (fallback sur le nom à l\'affichage)', () => {
    const scenario = `
Le score est un compteur initialisé à 0.
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].titre).toBeUndefined();
  });

  it('Définition d\'un titre libre', () => {
    const scenario = `
Le score est un compteur initialisé à 0.
Le titre du score est "Score final".
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].titre).toEqual('Score final');
  });

  it('Modification du titre à l\'exécution', () => {
    const scenario = `
Le tribunal est un lieu.
Le score est un compteur initialisé à 0.
Le titre du score est "Score initial".
action renommer:
  changer le titre du score est "Score final".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.compteurs[0].titre).toEqual('Score initial');
    ctx.com.executerCommande("renommer", false);
    expect(ctx.jeu.compteurs[0].titre).toEqual('Score final');
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [4/4] Modifier l'affichage d'un compteur en cours de partie
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Affichage compteur — modification runtime', () => {

  it('Masquer un compteur : « changer le score n\'est plus affiché »', () => {
    const scenario = `
Le tribunal est un lieu.
Le score est un compteur initialisé à 0.
Le score est affiché en haut à droite.
action masquer:
  changer le score n'est plus affiché.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    ctx.com.executerCommande("masquer", false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toBeUndefined();
  });

  it('Repositionner un compteur : « changer le score est affiché en bas à gauche »', () => {
    const scenario = `
Le tribunal est un lieu.
Le score est un compteur initialisé à 0.
Le score est affiché en haut à droite.
action repositionner:
  changer le score est affiché en bas à gauche.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
    ctx.com.executerCommande("repositionner", false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-gauche');
  });

  it('Réafficher un compteur masqué avec options « sans titre »', () => {
    const scenario = `
Le tribunal est un lieu.
Le score est un compteur initialisé à 0.
action afficher:
  changer le score est affiché en bas à droite sans titre.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toBeUndefined();
    ctx.com.executerCommande("afficher", false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-droite');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
  });

  it('Repositionner réinitialise les options : sansIntitule remis à false', () => {
    const scenario = `
Le tribunal est un lieu.
Le score est un compteur initialisé à 0.
Le score est affiché en haut à droite sans titre.
action repositionner:
  changer le score est affiché en bas à gauche.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeTrue();
    ctx.com.executerCommande("repositionner", false);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-gauche');
    expect(ctx.jeu.compteurs[0].sansIntitule).toBeFalse();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [5/5] Modifier l'affichage du lieu dans le cartouche en cours de partie
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Affichage lieu cartouche — modification runtime', () => {

  it('Masquer le lieu : « changer le lieu n\'est plus affiché »', () => {
    const scenario = `
Le tribunal est un lieu.
action masquer:
  changer le lieu n'est plus affiché.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('haut');
    ctx.com.executerCommande("masquer", false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('aucun');
  });

  it('Masquer le lieu avec précision du cartouche : « changer le lieu n\'est plus affiché dans le cartouche »', () => {
    const scenario = `
Le tribunal est un lieu.
action masquer:
  changer le lieu n'est plus affiché dans le cartouche.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('haut');
    ctx.com.executerCommande("masquer", false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('aucun');
  });

  it('Repositionner le lieu en bas : « changer le lieu est affiché dans le cartouche du bas »', () => {
    const scenario = `
Le tribunal est un lieu.
action descendre:
  changer le lieu est affiché dans le cartouche du bas.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('haut');
    ctx.com.executerCommande("descendre", false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('bas');
  });

  it('Réafficher le lieu après masquage : « changer le lieu est affiché »', () => {
    const scenario = `
Le tribunal est un lieu.
ne pas afficher le lieu dans le cartouche.
action remonter:
  changer le lieu est affiché dans le cartouche du haut.
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('aucun');
    ctx.com.executerCommande("remonter", false);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('haut');
  });

});