import { TestUtils } from "../utils/test-utils";
import { TypeInterruption } from "../models/jeu/interruption";

// =====================================================
// #187 — Instruction choisir : lettres vs nombres
// =====================================================

// Note : la génération des identifiants (a/b/c ou 1/2/3) a lieu dans le
// LecteurComponent. Les tests ci-dessous couvrent :
//   1) le parsing du paramètre activerChoixNumeriques
//   2) la création de l'interruption attendreChoix avec les bons choix

describe('Paramètre activerChoixNumeriques — #187', () => {

  it('[F030-T001] activerChoixNumeriques est false par défaut', () => {
    const jeu = TestUtils.genererLeJeu('Le salon est un lieu.');
    expect(jeu.parametres.activerChoixNumeriques).toBeFalse();
  });

  it('[F030-T002] activer choix numériques positionne activerChoixNumeriques à true', () => {
    const jeu = TestUtils.genererLeJeu(
      'activer choix numériques.\n' +
      'Le salon est un lieu.'
    );
    expect(jeu.parametres.activerChoixNumeriques).toBeTrue();
  });

  it('[F030-T003] activer choix numérotés positionne activerChoixNumeriques à true', () => {
    const jeu = TestUtils.genererLeJeu(
      'activer choix numérotés.\n' +
      'Le salon est un lieu.'
    );
    expect(jeu.parametres.activerChoixNumeriques).toBeTrue();
  });

  it('[F030-T004] désactiver choix numériques après activation positionne activerChoixNumeriques à false', () => {
    const jeu = TestUtils.genererLeJeu(
      'activer choix numériques.\n' +
      'désactiver choix numériques.\n' +
      'Le salon est un lieu.'
    );
    expect(jeu.parametres.activerChoixNumeriques).toBeFalse();
  });

});

describe('Instruction choisir — interruption attendreChoix — #187', () => {

  const scenarioBase = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
action boire:
  dire "Que voulez-vous boire ?{n}"
  choisir
    choix "eau":
      dire "Vous buvez de l'eau.{n}"
    choix "café":
      dire "Vous buvez un café.{n}"
    choix "jus":
      dire "Vous buvez un jus.{n}"
  fin choisir
fin action
`;

  it('[F030-T005] choisir crée une interruption attendreChoix (mode lettres par défaut)', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    expect(ctxPartie.jeu.parametres.activerChoixNumeriques).toBeFalse();
    ctxPartie.com.executerCommande('boire', false);
    const interruption = ctxPartie.jeu.tamponInterruptions[0];
    expect(interruption).toBeDefined();
    expect(interruption.typeInterruption).toEqual(TypeInterruption.attendreChoix);
  });

  it('[F030-T006] choisir expose 3 choix dans l\'interruption (mode lettres)', () => {
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenarioBase, false);
    ctxPartie.com.executerCommande('boire', false);
    const choix = ctxPartie.jeu.tamponInterruptions[0].choix;
    expect(choix.length).toEqual(3);
    expect(choix[0].valeurs[0].toString()).toEqual('"eau"');
    expect(choix[1].valeurs[0].toString()).toEqual('"café"');
    expect(choix[2].valeurs[0].toString()).toEqual('"jus"');
  });

  it('[F030-T007] choisir crée une interruption attendreChoix (mode nombres)', () => {
    const scenario = 'activer choix numériques.\n' + scenarioBase;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctxPartie.jeu.parametres.activerChoixNumeriques).toBeTrue();
    ctxPartie.com.executerCommande('boire', false);
    const interruption = ctxPartie.jeu.tamponInterruptions[0];
    expect(interruption).toBeDefined();
    expect(interruption.typeInterruption).toEqual(TypeInterruption.attendreChoix);
  });

  it('[F030-T008] choisir expose 3 choix dans l\'interruption (mode nombres)', () => {
    const scenario = 'activer choix numériques.\n' + scenarioBase;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxPartie.com.executerCommande('boire', false);
    const choix = ctxPartie.jeu.tamponInterruptions[0].choix;
    expect(choix.length).toEqual(3);
    expect(choix[0].valeurs[0].toString()).toEqual('"eau"');
    expect(choix[1].valeurs[0].toString()).toEqual('"café"');
    expect(choix[2].valeurs[0].toString()).toEqual('"jus"');
  });

  it('[F030-T009] choisir avec plus de 9 choix (multi-chiffres) — interrupt correctement créée', () => {
    const scenario = `
activer choix numériques.
Le joueur se trouve dans le salon.
Le salon est un lieu.
action tester:
  dire "Choisissez :{n}"
  choisir
    choix "un": dire "1{n}"
    choix "deux": dire "2{n}"
    choix "trois": dire "3{n}"
    choix "quatre": dire "4{n}"
    choix "cinq": dire "5{n}"
    choix "six": dire "6{n}"
    choix "sept": dire "7{n}"
    choix "huit": dire "8{n}"
    choix "neuf": dire "9{n}"
    choix "dix": dire "10{n}"
    choix "onze": dire "11{n}"
    choix "douze": dire "12{n}"
  fin choisir
fin action
`;
    const ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxPartie.com.executerCommande('tester', false);
    const interruption = ctxPartie.jeu.tamponInterruptions[0];
    expect(interruption.typeInterruption).toEqual(TypeInterruption.attendreChoix);
    expect(interruption.choix.length).toEqual(12);
    expect(interruption.choix[9].valeurs[0].toString()).toEqual('"dix"');
    expect(interruption.choix[10].valeurs[0].toString()).toEqual('"onze"');
    expect(interruption.choix[11].valeurs[0].toString()).toEqual('"douze"');
  });

});
