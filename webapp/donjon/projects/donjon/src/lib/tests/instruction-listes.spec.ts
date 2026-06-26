import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F098] INSTRUCTIONS SUR LES LISTES (ajouter / retirer / enlever / vider)
//    Cible : utils/jeu/instruction-listes.ts — tests d'intégration pilotés par scénario.
//    Syntaxe DSL reprise des specs prouvés listes.spec.ts (F042) et listes-taille.spec.ts (F043).
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('[F098] Instruction ajouter — textes à une liste', () => {

  it('[F098-T001] ajouter un seul texte à la liste', () => {
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

  it('[F098-T002] ajouter deux textes à la liste (virgule implicite via "et")', () => {
    const scenario = `
      Le salon est un lieu.
      Les coupables sont une liste.
      action tester:
        ajouter "jean" et "marie" à la liste coupables.
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(2);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"jean"');
    expect(ctx.jeu.listes[0].valeurs[1]).toEqual('"marie"');
  });

  it('[F098-T003] ajouter trois textes avec virgule + "et" — forme « à la liste des »', () => {
    const scenario = `
      Le salon est un lieu.
      Les suspects sont une liste.
      action tester:
        ajouter "alice", "bob" et "charlie" à la liste des suspects.
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

describe('[F098] Instruction ajouter — nombres à une liste', () => {

  it('[F098-T004] ajouter deux nombres à la liste (stockés nus)', () => {
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

  it('[F098-T005] ajouter trois nombres avec virgule + "et"', () => {
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

describe('[F098] Instruction ajouter — intitulés (objets du jeu) à une liste', () => {

  it('[F098-T006] ajouter deux objets du jeu à la liste (taille seulement)', () => {
    // pour un intitulé, la représentation stockée n'est pas une simple string :
    // on n'asserte que la taille (cf. F042-T035).
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

  it('[F098-T007] désambiguïsation : intitulé contenant " à " ne casse pas le découpage', () => {
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

describe('[F098] Instruction retirer / enlever — d\'une liste', () => {

  it('[F098-T008] retirer un texte (de la liste)', () => {
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

  it('[F098-T009] retirer deux textes (de la liste)', () => {
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

  it('[F098-T010] retirer un texte absent — pas d\'erreur, liste inchangée', () => {
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

    expect(ctx.jeu.listes[0].valeurs).toHaveSize(1);
    expect(ctx.jeu.listes[0].valeurs[0]).toEqual('"alice"');
  });

  it('[F098-T011] retirer un nombre (de la liste des)', () => {
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

  it('[F098-T012] alias « enlever » équivalent à « retirer » sur un intitulé', () => {
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

describe('[F098] Instruction vider — 3 formes équivalentes', () => {

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

  it('[F098-T013] vider les suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider les suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

  it('[F098-T014] vider la liste suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider la liste suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

  it('[F098-T015] vider la liste des suspects', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioAvecAction('vider la liste des suspects.'), false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(3);
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.listes[0].valeurs).toHaveSize(0);
  });

});

describe('[F098] Liste — condition après ajout (intégration ajouter + si … contient)', () => {

  it('[F098-T016] « si les coupables contient "jean" » est vrai après ajout', () => {
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
