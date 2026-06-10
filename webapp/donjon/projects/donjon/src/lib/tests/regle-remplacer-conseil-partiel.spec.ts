import { TestUtils } from "../utils/test-utils";

// [F076] Conseils à l'analyse pour les « règle remplacer » partielles : la phase
// « définitions: » fait partie de la signature de l'action. Si elle diffère, l'action de
// base n'est pas remplacée et reste active — l'auteur est prévenu via tamponConseils
// (visible uniquement dans l'éditeur), pas via une erreur.

describe('règle remplacer : conseils si remplacement partiel (F076)', () => {

  it('[F076-T001] remplacer sans « définitions » alors que la base en a → conseils (aucune correspondance + forme restante)', () => {
    const scenario = `
      le salon est un lieu.
      action chanter ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Version de base.".
      fin action
      règle remplacer chanter ceci:
        phase exécution:
          dire "Version remplacée.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    expect(jeu.tamponErreurs.join('\n')).withContext(jeu.tamponErreurs.join('\n')).toBe('');
    const conseils = jeu.tamponConseils.join('\n');
    expect(conseils).withContext(conseils).toContain('ne correspond à aucune action existante');
    expect(conseils).withContext(conseils).toContain('n’est pas remplacée et reste active');
    expect(conseils).withContext(conseils).toContain('définitions');
  });

  it('[F076-T002] remplacement complet conforme → aucun conseil', () => {
    const scenario = `
      le salon est un lieu.
      action chanter ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Version de base.".
      fin action
      règle remplacer chanter ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Version remplacée.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    expect(jeu.tamponErreurs.join('\n')).withContext(jeu.tamponErreurs.join('\n')).toBe('');
    expect(jeu.tamponConseils.join('\n')).withContext(jeu.tamponConseils.join('\n')).toBe('');
  });

  it('[F076-T003] remplacer une forme sur deux → conseil mentionnant la forme restante', () => {
    const scenario = `
      le salon est un lieu.
      action chanter:
        phase exécution:
          dire "Chant sans complément.".
      fin action
      action chanter ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Chant avec complément.".
      fin action
      règle remplacer chanter:
        phase exécution:
          dire "Chant remplacé.".
      fin action
    `;
    const jeu = TestUtils.genererLeJeu(scenario);
    expect(jeu.tamponErreurs.join('\n')).withContext(jeu.tamponErreurs.join('\n')).toBe('');
    const conseils = jeu.tamponConseils.join('\n');
    expect(conseils).withContext(conseils).toContain('chanter ceci');
    expect(conseils).withContext(conseils).toContain('n’est pas remplacée et reste active');
    // la forme remplacée, elle, ne fait l’objet d’aucun conseil « aucune action existante »
    expect(conseils).withContext(conseils).not.toContain('ne correspond à aucune action existante');
  });

});
