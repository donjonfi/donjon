import { AnalyseurV8Routines } from "../utils/compilation/analyseur/analyseur-v8.routines";
import { AnalyseurV8Utils } from "../utils/compilation/analyseur/analyseur-v8.utils";
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

});
