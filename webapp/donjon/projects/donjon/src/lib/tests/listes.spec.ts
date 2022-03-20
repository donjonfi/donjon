import { ConditionsUtils, GroupeNominal } from "../../public-api";

import { Jeu } from "../models/jeu/jeu";
import { Liste } from "../models/jeu/liste";
import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] OPPÉRATIONS SUR LES LISTES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Déclarer une liste vide', () => {

  // définir un jeu avec une liste 'historique' vide
  let jeu: Jeu = new Jeu();
  let historique = new Liste("historique", new GroupeNominal("l’", "historique"));
  jeu.listes.push(historique);
  const condUtils = new ConditionsUtils(jeu, false);

  it('vérifier que la taille de la liste (vaut 0)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier que la taille de la liste (vaut 2)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 2', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier que la liste est vide (est vide)', () => {
    expect(condUtils.siEstVrai('l’historique est vide', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "élément pas présent"', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "élément pas présent"', undefined, undefined, undefined, 0)).toBeTrue();
  });

});

describe('Liste − Déclarer une liste remplie', () => {

  // définir un jeu avec une liste 'historique' vide
  let jeu: Jeu = new Jeu();
  let historique = new Liste("historique", new GroupeNominal("l’", "historique"));
  historique.ajouterTexte('"bougie allumée"');
  historique.ajouterTexte('"Metro"');
  jeu.listes.push(historique);
  const condUtils = new ConditionsUtils(jeu, false);

  it('vérifier que la taille de la liste (vaut 0)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier que la taille de la liste (vaut 1)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier que la taille de la liste (vaut 2)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 2', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier que la liste est vide (est vide)', () => {
    expect(condUtils.siEstVrai('l’historique est vide', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "élément pas présent"', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "élément pas présent"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "bougie allumée"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (inclut)', () => {
    expect(condUtils.siEstVrai('l’historique inclut "bougie allumée"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "bougie allumée"', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui se trouve dans la liste (n’inclut pas)', () => {
    expect(condUtils.siEstVrai('l’historique n’inclut pas "bougie allumée"', undefined, undefined, undefined, 0)).toBeFalse();
  });

});

describe('Liste − Déclarer une liste remplie (Majuscule)', () => {

  // définir un jeu avec une liste 'historique' vide
  let jeu: Jeu = new Jeu();
  let historique = new Liste("historique", new GroupeNominal("l’", "historique"));
  historique.ajouterTexte('"Metro"');
  jeu.listes.push(historique);
  const condUtils = new ConditionsUtils(jeu, false);

  it('vérifier que la taille de la liste (vaut 0)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier que la taille de la liste (vaut 1)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier que la liste est vide (est vide)', () => {
    expect(condUtils.siEstVrai('l’historique est vide', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "élément pas présent"', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "élément pas présent"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier Un Élément qui se trouve dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "Metro"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier Un Élément qui se trouve dans la liste (inclut)', () => {
    expect(condUtils.siEstVrai('l’historique inclut "Metro"', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('vérifier Un Élément qui se trouve dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "Metro"', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('vérifier Un Élément qui se trouve dans la liste (n’inclut pas)', () => {
    expect(condUtils.siEstVrai('l’historique n’inclut pas "Metro"', undefined, undefined, undefined, 0)).toBeFalse();
  });

});


describe('Liste − Scénario: Déclarer une liste remplie (Majuscule)', () => {


  it('Test du Métro avec une instruction si', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'Le joueur peut tester: ' +
      '  changer l’historique contient "Métro". ' +
      'Le joueur peut vérifier: ' +
      '  si l’historique contient "Métro": ' +
      '    changer le joueur est vérifié; ' +
      '  finsi.' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"Métro"');

    ctx.com.executerCommande("vérifier");

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'vérifié', ctx.eju)).toBeTrue();


  });

  it('Test du métro avec un texte conditionnel', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'Le joueur peut tester: ' +
      '  changer l’historique contient "métro". ' +
      'La description du métro est "[si l’historique contient "métro"]métro trouvé[sinon]Pas de métro[finsi]". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("Pas de métro");

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"métro"');

    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("métro trouvé");

  });

  it('Test du Métro avec un texte conditionnel', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'Le joueur peut tester: ' +
      '  changer l’historique contient "Métro". ' +
      'La description du métro est "[si l’historique contient "Métro"]Métro trouvé[sinon]Pas de Métro[finsi]". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("Pas de Métro");

    ctx.com.executerCommande("tester");

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"Métro"');

    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("Métro trouvé");

  });

});