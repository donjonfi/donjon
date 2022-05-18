import { CompilateurV8 } from "../utils/compilation/compilateur-v8";

describe('Compilateur V8 − Analyser scénario', () => {

  it('Analyser scénario avec 3 lieux, 1 objet et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      // 'Le joueur peut sauter: dire "Vous sautez!". ' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation).toBeDefined();
    console.log("erreurs:", resultatCompilation.erreurs);
    
    expect(resultatCompilation.erreurs.length).toEqual(0); // aucune erreur
    expect(resultatCompilation.monde.lieux.length).toEqual(3); // les 3 lieux
    expect(resultatCompilation.monde.objets.length).toEqual(2); // le joueur + l’alligator
    expect(resultatCompilation.regles.length).toEqual(0); // aucune règle
    expect(resultatCompilation.actions.length).toEqual(0); // aucune action
    expect(resultatCompilation.listes.length).toEqual(1); // liste historique

  });

  it('Analyser scénario avec 3 lieux, 1 objet, 1 action et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. \n' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. \n' +
      'La salle de bain est un lieu au nord de la chambre. \n' +
      'L’alligator est dans la chambre. \n' +
      'action sauter: \n' +
      '  dire "Vous sautez". \n' +
      'fin action \n' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation).toBeDefined();
    console.log("erreurs:", resultatCompilation.erreurs);
    
    expect(resultatCompilation.erreurs.length).toEqual(0); // aucune erreur
    expect(resultatCompilation.monde.lieux.length).toEqual(3); // les 3 lieux
    expect(resultatCompilation.monde.objets.length).toEqual(2); // le joueur + l’alligator
    expect(resultatCompilation.actions.length).toEqual(1); // action sauter
    expect(resultatCompilation.regles.length).toEqual(0); // aucune règle
    expect(resultatCompilation.listes.length).toEqual(1); // liste historique

  });

  // it('Analyser scénario avec 3 lieux, 1 objet, 1 règle et 1 liste.', function () {
  //   let scenario =
  //     'La chambre est un lieu. ' +
  //     'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
  //     'La salle de bain est un lieu au nord de la chambre. ' +
  //     'L’alligator est dans la chambre. ' +
  //     'action sauter: ' +
  //     '  dire "Vous sautez". ' +
  //     'fin action ' +
  //     'règle avant sauter: ' +
  //     '  dire "Vous allez sauter". ' +
  //     'fin action ' +
  //     'L’historique est une liste. '
  //     ;
  //   const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

  //   expect(resultatCompilation).toBeDefined();
  //   console.log("erreurs:", resultatCompilation.erreurs);
    
  //   expect(resultatCompilation.erreurs.length).toEqual(0); // aucune erreur
  //   expect(resultatCompilation.monde.lieux.length).toEqual(3); // les 3 lieux
  //   expect(resultatCompilation.monde.objets.length).toEqual(2); // le joueur + l’alligator
  //   expect(resultatCompilation.actions.length).toEqual(1); // action sauter
  //   expect(resultatCompilation.regles.length).toEqual(0); // règle avant sauter
  //   expect(resultatCompilation.listes.length).toEqual(1); // liste historique

  // });

});

