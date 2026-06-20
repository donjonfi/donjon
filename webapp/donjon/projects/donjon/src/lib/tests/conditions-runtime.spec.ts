// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F093] CONDITIONS RUNTIME (P0) — évaluation de `si …` durant le jeu (conditions-utils)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// conditions-utils était le plus gros trou de branches du moteur (br58, 211 branches non couvertes)
// — massivement traversé par l'intégration mais sans assertion ciblée. On exerce ici les grandes
// familles d'opérateurs (présence, compteur =/>/≠, état, combinaisons et/ou, négation) via des
// scénarios DSL, en assertant la BRANCHE prise (état « marqué » posé seulement si la condition est vraie).

import { TestUtils } from "../utils/test-utils";

/** Joue l'action « tester » dont le corps pose l'état « marqué » si la condition est vraie. */
function marqueApresTester(corpsSi: string, declarations: string = ''): boolean {
  const scenario = `
le salon est un lieu.
la cuisine est un lieu.
le joueur se trouve dans le salon.
${declarations}
action tester:
  ${corpsSi}
    changer le joueur est marqué.
  fin si
fin action`;
  const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
  ctx.com.executerCommande("tester", false);
  return ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju);
}

describe('[F093] conditions runtime — présence / position', () => {
  it('[F093-T001] « se trouve dans » vrai → branche prise', () => {
    expect(marqueApresTester('si le joueur se trouve dans le salon:')).toBeTrue();
  });
  it('[F093-T002] « se trouve dans » faux → branche ignorée', () => {
    expect(marqueApresTester('si le joueur se trouve dans la cuisine:')).toBeFalse();
  });
});

describe('[F093] conditions runtime — compteur (= / > / ≠)', () => {
  const score5 = 'le score est un compteur initialisé à 5.';

  it('[F093-T010] « vaut » égalité vraie', () => {
    expect(marqueApresTester('si le score vaut 5:', score5)).toBeTrue();
  });
  it('[F093-T011] « vaut » égalité fausse', () => {
    expect(marqueApresTester('si le score vaut 9:', score5)).toBeFalse();
  });
  it('[F093-T012] « dépasse » supériorité vraie', () => {
    expect(marqueApresTester('si le score dépasse 3:', score5)).toBeTrue();
  });
  it('[F093-T013] « dépasse » supériorité fausse', () => {
    expect(marqueApresTester('si le score dépasse 10:', score5)).toBeFalse();
  });
  it('[F093-T014] « ne vaut pas » (négation) vraie', () => {
    expect(marqueApresTester('si le score ne vaut pas 9:', score5)).toBeTrue();
  });
});

describe('[F093] conditions runtime — état d\'un élément', () => {
  it('[F093-T020] état posé puis testé (vrai)', () => {
    // l'action pose d'abord l'état « fatigué » sur le joueur, puis le teste
    const corps = 'changer le joueur est fatigué.\n  si le joueur est fatigué:';
    expect(marqueApresTester(corps)).toBeTrue();
  });
  it('[F093-T021] état absent → faux', () => {
    expect(marqueApresTester('si le joueur est fatigué:')).toBeFalse();
  });
});

describe('[F093] conditions runtime — combinaisons et / ou', () => {
  const score5 = 'le score est un compteur initialisé à 5.';

  it('[F093-T030] ET : les deux vraies → vrai', () => {
    expect(marqueApresTester('si le score vaut 5 et si le joueur se trouve dans le salon:', score5)).toBeTrue();
  });
  it('[F093-T031] ET : une fausse → faux', () => {
    expect(marqueApresTester('si le score vaut 5 et si le joueur se trouve dans la cuisine:', score5)).toBeFalse();
  });
  it('[F093-T032] OU : une seule vraie → vrai', () => {
    expect(marqueApresTester('si le score vaut 99 ou si le joueur se trouve dans le salon:', score5)).toBeTrue();
  });
  it('[F093-T033] OU : les deux fausses → faux', () => {
    expect(marqueApresTester('si le score vaut 99 ou si le joueur se trouve dans la cuisine:', score5)).toBeFalse();
  });
});
