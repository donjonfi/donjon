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
//    [1/2] EXPRESSIONS RÉGULIÈRES — préfixe « redéfinir »
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('redéfinir action: expressions régulières', () => {

  it('[F061-T001] xDebutRoutine accepte « action sauter » sans préfixe', () => {
    const result = ExprReg.xDebutRoutine.exec('action sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T002] xDebutRoutine accepte « redéfinir action sauter »', () => {
    const result = ExprReg.xDebutRoutine.exec('redéfinir action sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T003] xDebutRoutine accepte « redefinir action » (sans accent)', () => {
    const result = ExprReg.xDebutRoutine.exec('redefinir action sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T004] xDebutRoutine refuse « redéfinir règle » (préfixe limité aux actions)', () => {
    const result = ExprReg.xDebutRoutine.exec('redéfinir règle X');
    expect(result).toBeFalsy();
  });

  it('[F061-T005] xRedefinirAction détecte le préfixe', () => {
    expect(ExprReg.xRedefinirAction.exec('redéfinir action sauter')).toBeTruthy();
    expect(ExprReg.xRedefinirAction.exec('redefinir action sauter')).toBeTruthy();
    expect(ExprReg.xRedefinirAction.exec('action sauter')).toBeFalsy();
    expect(ExprReg.xRedefinirAction.exec('redéfinir règle X')).toBeFalsy();
  });

  it('[F061-T006] xDebutRoutine accepte l’article « redéfinir l’action » (U+2019)', () => {
    const result = ExprReg.xDebutRoutine.exec('redéfinir l’action sauter');
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T007] xDebutRoutine accepte l’article « redéfinir l\'action » (U+0027)', () => {
    const result = ExprReg.xDebutRoutine.exec("redéfinir l'action sauter");
    expect(result).toBeTruthy();
    expect(result![1].toLowerCase()).toEqual('action');
  });

  it('[F061-T008] xRedefinirAction détecte le préfixe avec article (les deux apostrophes)', () => {
    expect(ExprReg.xRedefinirAction.exec('redéfinir l’action sauter')).toBeTruthy();
    expect(ExprReg.xRedefinirAction.exec("redéfinir l'action sauter")).toBeTruthy();
    expect(ExprReg.xRedefinirAction.exec('redefinir l’action sauter')).toBeTruthy();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] COMPORTEMENT À LA GÉNÉRATION ET À L’EXÉCUTION
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('redéfinir action: comportement', () => {

  it('[F061-T106] « redéfinir l’action sauter » (avec article) fonctionne identiquement', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Sortie par défaut.".
      fin action
      redéfinir l’action sauter:
        phase épilogue:
          dire "Sortie personnalisée avec article.".
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    const sortie = ctx.com.executerCommande("sauter", false);
    expect(sortie.sortie).toContain('Sortie personnalisée avec article.');
    expect(sortie.sortie).not.toContain('Sortie par défaut.');
  });

  it('[F061-T101] redéfinir action sauter remplace la sortie par défaut', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Sortie par défaut.".
      fin action
      redéfinir action sauter:
        phase épilogue:
          dire "Sortie personnalisée.".
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    const sortie = ctx.com.executerCommande("sauter", false);

    expect(sortie.sortie).toContain('Sortie personnalisée.');
    expect(sortie.sortie).not.toContain('Sortie par défaut.');
  });

  it('[F061-T102] redéfinir respecte la signature avec ceci (sauter sur ceci)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter sur ceci:
        phase épilogue:
          dire "Sortie par défaut.".
      fin action
      redéfinir action sauter sur ceci:
        phase épilogue:
          dire "Sortie personnalisée.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);

    const sauterSurCeci = actionsMatchant(jeu, 'sauter', true, false);
    expect(sauterSurCeci.length).toBe(1);
    expect(sauterSurCeci[0].prepositionCeci).toBe('sur');
    expect(sauterSurCeci[0].redefinit).toBeTrue();
    // la version redéfinie a remplacé l’original — son épilogue contient « Sortie personnalisée. »
    const corpsEpilogue = JSON.stringify(sauterSurCeci[0].phaseEpilogue);
    expect(corpsEpilogue).toContain('Sortie personnalisée.');
    expect(corpsEpilogue).not.toContain('Sortie par défaut.');
  });

  it('[F061-T103] redéfinir n’affecte pas une signature différente (sauter vs sauter sur ceci)', function () {
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
      redéfinir action sauter:
        phase épilogue:
          dire "Saut simple personnalisé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);

    const sauterSimple = actionsMatchant(jeu, 'sauter', false, false);
    expect(sauterSimple.length).toBe(1);
    expect(sauterSimple[0].redefinit).toBeTrue();
    expect(JSON.stringify(sauterSimple[0].phaseEpilogue)).toContain('Saut simple personnalisé.');

    const sauterSurCeci = actionsMatchant(jeu, 'sauter', true, false);
    expect(sauterSurCeci.length).toBe(1);
    expect(sauterSurCeci[0].redefinit).toBeFalse();
    expect(JSON.stringify(sauterSurCeci[0].phaseEpilogue)).toContain('Saut sur ceci par défaut.');
  });

  it('[F061-T105] redéfinir cible la bonne variante quand plusieurs actions partagent l’infinitif (ex: examiner ceci direction vs objet)', function () {
    // Reproduit le cas réel d’actions.djn : plusieurs « action examiner ceci » sont distinguées
    // par cibleCeci.nom (direction, lieu, objet, spécial). La redéfinition doit cibler celle
    // dont le type ceci correspond, sans toucher aux autres.
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
      redéfinir action examiner ceci:
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

    // la variante « direction » est restée intacte
    expect(variantesParCible['direction']).toBeTruthy();
    expect(variantesParCible['direction'].redefinit).toBeFalse();
    expect(JSON.stringify(variantesParCible['direction'].phaseEpilogue)).toContain('Examiner direction par défaut.');

    // la variante « objet » a été redéfinie
    expect(variantesParCible['objet']).toBeTruthy();
    expect(variantesParCible['objet'].redefinit).toBeTrue();
    expect(JSON.stringify(variantesParCible['objet'].phaseEpilogue)).toContain('Examiner objet personnalisé.');
    expect(JSON.stringify(variantesParCible['objet'].phaseEpilogue)).not.toContain('Examiner objet par défaut.');
  });

  it('[F061-T104] redéfinir remplace intégralement les 3 phases (prérequis, exécution, épilogue)', function () {
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
      redéfinir action sauter:
        phase prérequis:
          dire "Prérequis personnalisé.".
        phase exécution:
          dire "Exécution personnalisée.".
        phase épilogue:
          dire "Épilogue personnalisé.".
      fin action
    `;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    // --- vérifier le modèle compilé : 1 seule action, redéfinit=true, les 3 phases remplacées ---
    const actionsSauter = actionsMatchant(ctx.jeu, 'sauter', false, false);
    expect(actionsSauter.length).toBe(1);
    const action = actionsSauter[0];
    expect(action.redefinit).toBeTrue();
    expect(action.phasePrerequis.length).toBeGreaterThan(0);
    expect(action.phaseExecution.length).toBeGreaterThan(0);
    expect(action.phaseEpilogue.length).toBeGreaterThan(0);
    expect(JSON.stringify(action.phasePrerequis)).toContain('Prérequis personnalisé.');
    expect(JSON.stringify(action.phaseExecution)).toContain('Exécution personnalisée.');
    expect(JSON.stringify(action.phaseEpilogue)).toContain('Épilogue personnalisé.');
    expect(JSON.stringify(action.phasePrerequis)).not.toContain('Prérequis par défaut.');
    expect(JSON.stringify(action.phaseExecution)).not.toContain('Exécution par défaut.');
    expect(JSON.stringify(action.phaseEpilogue)).not.toContain('Épilogue par défaut.');

    // --- vérifier l’exécution : les 3 phases personnalisées sont jouées dans l’ordre, aucune phase par défaut ---
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
