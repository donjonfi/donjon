import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ERoutine } from "../models/compilateur/routine";
import { Verificateur } from "../utils/compilation/verificateur";

describe('Vérificateur - début/fin routine', () => {

  it('Phrase: La plante est un objet', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    //  la plante est un objet
    expect(Verificateur.estNouvelleRoutine(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRoutine(phrases[0], new ContexteAnalyseV8())).toBeFalse();
  });

  it('Phrases: « action nager: dire "vous nagez" fin action »', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action nager:\n' +
      '  dire "Vous nagez".\n' +
      'fin action'
    );
    expect(phrases).toHaveSize(3); // 3 phrases

    // action nager
    expect(phrases[0].ligne).toEqual(1);
    expect(Verificateur.estNouvelleRoutine(phrases[0], new ContexteAnalyseV8())).toBeTrue();
    expect(Verificateur.estFinRoutine(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    // dire "Vous nagez"
    expect(phrases[1].ligne).toEqual(2);
    expect(Verificateur.estNouvelleRoutine(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRoutine(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    // fin action
    expect(phrases[2].ligne).toEqual(3);
    expect(Verificateur.estNouvelleRoutine(phrases[2], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRoutine(phrases[2], new ContexteAnalyseV8())).toBeTrue();

  });


  it('Phrases: « règle avant manger ceci: dire "Je n’ai pas faim". fin règle »', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant manger ceci: dire "Je n’ai pas faim". fin règle.'
    );

    expect(phrases).toHaveSize(3); // 3 phrases
    // règle avant manger ceci:
    expect(phrases[0].ligne).toEqual(1);
    expect(Verificateur.estNouvelleRoutine(phrases[0], new ContexteAnalyseV8())).toBeTrue();
    expect(Verificateur.estFinRoutine(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    // dire "Je n’ai pas faim".
    expect(phrases[1].ligne).toEqual(1);
    expect(Verificateur.estNouvelleRoutine(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRoutine(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    // fin règle.
    expect(phrases[2].ligne).toEqual(1);
    expect(Verificateur.estNouvelleRoutine(phrases[2], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRoutine(phrases[2], new ContexteAnalyseV8())).toBeTrue();

  });

});

describe('Vérificateur - verifierBlocs', () => {

  it('Phrase: La plante est un objet', () => {
    let ctx = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );

    Verificateur.verifierRoutines(phrases, ctx);

    // aucune erreur
    expect(ctx.erreurs).toHaveSize(0);
    // pas de routine (uniquement description)
    expect(ctx.routines).toHaveSize(0);
  });

  it('Phrase: action nager: dire "vous nagez" fin action', () => {
    let ctx = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action nager:\n' +
      '  dire "Vous nagez".\n' +
      'fin action'
    );

    Verificateur.verifierRoutines(phrases, ctx);

    // aucune erreur
    expect(ctx.erreurs).toHaveSize(0);
    // 1 routine (action)
    expect(ctx.routines).toHaveSize(1);
    expect(ctx.routines[0]).toBe(ctx.getRoutineLigne(2));
    expect(ctx.getRoutineLigne(2)).toBeDefined();
    expect(ctx.getRoutineLigne(2).type).toBe(ERoutine.action);
    expect(ctx.routines[0].type).toBe(ERoutine.action);
    expect(ctx.routines[0].debut).toBe(1);
    expect(ctx.routines[0].fin).toBe(3);
    expect(ctx.routines[0].ouvert).toBeFalse();
    expect(ctx.routines[0].correctementFini).toBeTrue();
  });

  it('Règle pas finie: avant commencer le jeu: dire "On va commencer! Le palais enchanté est un lieu.', () => {
    let ctx = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant commencer le jeu:\n' +
      '  dire "On va commencer!".\n' +
      'Le palais enchanté est un lieu.'
    );

    Verificateur.verifierRoutines(phrases, ctx);

    // 1 erreur: 1 bloc mal fermé
    expect(ctx.erreurs).toHaveSize(1);
    // 1 rouine (action)
    expect(ctx.routines).toHaveSize(1);
    expect(ctx.routines[0]).toBe(ctx.getRoutineLigne(2));
    expect(ctx.getRoutineLigne(2)).toBeDefined();
    expect(ctx.getRoutineLigne(2).type).toBe(ERoutine.regle);
    expect(ctx.routines[0].type).toBe(ERoutine.regle);
    expect(ctx.routines[0].debut).toBe(1);
    expect(ctx.routines[0].fin).toBe(3); // fermé auto en fin de code
    expect(ctx.routines[0].ouvert).toBeFalse();
    expect(ctx.routines[0].correctementFini).toBeFalse(); // pas fermé par un fin bloc
  });

  it('Action pas finie: nouvelle action débutée avant d’avoir clôturé la précédente.', () => {
    let ctx = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action prendre ceci:\n' +
      '  dire "Vous prenez [intitulé ceci].".\n' +
      'action sauter:\n' +
      '  dire "Vous sautez".\n' +
      'fin action\n' +
      'L’arbre est un objet.\n'
    );

    Verificateur.verifierRoutines(phrases, ctx);

    // 1 erreur: 1 bloc mal fermé
    expect(ctx.erreurs).toHaveSize(1);
    // 1 routine (action)
    expect(ctx.routines).toHaveSize(2);
    // action prendre ceci
    expect(ctx.getRoutineLigne(1)).toBeDefined();
    expect(ctx.getRoutineLigne(2)).toBeDefined();
    expect(ctx.routines[0]).toBe(ctx.getRoutineLigne(1));
    expect(ctx.routines[0].type).toBe(ERoutine.action);
    expect(ctx.routines[0].debut).toBe(1);
    expect(ctx.routines[0].fin).toBe(2); // fermé auto à l’ouverture du suivant
    expect(ctx.routines[0].ouvert).toBeFalse();
    expect(ctx.routines[0].correctementFini).toBeFalse(); // pas fermé par un fin bloc
    // action sauter
    expect(ctx.getRoutineLigne(3)).toBeDefined();
    expect(ctx.getRoutineLigne(4)).toBeDefined();
    expect(ctx.getRoutineLigne(5)).toBeDefined();
    expect(ctx.routines[1]).toBe(ctx.getRoutineLigne(3));
    expect(ctx.routines[1].type).toBe(ERoutine.action);
    expect(ctx.routines[1].debut).toBe(3);
    expect(ctx.routines[1].fin).toBe(5);
    expect(ctx.routines[1].ouvert).toBeFalse();
    expect(ctx.routines[1].correctementFini).toBeTrue(); // fermé avec fin action
    // L’arbre est un objet.
    expect(ctx.getRoutineLigne(6)).toBeUndefined();
  });

});