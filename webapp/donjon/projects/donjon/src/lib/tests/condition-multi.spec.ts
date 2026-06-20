// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F092] CONDITION-MULTI — toString (représentation lisible d'une condition composée)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// ⚠️ Guard du bug B2 : la boucle de toString incrémentait `index` deux fois (en-tête + corps) et
// utilisait le garde « length - 2 » → pour 3 sous-conditions, l'élément du milieu était SAUTÉ
// (« (aET c) »). Corrigé : un seul incrément, garde « length - 1 », séparateur espacé.

import { ConditionMulti } from "../models/compilateur/condition-multi";

/** Feuille : une ConditionMulti dont la condition simple rend la chaîne `s`. */
function feuille(s: string): ConditionMulti {
  const c = new ConditionMulti();
  c.condition = { toString: () => s } as any;
  return c;
}
/** Nœud : une ConditionMulti reliant des enfants par `lien` (et|ou). */
function noeud(lien: string, ...enfants: ConditionMulti[]): ConditionMulti {
  const c = new ConditionMulti();
  c.sousConditions = enfants;
  c.typeLienSousConditions = lien as any;
  return c;
}

describe('[F092] ConditionMulti.toString', () => {

  it('[F092-T001] feuille → délègue à la condition simple', () => {
    expect(feuille('a').toString()).toBe('a');
  });

  it('[F092-T002] deux sous-conditions reliées par ET', () => {
    expect(noeud('et', feuille('a'), feuille('b')).toString()).toBe('(a ET b)');
  });

  it('[F092-T003] trois sous-conditions — aucune omise (BUG B2 corrigé)', () => {
    // avant le fix, le double incrément sautait l'élément du milieu → « (aET c) »
    expect(noeud('et', feuille('a'), feuille('b'), feuille('c')).toString()).toBe('(a ET b ET c)');
  });

  it('[F092-T004] quatre sous-conditions, lien OU', () => {
    expect(noeud('ou', feuille('a'), feuille('b'), feuille('c'), feuille('d')).toString())
      .toBe('(a OU b OU c OU d)');
  });

  it('[F092-T005] une seule sous-condition', () => {
    expect(noeud('et', feuille('seul')).toString()).toBe('(seul)');
  });
});
