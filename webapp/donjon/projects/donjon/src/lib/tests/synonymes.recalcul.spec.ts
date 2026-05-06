import { TestUtils } from "../utils/test-utils";

describe("Synonymes − recalcul après changement d'intitulé", () => {

  it("[F048-T001] synonymes auto recalculés après changer intitulé", () => {

    const scenario =
      'La salle est un lieu.\n' +
      '  la boîte rouge est un objet vu ici.\n' +
      'action transformer ceci:\n' +
      '  définition:\n' +
      '    ceci est un objet.\n' +
      '  phase exécution:\n' +
      '    changer l\'intitulé de ceci est "le coffre bleu".\n' +
      'fin action\n';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    // index 0 = inventaire, index 1 = joueur, index 2 = premier objet du scénario
    const boite = ctx.jeu.objets[2];

    // synonymes auto initiaux (normalisés sans accent)
    const synAvant = boite.synonymes.map(s => s.nomEpithete);
    expect(synAvant).toContain('boite');
    expect(synAvant).toContain('rouge');

    // changer l'intitulé
    ctx.com.executerCommande('transformer la boîte rouge', false);

    // synonymes recalculés depuis le nouvel intitulé
    const synApres = boite.synonymes.map(s => s.nomEpithete);
    expect(synApres).toContain('coffre');
    expect(synApres).toContain('bleu');
    expect(synApres).not.toContain('boite');
    expect(synApres).not.toContain('rouge');
  });

  it("[F048-T002] changer les synonymes de ceci remplace les synonymes", () => {

    const scenario =
      'La salle est un lieu.\n' +
      '  la boîte rouge est un objet vu ici.\n' +
      'action transformer ceci:\n' +
      '  définition:\n' +
      '    ceci est un objet.\n' +
      '  phase exécution:\n' +
      '    changer les synonymes de ceci sont "coffre" et "vieux".\n' +
      'fin action\n';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const boite = ctx.jeu.objets[2];

    ctx.com.executerCommande('transformer la boîte rouge', false);

    const synApres = boite.synonymes.map(s => s.nomEpithete);
    expect(synApres).toContain('coffre');
    expect(synApres).toContain('vieux');
    expect(synApres).not.toContain('boite');
    expect(synApres).not.toContain('rouge');
  });

  it("[F048-T003] ajouter aux synonymes de ceci ajoute sans effacer les existants", () => {

    const scenario =
      'La salle est un lieu.\n' +
      '  la boîte rouge est un objet vu ici.\n' +
      'action transformer ceci:\n' +
      '  définition:\n' +
      '    ceci est un objet.\n' +
      '  phase exécution:\n' +
      '    ajouter "coffre" et "vieux" aux synonymes de ceci.\n' +
      'fin action\n';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const boite = ctx.jeu.objets[2];

    // synonymes auto présents avant l'action
    const synAvant = boite.synonymes.map(s => s.nomEpithete);
    expect(synAvant).toContain('boite');
    expect(synAvant).toContain('rouge');

    ctx.com.executerCommande('transformer la boîte rouge', false);

    // anciens synonymes conservés + nouveaux ajoutés
    const synApres = boite.synonymes.map(s => s.nomEpithete);
    expect(synApres).toContain('boite');
    expect(synApres).toContain('rouge');
    expect(synApres).toContain('coffre');
    expect(synApres).toContain('vieux');
  });

  it("[F048-T004] ajouter aux synonymes d'un objet nommé ajoute sans effacer les existants", () => {

    const scenario =
      'La salle est un lieu.\n' +
      '  la boîte rouge est un objet vu ici.\n' +
      'action transformer:\n' +
      '  phase exécution:\n' +
      '    ajouter "coffre" et "vieux" aux synonymes de la boîte rouge.\n' +
      'fin action\n';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const boite = ctx.jeu.objets[2];

    const synAvant = boite.synonymes.map(s => s.nomEpithete);
    expect(synAvant).toContain('boite');
    expect(synAvant).toContain('rouge');

    ctx.com.executerCommande('transformer', false);

    const synApres = boite.synonymes.map(s => s.nomEpithete);
    expect(synApres).toContain('boite');
    expect(synApres).toContain('rouge');
    expect(synApres).toContain('coffre');
    expect(synApres).toContain('vieux');
  });

  it("[F048-T005] synonymes non recalculés si activerSynonymesAuto désactivé", () => {

    const scenario =
      'désactiver synonymes automatiques.\n' +
      'La salle est un lieu.\n' +
      '  la boîte rouge est un objet vu ici.\n' +
      'action transformer ceci:\n' +
      '  définition:\n' +
      '    ceci est un objet.\n' +
      '  phase exécution:\n' +
      '    changer l\'intitulé de ceci est "le coffre bleu".\n' +
      'fin action\n';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    // index 0 = inventaire, index 1 = joueur, index 2 = premier objet du scénario
    const boite = ctx.jeu.objets[2];

    // pas de synonymes auto au départ
    expect(boite.synonymes).toHaveSize(0);

    ctx.com.executerCommande('transformer la boîte rouge', false);

    // toujours pas de synonymes auto après le changement
    expect(boite.synonymes).toHaveSize(0);
  });

});
