import { CompilateurV8 } from "../utils/compilation/compilateur-v8";

describe('Compilateur V8 − Analyser scénario', () => {

  it('Analyser scénario avec 3 lieux, 1 objet, 1 action et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      'Le joueur peut sauter: dire "Vous sautez!". ' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurV8.analyserScenarioEtActions(scenario, undefined, false);

    expect(resultatCompilation).toBeDefined();
    console.log("erreurs:", resultatCompilation.erreurs);
    
    expect(resultatCompilation.erreurs.length).toEqual(0); // aucune erreur
    expect(resultatCompilation.monde.lieux.length).toEqual(3); // les 3 lieux
    expect(resultatCompilation.monde.objets.length).toEqual(2); // le joueur + l’alligator
    expect(resultatCompilation.actions.length).toEqual(1); // action sauter
    expect(resultatCompilation.listes.length).toEqual(1); // liste historique

  });

});

