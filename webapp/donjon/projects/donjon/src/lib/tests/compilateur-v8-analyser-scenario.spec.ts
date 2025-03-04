import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";

describe('Compilateur V8 − Analyser scénario', () => {

  it('Analyser scénario avec 3 lieux, 1 objet et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      'action sauter: dire "Vous sautez!". fin action ' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(resultatCompilation).toBeDefined();
    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(3); // les 3 lieux
    expect(resultatCompilation.monde.objets).toHaveSize(2); // le joueur + l’alligator
    expect(resultatCompilation.regles).toHaveSize(0); // aucune règle
    expect(resultatCompilation.actions).toHaveSize(1); // 1 action
    expect(resultatCompilation.listes).toHaveSize(1); // liste historique

  });

  it('Analyser scénario avec 1 lieu, 2 objets et 1 routine', function () {
    let scenario =
      'Le salon est un lieu.\n' +
      'La table est un support dans le salon.\n' +
      'La bouteille est un contenant sur la table.\n' +
      '\n' +
      'routine afficherScore:\n' +
      '  dire "Votre score: [c score]".\n' +
      'fin routine\n';

    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(1); //
    expect(resultatCompilation.monde.objets).toHaveSize(3); // le joueur + les autres objets
    expect(resultatCompilation.regles).toHaveSize(0);
    expect(resultatCompilation.routinesSimples).toHaveSize(1);
    expect(resultatCompilation.actions).toHaveSize(0);
    expect(resultatCompilation.listes).toHaveSize(0);
  });


  it('Analyser scénario avec 1 lieu, 2 objets et 1 routine PAS finie', function () {
    let scenario =
      'Le salon est un lieu.\n' +
      'La table est un support dans le salon.\n' +
      'La bouteille est un contenant sur la table.\n' +
      '\n' +
      'routine afficherScore:\n' +
      '  dire "Votre score: [c score]".\n'

    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario);

    expect(resultatCompilation).toBeDefined();
    // 1 message: routine pas finie
    expect(resultatCompilation.messages).toHaveSize(1);
    const message = resultatCompilation.messages[0];
    expect(message.code).toBe(CodeMessage.finRoutineManquant);
    // la routine est tout de même ajoutée
    expect(resultatCompilation.monde.lieux).toHaveSize(1);
    expect(resultatCompilation.monde.objets).toHaveSize(3); // le joueur + les autres objets
    expect(resultatCompilation.regles).toHaveSize(0);
    expect(resultatCompilation.routinesSimples).toHaveSize(1);
    expect(resultatCompilation.actions).toHaveSize(0);
    expect(resultatCompilation.listes).toHaveSize(0);
  });

  it('Analyser scénario avec 1 lieu, 2 objets et 1 règle.', function () {
    let scenario =
      'Le salon est un lieu.\n' +
      'La table est un support dans le salon.\n' +
      'La bouteille est un contenant sur la table.\n' +
      '\n' +
      'règle avant commencer le jeu:\n' +
      '  dire "Début de la partie !".\n' +
      'fin règle';

    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario);

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(1); //
    expect(resultatCompilation.monde.objets).toHaveSize(3); // le joueur + les autres objets
    expect(resultatCompilation.regles).toHaveSize(1);
    expect(resultatCompilation.routinesSimples).toHaveSize(0);
    expect(resultatCompilation.actions).toHaveSize(0);
    expect(resultatCompilation.listes).toHaveSize(0);
  });


  it('Analyser scénario avec 1 lieu, 2 objets et 1 règle MAL finie.', function () {
    let scenario =
      'Le salon est un lieu.\n' +
      'La table est un support dans le salon.\n' +
      'La bouteille est un contenant sur la table.\n' +
      '\n' +
      'règle avant commencer le jeu:\n' +
      '  dire "Début de la partie !".\n' +
      'fin routine';

    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation.messages).toHaveSize(1); // erreur
    const message = resultatCompilation.messages[0];
    expect(message.code).toBe(CodeMessage.finRoutineDifferent);
    expect(resultatCompilation.monde.lieux).toHaveSize(1); //
    expect(resultatCompilation.monde.objets).toHaveSize(3); // le joueur + les autres objets
    expect(resultatCompilation.regles).toHaveSize(1);
    expect(resultatCompilation.routinesSimples).toHaveSize(0);
    expect(resultatCompilation.actions).toHaveSize(0);
    expect(resultatCompilation.listes).toHaveSize(0);
  });

  it('Analyser scénario avec 1 lieu, 2 objets, 1 routine et 1 règle.', function () {
    let scenario =
      'Le salon est un lieu.\n' +
      'La table est un support dans le salon.\n' +
      'La bouteille est un contenant sur la table.\n' +
      '\n' +
      'routine afficherScore:\n' +
      '  dire "Votre score: [c score]".\n' +
      'fin routine\n' +
      '\n' +
      'règle avant commencer le jeu:\n' +
      '  dire "Début de la partie !".\n' +
      'fin règle';

    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario);

    expect(resultatCompilation).toBeDefined();

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(1); //
    expect(resultatCompilation.monde.objets).toHaveSize(3); // le joueur + les autres objets
    expect(resultatCompilation.regles).toHaveSize(1);
    expect(resultatCompilation.routinesSimples).toHaveSize(1);
    expect(resultatCompilation.actions).toHaveSize(0);
    expect(resultatCompilation.listes).toHaveSize(0);
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

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(3); // les 3 lieux
    expect(resultatCompilation.monde.objets).toHaveSize(2); // le joueur + l’alligator
    expect(resultatCompilation.actions).toHaveSize(1); // action sauter
    expect(resultatCompilation.regles).toHaveSize(0); // aucune règle
    expect(resultatCompilation.listes).toHaveSize(1); // liste historique

  });

  it('Analyser scénario avec 3 lieux, 1 objet, 1 règle et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      'action sauter: ' +
      '  dire "Vous sautez". ' +
      'fin action ' +
      'règle avant sauter: ' +
      '  dire "Vous allez sauter". ' +
      'fin règle ' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation).toBeDefined();

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(3); // les 3 lieux
    expect(resultatCompilation.monde.objets).toHaveSize(2); // joueur + l’alligator
    expect(resultatCompilation.actions).toHaveSize(1); // action sauter
    expect(resultatCompilation.regles).toHaveSize(1); // règle avant sauter
    expect(resultatCompilation.listes).toHaveSize(1); // liste historique

  });

  it('Analyser scénario avec 1 lieu, 3 objets, 2 actions, 1 personne.', function () {
    let scenario =
      'La cuisine est un lieu.\n' +
      'La table est dans la cuisine.\n' +
      'Le truc est ici.\n' +
      'La chaise est dans la cuisine.\n' +
      'action tester la chaise:\n' +
      '  dire "Elle semble costaud."\n' +
      'fin action\n' +
      'action tester ceci avec la chaise:\n' +
      '  dire "La chaise a permis de tester [intitulé ceci]".\n' +
      'fin action\n' +
      'le robot est une personne ici.\n' +
      'Sa description est "Un robot qui traine.".\n' +
      'Sa réaction est "Bip bip!".\n' +
      '\n' +
      '';
    const resultatCompilation = CompilateurV8.analyserScenarioSeul(scenario, false);

    expect(resultatCompilation).toBeDefined();

    expect(resultatCompilation.messages).toHaveSize(0); // aucune erreur
    expect(resultatCompilation.monde.lieux).toHaveSize(1); // cuisine
    expect(resultatCompilation.monde.objets).toHaveSize(5); // joueur + 4 objets
    expect(resultatCompilation.monde.objets[3].nom).toEqual('chaise');
    expect(resultatCompilation.monde.objets[3].reactions).toHaveSize(0);
    expect(resultatCompilation.monde.objets[4].nom).toEqual('robot');
    expect(resultatCompilation.monde.objets[4].reactions).toHaveSize(1);
    expect(resultatCompilation.actions).toHaveSize(2); // 2 actions
    expect(resultatCompilation.actions[0].infinitif).toEqual('tester');
    expect(resultatCompilation.actions[0].ceci).toBeTrue();
    expect(resultatCompilation.actions[0].cibleCeci.nom).toEqual('chaise');
    expect(resultatCompilation.actions[0].cela).toBeFalse();
    expect(resultatCompilation.actions[1].infinitif).toEqual('tester');
    expect(resultatCompilation.actions[1].ceci).toBeTrue();
    expect(resultatCompilation.actions[1].cibleCeci.nom).toEqual('objet');
    expect(resultatCompilation.actions[1].cibleCeci.epithete).toEqual('vu, visible et accessible');
    expect(resultatCompilation.actions[1].cela).toBeTrue();
    expect(resultatCompilation.actions[1].cibleCela.nom).toEqual('chaise');
    expect(resultatCompilation.regles).toHaveSize(0); // aucune règle
    expect(resultatCompilation.listes).toHaveSize(0); // aucune liste

  });

});

