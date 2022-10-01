import { AnalyseurV8Routines } from "../utils/compilation/analyseur/analyseur-v8.routines";
import { AnalyseurV8Utils } from "../utils/compilation/analyseur/analyseur-v8.utils";
import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ERoutine } from "../models/compilateur/routine";

describe('Traiter routine', () => {

  it('Analyser routines d’un scénario avec 1 routine, 1 action et 1 règle.', function () {
    let scenario =
      // ligne 1, phrase 1, index 0
      'routine afficherScore:\n' +
      '  dire "Votre score: [c score]".\n' +
      'fin routine\n' +
      '\n' +
      // ligne 5, phrase 4, index 3
      'règle avant commencer le jeu:\n' +
      '  dire "Début de la partie !".\n' +
      'fin règle\n' +
      '\n' +
      // ligne 9, phrase 7, index 6
      'action sauter:\n' +
      '  dire "Vous sautez".\n' +
      'fin action';

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
    // 9 phrases
    expect(phrases).toHaveSize(9);
    // 11 lignes
    expect(phrases[phrases.length - 1].ligne).toBe(11);

    const ctx = new ContexteAnalyseV8();

    expect(ctx.routinesSimples).toHaveSize(0);
    expect(ctx.routinesRegles).toHaveSize(0);
    expect(ctx.routinesAction).toHaveSize(0);

    // Partie 1: ROUTINE SIMPLE
    // => routine afficherScore: (ligne 1, phrase 1, index 0)
    ctx.indexProchainePhrase = 0;
    let debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phrases[ctx.indexProchainePhrase]);
    expect(debutRoutineTrouve).toEqual(ERoutine.simple);
    let resultatTraiterRoutine = AnalyseurV8Routines.traiterRoutine(debutRoutineTrouve, phrases, ctx);
    expect(resultatTraiterRoutine).toBeTrue();
    expect(ctx.routinesSimples).toHaveSize(1);
    expect(ctx.routinesRegles).toHaveSize(0);
    expect(ctx.routinesAction).toHaveSize(0);
    expect(ctx.indexProchainePhrase).toBe(3);
    expect(phrases[ctx.indexProchainePhrase].ligne).toBe(5);

    // Partie 2: RÈGLE
    // => règle avant commencer le jeu: (ligne 5, phrase 4, index 3)
    debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phrases[ctx.indexProchainePhrase]);
    expect(debutRoutineTrouve).toEqual(ERoutine.regle);
    resultatTraiterRoutine = AnalyseurV8Routines.traiterRoutine(debutRoutineTrouve, phrases, ctx);
    expect(resultatTraiterRoutine).toBeTrue();
    expect(ctx.routinesSimples).toHaveSize(1);
    expect(ctx.routinesRegles).toHaveSize(1);
    expect(ctx.routinesAction).toHaveSize(0);
    expect(ctx.indexProchainePhrase).toBe(6);
    expect(phrases[ctx.indexProchainePhrase].ligne).toBe(9);

    // Partie 3: ACTION
    // => règle avant commencer le jeu: (ligne 9, phrase 7, index 6)
    debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phrases[ctx.indexProchainePhrase]);
    expect(debutRoutineTrouve).toEqual(ERoutine.action);
    resultatTraiterRoutine = AnalyseurV8Routines.traiterRoutine(debutRoutineTrouve, phrases, ctx);
    expect(resultatTraiterRoutine).toBeTrue();
    expect(ctx.routinesSimples).toHaveSize(1);
    expect(ctx.routinesRegles).toHaveSize(1);
    expect(ctx.routinesAction).toHaveSize(1);
    expect(ctx.indexProchainePhrase).toBe(9);
    // expect(phrases[ctx.indexProchainePhrase].ligne).toBe(12); // on est à la fin donc cette ligne n’existe pas…

  });

  it('routine avec une condition', function () {
    let scenario =
      'routine maRoutine:\n' +
      '  si le joueur est présent:\n' +
      '    dire "Le joueur est présent!"\n' +
      '  sinon\n' +
      '    dire "Le joueur est absent!"\n' +
      '  fin si\n' +
      'fin routine\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);

    expect(res.messages).toHaveSize(0);
    expect(res.routinesSimples).toHaveSize(1);
    const maRoutine = res.routinesSimples[0];
    expect(maRoutine.nom).toEqual('maRoutine');
    expect(maRoutine.instructions).toHaveSize(1);
    const condition = maRoutine.instructions[0];
    expect(condition.condition).toBeDefined();
    expect(condition.instructionsSiConditionVerifiee).toHaveSize(1);
    expect(condition.instructionsSiConditionPasVerifiee).toHaveSize(1);
  });

  it('routine avec 1 condition dont le fin si est manquant', function () {
    let scenario =
      'routine maRoutine:\n' +
      '  si le joueur est présent:\n' +
      '    dire "Le joueur est présent!"\n' +
      '  sinon\n' +
      '    dire "Le joueur est absent!"\n' +
      'fin routine\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // erreur fin bloc manquant
    expect(res.messages).toHaveSize(1);
    const message = res.messages[0];
    expect(message.code).toBe(CodeMessage.finBlocManquant);
    // la routine a tout de même pu être créée
    expect(res.routinesSimples).toHaveSize(1);
    const maRoutine = res.routinesSimples[0];
    expect(maRoutine.nom).toEqual('maRoutine');
    expect(maRoutine.instructions).toHaveSize(1);
    const condition = maRoutine.instructions[0];
    expect(condition.condition).toBeDefined();
    expect(condition.instructionsSiConditionVerifiee).toHaveSize(1);
    expect(condition.instructionsSiConditionPasVerifiee).toHaveSize(1);
  });

  it('routine avec 1 condition dont le fin routine est manquant', function () {
    let scenario =
      'routine maRoutine:\n' +
      '  si le joueur est présent:\n' +
      '    dire "Le joueur est présent!"\n' +
      '  sinon\n' +
      '    dire "Le joueur est absent!"\n' +
      '  fin si\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // erreur fin bloc manquant
    expect(res.messages).toHaveSize(1);
    const message = res.messages[0];
    expect(message.code).toBe(CodeMessage.finRoutineManquant);
    expect(res.actions).toHaveSize(0);
    // la routine a tout de même pu être créée
    expect(res.routinesSimples).toHaveSize(1);
    const maRoutine = res.routinesSimples[0];
    expect(maRoutine.nom).toEqual('maRoutine');
    expect(maRoutine.instructions).toHaveSize(1);
    const condition = maRoutine.instructions[0];
    expect(condition.condition).toBeDefined();
    expect(condition.instructionsSiConditionVerifiee).toHaveSize(1);
    expect(condition.instructionsSiConditionPasVerifiee).toHaveSize(1);
  });

  it('action avec 1 condition dont le fin action est différent', function () {
    let scenario =
      'action sauter:\n' +
      '  si le joueur est présent:\n' +
      '    dire "Vous sautez!"\n' +
      '  sinon\n' +
      '    dire "Le joueur est absent!"\n' +
      '  fin si\n' +
      'fin routine\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // erreur fin bloc manquant
    expect(res.messages).toHaveSize(1);
    const message = res.messages[0];
    expect(message.code).toBe(CodeMessage.finRoutineDifferent);
    expect(res.routinesSimples).toHaveSize(0);
    // l’action a tout de même pu être créée
    expect(res.actions).toHaveSize(1);
    const monAction = res.actions[0];
    expect(monAction.infinitif).toEqual('sauter');
    expect(monAction.phaseExecution).toHaveSize(1);
    const condition = monAction.phaseExecution[0];
    expect(condition.condition).toBeDefined();
    expect(condition.instructionsSiConditionVerifiee).toHaveSize(1);
    expect(condition.instructionsSiConditionPasVerifiee).toHaveSize(1);
  });

  it('action avec 1 condition dont le fin action est différent', function () {
    let scenario =
      'action sauter:\n' +
      '  si le joueur est présent:\n' +
      '    dire "Vous sautez!"\n' +
      '  sinon\n' +
      '    dire "Le joueur est absent!"\n' +
      '  fin si\n' +
      'fin routine\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // erreur fin bloc manquant
    expect(res.messages).toHaveSize(1);
    const message = res.messages[0];
    expect(message.code).toBe(CodeMessage.finRoutineDifferent);
    expect(res.routinesSimples).toHaveSize(0);
    // l’action a tout de même pu être créée
    expect(res.actions).toHaveSize(1);
    const monAction = res.actions[0];
    expect(monAction.infinitif).toEqual('sauter');
    expect(monAction.phaseExecution).toHaveSize(1);
    const condition = monAction.phaseExecution[0];
    expect(condition.condition).toBeDefined();
    expect(condition.instructionsSiConditionVerifiee).toHaveSize(1);
    expect(condition.instructionsSiConditionPasVerifiee).toHaveSize(1);
  });
  
});
