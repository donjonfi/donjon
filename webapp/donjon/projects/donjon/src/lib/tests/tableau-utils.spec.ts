// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F088] TABLEAU-UTILS — énumération « a, b et c. » (fonction PURE)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// tableau-utils.ts était ABSENT du rapport de couverture (jamais exercé). listerTableau() pose
// virgule / « et » / point selon la position — verrouillé ici.

import { TableauUtils } from "../utils/commun/tableau-utils";

describe('[F088] TableauUtils.listerTableau', () => {

  it('[F088-T001] tableau non défini → « (non défini) »', () => {
    expect(TableauUtils.listerTableau(null as any)).toBe('(non défini)');
    expect(TableauUtils.listerTableau(undefined as any)).toBe('(non défini)');
  });

  it('[F088-T002] tableau vide → « (vide) »', () => {
    expect(TableauUtils.listerTableau([])).toBe('(vide)');
  });

  it('[F088-T003] un seul élément → « x. »', () => {
    expect(TableauUtils.listerTableau(['pomme'])).toBe('pomme.');
  });

  it('[F088-T004] deux éléments → « a et b. »', () => {
    expect(TableauUtils.listerTableau(['pomme', 'poire'])).toBe('pomme et poire.');
  });

  it('[F088-T005] trois éléments → « a, b et c. »', () => {
    expect(TableauUtils.listerTableau(['pomme', 'poire', 'prune'])).toBe('pomme, poire et prune.');
  });

  it('[F088-T006] quatre éléments → virgules puis « et » avant le dernier', () => {
    expect(TableauUtils.listerTableau(['a', 'b', 'c', 'd'])).toBe('a, b, c et d.');
  });

  it('[F088-T007] éléments non-chaîne (nombres) → concaténés via String()', () => {
    expect(TableauUtils.listerTableau([1, 2, 3])).toBe('1, 2 et 3.');
  });
});
