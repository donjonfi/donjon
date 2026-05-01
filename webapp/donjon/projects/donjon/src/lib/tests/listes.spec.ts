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
      'action tester: ' +
      '  changer l’historique contient "Métro". ' +
      'fin action ' +
      'action vérifier: ' +
      '  si l’historique contient "Métro": ' +
      '    changer le joueur est vérifié. ' +
      '  finsi ' +
      'fin action ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"Métro"');

    ctx.com.executerCommande("vérifier", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'vérifié', ctx.eju)).toBeTrue();


  });

  it('Test du métro avec un texte conditionnel', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'Elle contient "bus". ' +
      'action tester: ' +
      '  changer l’historique contient "métro". ' +
      '  changer l’historique ne contient plus "bus". ' +
      'fin action ' +
      'La description du métro est "[si l’historique contient "métro"]métro trouvé[sinon]Pas de métro[finsi]". ' +
      'Le texte du métro est "[si l’historique contient "bus"]Bus trouvé[sinon]Pas de bus[finsi]". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(1);

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}Pas de métro{E}");

    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[texte métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}Bus trouvé{E}");

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"métro"');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(1);


    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}métro trouvé{E}");

    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[texte métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}Pas de bus{E}");

  });

  it('Test du Métro avec un texte conditionnel', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'action tester: ' +
      '  changer l’historique contient "Métro". ' +
      'fin action ' +
      'La description du métro est "[si l’historique contient "Métro"]Métro trouvé[sinon]Pas de Métro[finsi]". ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.listes).toHaveSize(1);
    expect(ctx.jeu.listes[0].intitule.toString()).toEqual('l’historique');
    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    let texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}Pas de Métro{E}");

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"Métro"');

    texteCalcule = ctx.ins.dire.calculerTexteDynamique('[description métro]', 0, undefined, undefined, undefined, undefined);
    expect(texteCalcule).toEqual("{E}Métro trouvé{E}");

  });

  it('Vérifier liste vide après avoir été vidée', () => {

    const scenario = '' +
      'Le métro est un lieu. ' +
      'L’historique est une liste. ' +
      'action remplir: ' +
      '  changer l’historique contient "chinchilla". ' +
      'fin action ' +
      'action vider: ' +
      '  changer l’historique ne contient plus "chinchilla". ' +
      'fin action ' +
      'action vérifier: ' +
      '  si l’historique est vide :' +
      '    changer le joueur est éteint. ' +
      '  sinon ' +
      '    changer le joueur est allumé. ' +
      '  finsi ' +
      'fin action ' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("vérifier", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'éteint', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'allumé', ctx.eju)).toBeFalse();


    ctx.com.executerCommande("remplir", false);
    ctx.com.executerCommande("vérifier", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'éteint', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'allumé', ctx.eju)).toBeTrue();


    ctx.com.executerCommande("vider", false);
    ctx.com.executerCommande("vérifier", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'éteint', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'allumé', ctx.eju)).toBeFalse();

  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] INSTRUCTION AJOUTER PLUSIEURS ÉLÉMENTS À UNE LISTE (#108)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − ajouter plusieurs textes à une liste', () => {

  it('ajouter un seul texte à la liste', () => {

    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      action tester:
        ajouter "jean" à la liste coupables.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"jean"');
  });

  it('ajouter deux textes à la liste', () => {

    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      action tester:
        ajouter "jean" et "marie" à la liste coupables.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"jean"');
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual('"marie"');
  });

  it('ajouter deux textes à la liste des', () => {

    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      action tester:
        ajouter "jean" et "marie" à la liste des coupables.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    expect(ctx.jeu.listes[0].valeurs.length).toBe(0);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"jean"');
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual('"marie"');
  });

  it('ajouter trois textes avec virgule et "et"', () => {

    const scenario = `
      Le salon est un lieu.
      Les suspects sont une liste.
      action tester:
        ajouter "alice", "bob" et "charlie" à la liste suspects.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"alice"');
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual('"bob"');
    expect(ctx.jeu.listes[0].valeurs[2]).toEqual('"charlie"');
  });

});

describe('Liste − ajouter plusieurs nombres à une liste', () => {

  it('ajouter deux nombres à la liste', () => {

    const scenario = `
      Le salon est un lieu.
      Les scores sont une liste.
      action tester:
        ajouter 10 et 20 à la liste scores.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual(10);
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual(20);
  });

  it('ajouter trois nombres avec virgule et "et"', () => {

    const scenario = `
      Le salon est un lieu.
      Les points sont une liste.
      action tester:
        ajouter 1, 2 et 3 à la liste points.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual(1);
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual(2);
    expect(ctx.jeu.listes[0].valeurs[2]).toEqual(3);
  });

});

describe('Liste − ajouter plusieurs intitulés à une liste', () => {

  it('ajouter deux objets du jeu à la liste', () => {

    const scenario = `
      Le salon est un lieu.
      La bougie est un objet dans le salon.
      La clé est un objet dans le salon.
      Les trouvailles sont une liste.
      action tester:
        ajouter la bougie et la clé à la liste trouvailles.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
  });

  it('désambiguïsation : intitulé contenant " à " ne perturbe pas le découpage', () => {

    const scenario = `
      Le salon est un lieu.
      La clé à molette est un objet dans le salon.
      Les outils sont une liste.
      action tester:
        ajouter la clé à molette à la liste outils.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
  });

});

describe('Liste − retirer des textes d\'une liste', () => {

  it('retirer un texte (de la liste)', () => {

    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      Elle contient "jean" et "marie".
      action tester:
        retirer "jean" de la liste coupables.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"marie"');
  });

  it('retirer deux textes (de la liste)', () => {

    const scenario = `
      Le salon est un lieu.
      Les suspects sont une liste.
      Elle contient "alice", "bob" et "charlie".
      action tester:
        retirer "alice" et "charlie" de la liste suspects.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"bob"');
  });

  it('retirer un texte absent de la liste — pas d\'erreur', () => {

    const scenario = `
      Le salon est un lieu.
      Les suspects sont une liste.
      Elle contient "alice".
      action tester:
        retirer "bob" de la liste suspects.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    // alice toujours présente, bob jamais ajouté
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"alice"');
  });

});

describe('Liste − retirer des nombres d\'une liste', () => {

  it('retirer un nombre (de la liste)', () => {

    const scenario = `
      Le salon est un lieu.
      Les scores sont une liste.
      Elle contient 10, 20 et 30.
      action tester:
        retirer 20 de la liste scores.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual(10);
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual(30);
  });

  it('retirer un nombre (de la liste des)', () => {

    const scenario = `
      Le salon est un lieu.
      Les scores sont une liste.
      Elle contient 10, 20 et 30.
      action tester:
        retirer 20 de la liste des scores.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual(10);
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual(30);
  });

});

describe('Liste − retirer des intitulés d\'une liste', () => {

  it('retirer un objet du jeu (de la liste)', () => {

    const scenario = `
      Le salon est un lieu.
      La bougie est un objet dans le salon.
      La clé est un objet dans le salon.
      Les trouvailles sont une liste.
      action initialiser:
        ajouter la bougie et la clé à la liste trouvailles.
      fin action
      action tester:
        retirer la bougie de la liste trouvailles.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("initialiser", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);

    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
  });

  it('alias enlever — équivalent à retirer', () => {

    const scenario = `
      Le salon est un lieu.
      La bougie est un objet dans le salon.
      Les trouvailles sont une liste.
      action initialiser:
        ajouter la bougie à la liste trouvailles.
      fin action
      action tester:
        enlever la bougie de la liste trouvailles.
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("initialiser", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);

    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

});

describe('Liste − vider une liste : 3 formes équivalentes', () => {

  function scenarioAvecAction(action: string): string {
    return `
      Le salon est un lieu.
      Les suspects sont une liste.
      Elle contient "alice", "bob" et "charlie".
      action tester:
        ${action}
      fin action
    `;
  }

  it('vider les suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider les suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

  it('vider la liste suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider la liste suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

  it('vider la liste des suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider la liste des suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

});

describe('Liste − vérifier via condition après ajouter multiple', () => {

  it('vérifier que la liste contient les éléments ajoutés', () => {

    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      action tester:
        ajouter "jean" et "marie" à la liste coupables.
      fin action
      action vérifier:
        si les coupables contient "jean":
          changer le joueur est allumé.
        finsi
      fin action
    `;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);
    ctx.com.executerCommande("vérifier", false);

    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'allumé', ctx.eju)).toBeTrue();
  });

});