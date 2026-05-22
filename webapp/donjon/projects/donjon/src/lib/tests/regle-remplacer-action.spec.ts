import { ExprReg } from "../utils/compilation/expr-reg";
import { Action } from "../models/compilateur/action";
import { TestUtils } from "../utils/test-utils";

function actionsMatchant(jeu: any, infinitif: string, ceci: boolean, cela: boolean): Action[] {
  return jeu.actions.filter((a: Action) =>
    a.infinitifSansAccent === infinitif && a.ceci === ceci && a.cela === cela
  );
}

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES — préfixe « règle remplacer »
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('règle remplacer action: expressions régulières', () => {

  it('[F061-T001] xDebutRoutine accepte « action sauter » sans préfixe', () => {
    const result = ExprReg.xDebutRoutine.exec('action sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T002] xDebutRoutine ne consomme plus l’ancien préfixe « redéfinir action »', () => {
    // L’ancienne syntaxe n’est plus supportée : xDebutRoutine ne doit pas matcher en tête.
    const result = ExprReg.xDebutRoutine.exec('redéfinir action sauter');
    expect(result).toBeFalsy();
  });

  it('[F061-T003] xRegleRemplacerAction détecte le préfixe « règle remplacer »', () => {
    expect(ExprReg.xRegleRemplacerAction.exec('règle remplacer sauter')).toBeTruthy();
    expect(ExprReg.xRegleRemplacerAction.exec('regle remplacer sauter')).toBeTruthy(); // sans accent
    expect(ExprReg.xRegleRemplacerAction.exec('action sauter')).toBeFalsy();
    expect(ExprReg.xRegleRemplacerAction.exec('règle avant sauter')).toBeFalsy();
  });

  it('[F061-T004] xDebutRoutine reconnaît « règle » seul (préfixe avant/après non lié à remplacer)', () => {
    // « règle avant X » est traité comme une règle normale par le dispatcher.
    const result = ExprReg.xDebutRoutine.exec('règle avant sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toMatch(/^règle$/i);
  });

  it('[F061-T005] xRegleRemplacerAction exige un verbe après « remplacer »', () => {
    // « règle remplacer » seul (sans verbe) ne doit pas matcher.
    expect(ExprReg.xRegleRemplacerAction.exec('règle remplacer')).toBeFalsy();
    expect(ExprReg.xRegleRemplacerAction.exec('règle remplacer ')).toBeFalsy();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] COMPORTEMENT À LA GÉNÉRATION ET À L’EXÉCUTION
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('règle remplacer action: comportement', () => {

  it('[F061-T101] « règle remplacer sauter » remplace la sortie par défaut', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Sortie par défaut.".
      fin action
      règle remplacer sauter:
        phase épilogue:
          dire "Sortie personnalisée.".
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    const sortie = ctx.com.executerCommande("sauter", false);

    expect(sortie.sortie).toContain('Sortie personnalisée.');
    expect(sortie.sortie).not.toContain('Sortie par défaut.');
  });

  it('[F061-T102] « règle remplacer » respecte la signature avec ceci (sauter sur ceci)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter sur ceci:
        phase épilogue:
          dire "Sortie par défaut.".
      fin action
      règle remplacer sauter sur ceci:
        phase épilogue:
          dire "Sortie personnalisée.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);

    const sauterSurCeci = actionsMatchant(jeu, 'sauter', true, false);
    expect(sauterSurCeci.length).toBe(1);
    expect(sauterSurCeci[0].prepositionCeci).toBe('sur');
    expect(sauterSurCeci[0].remplace).toBeTrue();
    const corpsEpilogue = JSON.stringify(sauterSurCeci[0].phaseEpilogue);
    expect(corpsEpilogue).toContain('Sortie personnalisée.');
    expect(corpsEpilogue).not.toContain('Sortie par défaut.');
  });

  it('[F061-T103] « règle remplacer » n’affecte pas une signature différente (sauter vs sauter sur ceci)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Saut simple par défaut.".
      fin action
      action sauter sur ceci:
        phase épilogue:
          dire "Saut sur ceci par défaut.".
      fin action
      règle remplacer sauter:
        phase épilogue:
          dire "Saut simple personnalisé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);

    const sauterSimple = actionsMatchant(jeu, 'sauter', false, false);
    expect(sauterSimple.length).toBe(1);
    expect(sauterSimple[0].remplace).toBeTrue();
    expect(JSON.stringify(sauterSimple[0].phaseEpilogue)).toContain('Saut simple personnalisé.');

    const sauterSurCeci = actionsMatchant(jeu, 'sauter', true, false);
    expect(sauterSurCeci.length).toBe(1);
    expect(sauterSurCeci[0].remplace).toBeFalse();
    expect(JSON.stringify(sauterSurCeci[0].phaseEpilogue)).toContain('Saut sur ceci par défaut.');
  });

  it('[F061-T105] « règle remplacer » cible la bonne variante quand plusieurs actions partagent l’infinitif (ex: examiner ceci direction vs objet)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action examiner ceci:
        définitions:
          ceci est une direction.
        phase épilogue:
          dire "Examiner direction par défaut.".
      fin action
      action examiner ceci:
        définitions:
          ceci est un objet.
        phase épilogue:
          dire "Examiner objet par défaut.".
      fin action
      règle remplacer examiner ceci:
        définitions:
          ceci est un objet.
        phase épilogue:
          dire "Examiner objet personnalisé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);

    const examinerActions = actionsMatchant(jeu, 'examiner', true, false);
    expect(examinerActions.length).toBe(2);

    const variantesParCible: Record<string, Action> = {};
    examinerActions.forEach(a => { variantesParCible[a.cibleCeci?.nom ?? ''] = a; });

    expect(variantesParCible['direction']).toBeTruthy();
    expect(variantesParCible['direction'].remplace).toBeFalse();
    expect(JSON.stringify(variantesParCible['direction'].phaseEpilogue)).toContain('Examiner direction par défaut.');

    expect(variantesParCible['objet']).toBeTruthy();
    expect(variantesParCible['objet'].remplace).toBeTrue();
    expect(JSON.stringify(variantesParCible['objet'].phaseEpilogue)).toContain('Examiner objet personnalisé.');
    expect(JSON.stringify(variantesParCible['objet'].phaseEpilogue)).not.toContain('Examiner objet par défaut.');
  });

  it('[F061-T106] « règle remplacer » sur une action à deux compléments typés (ouvrir ceci avec cela, cela=clé)', function () {
    const scenario = `
      Une clé est un objet.
      Le salon est un lieu.
      Le coffre est un objet ouvrable ici. Le coffre est fermé.
      La clé dorée est une clé ici.
      Le joueur se trouve dans le salon.
      action ouvrir ceci avec cela:
        définitions:
          ceci est un objet.
          cela est une clé.
        phase épilogue:
          dire "Ouverture par défaut.".
      fin action
      règle remplacer ouvrir ceci avec cela:
        définitions:
          ceci est un objet.
          cela est une clé.
        phase épilogue:
          dire "Ouverture personnalisée.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const ouvrirActions = actionsMatchant(jeu, 'ouvrir', true, true);
    expect(ouvrirActions.length).toBe(1);
    expect(ouvrirActions[0].prepositionCela).toBe('avec');
    expect(ouvrirActions[0].cibleCeci?.nom).toBe('objet');
    expect(ouvrirActions[0].cibleCela?.nom).toBe('clé');
    expect(ouvrirActions[0].remplace).toBeTrue();
    expect(JSON.stringify(ouvrirActions[0].phaseEpilogue)).toContain('Ouverture personnalisée.');
    expect(JSON.stringify(ouvrirActions[0].phaseEpilogue)).not.toContain('Ouverture par défaut.');
  });

  it('[F061-T107] « règle remplacer » sur une action à deux compléments hétérogènes (montrer ceci à cela, ceci=objet + cela=vivant)', function () {
    const scenario = `
      Le salon est un lieu.
      Le joueur se trouve dans le salon.
      La gemme est un objet ici.
      L'elfe est un vivant ici.
      action montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un vivant.
        phase épilogue:
          dire "Présentation par défaut.".
      fin action
      règle remplacer montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un vivant.
        phase épilogue:
          dire "[Intitulé cela] examine [le ceci] avec curiosité.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const montrerActions = actionsMatchant(jeu, 'montrer', true, true);
    expect(montrerActions.length).toBe(1);
    expect(montrerActions[0].prepositionCela).toBe('à');
    expect(montrerActions[0].cibleCeci?.nom).toBe('objet');
    expect(montrerActions[0].cibleCela?.nom).toBe('vivant');
    expect(montrerActions[0].remplace).toBeTrue();
    expect(JSON.stringify(montrerActions[0].phaseEpilogue)).toContain('examine');
    expect(JSON.stringify(montrerActions[0].phaseEpilogue)).not.toContain('Présentation par défaut.');
  });

  it('[F061-T108] « règle remplacer » ne touche pas une variante de cela différente (montrer à vivant vs à lieu)', function () {
    const scenario = `
      Le salon est un lieu.
      Le joueur se trouve dans le salon.
      La gemme est un objet ici.
      L'elfe est un vivant ici.
      action montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un vivant.
        phase épilogue:
          dire "À vivant — défaut.".
      fin action
      action montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un lieu.
        phase épilogue:
          dire "À lieu — défaut.".
      fin action
      règle remplacer montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un vivant.
        phase épilogue:
          dire "À vivant — personnalisé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const montrerActions = actionsMatchant(jeu, 'montrer', true, true);
    expect(montrerActions.length).toBe(2);

    const variantesParCible: Record<string, Action> = {};
    montrerActions.forEach(a => { variantesParCible[a.cibleCela?.nom ?? ''] = a; });

    expect(variantesParCible['vivant']).toBeTruthy();
    expect(variantesParCible['vivant'].remplace).toBeTrue();
    expect(JSON.stringify(variantesParCible['vivant'].phaseEpilogue)).toContain('À vivant — personnalisé.');

    expect(variantesParCible['lieu']).toBeTruthy();
    expect(variantesParCible['lieu'].remplace).toBeFalse();
    expect(JSON.stringify(variantesParCible['lieu'].phaseEpilogue)).toContain('À lieu — défaut.');
  });

  it('[F061-T104] « règle remplacer » remplace intégralement les 3 phases (prérequis, exécution, épilogue)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase prérequis:
          dire "Prérequis par défaut.".
        phase exécution:
          dire "Exécution par défaut.".
        phase épilogue:
          dire "Épilogue par défaut.".
      fin action
      règle remplacer sauter:
        phase prérequis:
          dire "Prérequis personnalisé.".
        phase exécution:
          dire "Exécution personnalisée.".
        phase épilogue:
          dire "Épilogue personnalisé.".
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    const actionsSauter = actionsMatchant(ctx.jeu, 'sauter', false, false);
    expect(actionsSauter.length).toBe(1);
    const action = actionsSauter[0];
    expect(action.remplace).toBeTrue();
    expect(action.phasePrerequis.length).toBeGreaterThan(0);
    expect(action.phaseExecution.length).toBeGreaterThan(0);
    expect(action.phaseEpilogue.length).toBeGreaterThan(0);
    expect(JSON.stringify(action.phasePrerequis)).toContain('Prérequis personnalisé.');
    expect(JSON.stringify(action.phaseExecution)).toContain('Exécution personnalisée.');
    expect(JSON.stringify(action.phaseEpilogue)).toContain('Épilogue personnalisé.');
    expect(JSON.stringify(action.phasePrerequis)).not.toContain('Prérequis par défaut.');
    expect(JSON.stringify(action.phaseExecution)).not.toContain('Exécution par défaut.');
    expect(JSON.stringify(action.phaseEpilogue)).not.toContain('Épilogue par défaut.');

    const sortie = ctx.com.executerCommande("sauter", false);
    const texte = sortie.sortie;
    const iPre = texte.indexOf('Prérequis personnalisé.');
    const iExe = texte.indexOf('Exécution personnalisée.');
    const iEpi = texte.indexOf('Épilogue personnalisé.');
    expect(iPre).toBeGreaterThanOrEqual(0);
    expect(iExe).toBeGreaterThan(iPre);
    expect(iEpi).toBeGreaterThan(iExe);
    expect(texte).not.toContain('Prérequis par défaut.');
    expect(texte).not.toContain('Exécution par défaut.');
    expect(texte).not.toContain('Épilogue par défaut.');
  });

});
