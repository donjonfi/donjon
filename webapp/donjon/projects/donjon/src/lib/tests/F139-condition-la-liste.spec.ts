// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F139] CONDITION SUR « LA LISTE X » (issue #268)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « si la liste indices contient la carte » teste la liste « indices »,
// comme « si les indices contiennent la carte ».

import { TestUtils } from "../utils/test-utils";

function tester(condition: string, ajouter: boolean): { sortie: string, erreurs: string[] } {
  const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.
La carte est un objet dans la salle.
Les indices sont une liste.

action remplir:
  ajouter la carte à la liste indices.
fin action

action tester:
  si ${condition}:
    dire "OUI".
  sinon
    dire "NON".
  fin si
fin action

Le joueur est dans la salle.
`);
  if (ajouter) {
    ctx.com.executerCommande('remplir', false);
  }
  const sortie = ctx.com.executerCommande('tester', false).sortie;
  return { sortie, erreurs: ctx.jeu.tamponErreurs };
}

describe('[F139] Condition sur « la liste X »', () => {

  it('[F139-T001] « si la liste indices contient la carte »', () => {
    expect(tester('la liste indices contient la carte', false)).toEqual({ sortie: 'NON', erreurs: [] });
    expect(tester('la liste indices contient la carte', true)).toEqual({ sortie: 'OUI', erreurs: [] });
  });

  it('[F139-T002] « si la liste des indices contient la carte »', () => {
    expect(tester('la liste des indices contient la carte', false)).toEqual({ sortie: 'NON', erreurs: [] });
    expect(tester('la liste des indices contient la carte', true)).toEqual({ sortie: 'OUI', erreurs: [] });
  });

  it('[F139-T003] « si la liste des indices ne contient pas la carte »', () => {
    expect(tester('la liste des indices ne contient pas la carte', false)).toEqual({ sortie: 'OUI', erreurs: [] });
    expect(tester('la liste des indices ne contient pas la carte', true)).toEqual({ sortie: 'NON', erreurs: [] });
  });

  it('[F139-T004] non-régression : « si les indices contiennent la carte »', () => {
    expect(tester('les indices contiennent la carte', false)).toEqual({ sortie: 'NON', erreurs: [] });
    expect(tester('les indices contiennent la carte', true)).toEqual({ sortie: 'OUI', erreurs: [] });
  });

  it('[F139-T005] balise conditionnelle « [si la liste indices contient la carte] »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.
La carte est un objet dans la salle.
Les indices sont une liste.

action remplir:
  ajouter la carte à la liste indices.
fin action

action tester:
  dire "[si la liste indices contient la carte]OUI[sinon]NON[fin si]".
fin action

Le joueur est dans la salle.
`);
    expect(ctx.com.executerCommande('tester', false).sortie).toContain('NON');
    ctx.com.executerCommande('remplir', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toContain('OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
