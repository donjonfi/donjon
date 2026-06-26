import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F097] Instruction « changer » — mutation de l'état du jeu en cours de partie
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Couvre instruction-changer.ts : pose/retrait d'état (objet, joueur, lieu via « ici » et par nom),
//    déplacement du joueur, compteur (augmente/diminue/affichage), états multiples reliés par « et ».
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('F097 — Instruction « changer »', () => {

  // ————————————————————————————————————————————————————————————————————————
  //  Pose / retrait d'état sur un OBJET
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T001] changer un objet est <état> : pose l\'état', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le caillou est un objet. le caillou est dans le salon.
action tester:
  changer le caillou est sacré.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    const caillou = ctx.jeu.objets.find(o => o.nom === 'caillou');
    expect(caillou).toBeDefined();
    expect(ctx.jeu.etats.possedeEtatElement(caillou, 'sacré', ctx.eju)).toBeTrue();
  });

  it('[F097-T002] changer un objet n\'est plus <état> (déclaré) : retire l\'état', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le coffre est un objet. le coffre est verrouillé.
action tester:
  changer le coffre n'est plus verrouillé.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const coffre = ctx.jeu.objets.find(o => o.nom === 'coffre');
    // précondition : l'état est bien posé à la compilation
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'verrouillé', ctx.eju)).toBeTrue();

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'verrouillé', ctx.eju)).toBeFalse();
  });

  it('[F097-T003] changer un objet : pose puis retrait dans la même action', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le caillou est un objet. le caillou est dans le salon.
action tester:
  changer le caillou est sacré.
  changer le caillou n'est plus sacré.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    const caillou = ctx.jeu.objets.find(o => o.nom === 'caillou');
    expect(ctx.jeu.etats.possedeEtatElement(caillou, 'sacré', ctx.eju)).toBeFalse();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  Pose / retrait d'état sur le JOUEUR
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T004] changer le joueur est <état> : pose l\'état', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
action tester:
  changer le joueur est marqué.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F097-T005] changer le joueur : pose puis retrait dans la même action', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
action tester:
  changer le joueur est marqué.
  changer le joueur n'est plus marqué.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeFalse();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  Pose d'état sur un LIEU (« ici » et par nom)
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T006] changer ici est <état> : pose l\'état sur le lieu courant', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
action tester:
  changer ici est illuminé.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    const salon = ctx.jeu.lieux.find(l => l.nom === 'salon');
    expect(salon).toBeDefined();
    expect(ctx.jeu.etats.possedeEtatElement(salon, 'illuminé', ctx.eju)).toBeTrue();
  });

  it('[F097-T007] changer un lieu (par son nom) est <état> : pose l\'état', () => {
    const scenario = `
le salon est un lieu.
la cuisine est un lieu.
le joueur se trouve dans le salon.
action tester:
  changer la cuisine est illuminée.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    const cuisine = ctx.jeu.lieux.find(l => l.nom === 'cuisine');
    expect(cuisine).toBeDefined();
    expect(ctx.jeu.etats.possedeEtatElement(cuisine, 'illuminé', ctx.eju)).toBeTrue();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  Déplacement du joueur
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T008] changer le joueur se trouve dans <lieu> : déplace le joueur', () => {
    const scenario = `
le salon est un lieu.
la cuisine est un lieu.
le joueur se trouve dans le salon.
action tester:
  changer le joueur se trouve dans la cuisine.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.eju.curLieu.nom).toEqual('salon');

    ctx.com.executerCommande("tester", false);

    expect(ctx.eju.curLieu.nom).toEqual('cuisine');
  });

  // ————————————————————————————————————————————————————————————————————————
  //  États multiples reliés par « et »
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T009] changer un objet est <étatA> et <étatB> : pose les deux états', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le caillou est un objet. le caillou est dans le salon.
action tester:
  changer le caillou est sacré et doré.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    const caillou = ctx.jeu.objets.find(o => o.nom === 'caillou');
    expect(ctx.jeu.etats.possedeEtatElement(caillou, 'sacré', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(caillou, 'doré', ctx.eju)).toBeTrue();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  COMPTEUR : augmenter / diminuer la valeur
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T010] changer un compteur augmente de N : incrémente la valeur', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 0.
action tester:
  changer le score augmente de 5.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.compteurs[0].valeur).toEqual(5);
  });

  it('[F097-T011] changer un compteur diminue de N : décrémente la valeur', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 10.
action tester:
  changer le score diminue de 4.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.compteurs[0].valeur).toEqual(6);
  });

  it('[F097-T012] changer un compteur vaut N : fixe la valeur', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 3.
action tester:
  changer le score vaut 42.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.compteurs[0].valeur).toEqual(42);
  });

  // ————————————————————————————————————————————————————————————————————————
  //  COMPTEUR : affichage dans le cartouche en cours de partie
  // ————————————————————————————————————————————————————————————————————————

  it('[F097-T013] changer un compteur n\'est plus affiché : retire la position', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 0.
le score est affiché en haut à droite.
action tester:
  changer le score n'est plus affiché.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.compteurs[0].positionAffichage).toBeUndefined();
  });

});
