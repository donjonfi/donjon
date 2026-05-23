import { Action } from "../models/compilateur/action";
import { TestUtils } from "../utils/test-utils";

function actionsMatchant(jeu: any, infinitif: string, ceci: boolean, cela: boolean): Action[] {
  return jeu.actions.filter((a: Action) =>
    a.infinitifSansAccent === infinitif && a.ceci === ceci && a.cela === cela
  );
}

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Doublons d’actions + cas limites de `règle remplacer`
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('règle remplacer action: détection de doublons et cas limites', () => {

  it('[F061-T201] deux blocs `action X:` avec même signature → erreur invitant à utiliser `règle remplacer`', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Premier.".
      fin action
      action sauter:
        phase épilogue:
          dire "Deuxième.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreurs = jeu.tamponErreurs.join('\n');
    expect(erreurs).toContain('sauter');
    expect(erreurs).toMatch(/définie plusieurs fois|plusieurs fois/i);
    expect(erreurs).toContain('règle remplacer');
  });

  it('[F061-T202] deux blocs `règle remplacer X:` sur la même action → erreur', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action sauter:
        phase épilogue:
          dire "Original.".
      fin action
      règle remplacer sauter:
        phase épilogue:
          dire "Remplacement 1.".
      fin action
      règle remplacer sauter:
        phase épilogue:
          dire "Remplacement 2.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreurs = jeu.tamponErreurs.join('\n');
    expect(erreurs).toMatch(/règle remplacer/i);
    expect(erreurs).toMatch(/une seule règle de remplacement|deux/i);
  });

  it('[F061-T203] `règle remplacer X:` sans action `X` correspondante → conseil non bloquant', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      règle remplacer sauter:
        phase épilogue:
          dire "Saut créé via règle remplacer.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    expect(jeu.tamponErreurs.length).toBe(0);
    const conseils = jeu.tamponConseils.join('\n');
    expect(conseils).toContain('règle remplacer');
    expect(conseils).toContain('sauter');
    expect(conseils).toMatch(/aucune action existante|une nouvelle action est créée/i);
    // L’action est tout de même créée
    const actionsSauter = actionsMatchant(jeu, 'sauter', false, false);
    expect(actionsSauter.length).toBe(1);
    expect(actionsSauter[0].remplace).toBeTrue();
  });

  it('[F061-T204] deux `action examiner ceci:` avec cibleCeci.nom différents → pas un doublon (signatures distinctes)', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action examiner ceci:
        définitions:
          ceci est une direction.
        phase épilogue:
          dire "Direction.".
      fin action
      action examiner ceci:
        définitions:
          ceci est un objet.
        phase épilogue:
          dire "Objet.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreursDoublon = jeu.tamponErreurs.filter((e: string) => e.includes('définie plusieurs fois'));
    expect(erreursDoublon.length).toBe(0);
    const examiner = actionsMatchant(jeu, 'examiner', true, false);
    expect(examiner.length).toBe(2);
  });

  it('[F061-T206] doublon sur deux compléments typés (ouvrir ceci avec cela, mêmes types) → erreur', function () {
    const scenario = `
      Une clé est un objet.
      Le salon est un lieu.
      La clé dorée est une clé ici.
      Le coffre est un objet ouvrable ici.
      Le joueur se trouve dans le salon.
      action ouvrir ceci avec cela:
        définitions:
          ceci est un objet.
          cela est une clé.
        phase épilogue:
          dire "Premier.".
      fin action
      action ouvrir ceci avec cela:
        définitions:
          ceci est un objet.
          cela est une clé.
        phase épilogue:
          dire "Deuxième.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreurs = jeu.tamponErreurs.join('\n');
    expect(erreurs).toContain('ouvrir');
    expect(erreurs).toMatch(/définie plusieurs fois|plusieurs fois/i);
    expect(erreurs).toContain('règle remplacer');
  });

  it('[F061-T207] deux `montrer ceci à cela` avec cibleCela différents → pas un doublon (vivant vs lieu)', function () {
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
          dire "À vivant.".
      fin action
      action montrer ceci à cela:
        définitions:
          ceci est un objet.
          cela est un lieu.
        phase épilogue:
          dire "À lieu.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreursDoublon = jeu.tamponErreurs.filter((e: string) => e.includes('définie plusieurs fois'));
    expect(erreursDoublon.length).toBe(0);
    const montrer = actionsMatchant(jeu, 'montrer', true, true);
    expect(montrer.length).toBe(2);
  });

  it('[F061-T205] verbe est `remplacer` lui-même : `règle remplacer remplacer ceci` parse sans ambiguïté', function () {
    const scenario = `
      le salon est un lieu.
      le joueur se trouve dans le salon.
      action remplacer ceci:
        phase épilogue:
          dire "Remplacement par défaut.".
      fin action
      règle remplacer remplacer ceci:
        phase épilogue:
          dire "Remplacement personnalisé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    const erreurs = jeu.tamponErreurs.join('\n');
    expect(erreurs).not.toContain('définie plusieurs fois');
    const remplacerActions = actionsMatchant(jeu, 'remplacer', true, false);
    expect(remplacerActions.length).toBe(1);
    expect(remplacerActions[0].remplace).toBeTrue();
    expect(JSON.stringify(remplacerActions[0].phaseEpilogue)).toContain('Remplacement personnalisé.');
  });

});
