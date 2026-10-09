// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F125] CONDITION « SI CECI EST CELA » (MÊME OBJET DANS LES DEUX COMPLÉMENTS) (issue #258)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Question d’un auteur : dans les prérequis d’une action à deux compléments, peut-on vérifier
// que le joueur a mis le même objet dans les deux (ex. « mélanger la fiole avec la fiole ») ?

import { TestUtils } from "../utils/test-utils";
import { ContextePartie } from "../models/jouer/contexte-partie";

function scenario(condition: string): string {
  return `
L’atelier est un lieu.
La fiole rouge est un objet dans l’atelier.
La fiole bleue est un objet dans l’atelier.
La fiole verte est un objet dans l’atelier.

action mélanger ceci avec cela:
  définitions:
    ceci est un objet visible.
    cela est un objet visible.
  phase prérequis:
    ${condition}
      refuser "Pas avec elle-même.".
    fin si
  phase épilogue:
    dire "Mélange de [intitulé ceci] et [intitulé cela].".
fin action

Le joueur est dans l’atelier.`;
}

function jouer(ctx: ContextePartie, commande: string): string {
  const sortie = ctx.com.executerCommande(commande, false).sortie;
  expect(ctx.jeu.tamponErreurs).toEqual([]);
  return sortie;
}

describe('[F125] Condition « si ceci est cela » dans une action', () => {

  it('[F125-T001] « si ceci est cela » refuse le même objet dans les deux compléments', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('si ceci est cela:'), false);
    expect(jouer(ctx, 'mélanger la fiole rouge avec la fiole rouge')).toContain('Pas avec elle-même.');
  });

  it('[F125-T002] « si ceci est cela » laisse passer deux objets différents', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('si ceci est cela:'), false);
    const sortie = jouer(ctx, 'mélanger la fiole rouge avec la fiole bleue');
    expect(sortie).not.toContain('Pas avec elle-même.');
    expect(sortie).toContain('Mélange de la fiole rouge et la fiole bleue.');
  });

  it('[F125-T003] « si ceci n’est pas cela » est vrai pour deux objets différents', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('si ceci n’est pas cela:'), false);
    expect(jouer(ctx, 'mélanger la fiole verte avec la fiole bleue')).toContain('Pas avec elle-même.');
  });

  it('[F125-T004] « si ceci n’est pas cela » est faux pour le même objet', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('si ceci n’est pas cela:'), false);
    const sortie = jouer(ctx, 'mélanger la fiole verte avec la fiole verte');
    expect(sortie).not.toContain('Pas avec elle-même.');
    expect(sortie).toContain('Mélange de la fiole verte et la fiole verte.');
  });

  /** Exemple wiki ressources/scenarios/exemples/wiki/actions/melanger_potions.djn (page reference/routines/action/exemples). */
  const SCN_WIKI_POTIONS = `
mélangée est un état.

L’atelier d’alchimie est un lieu.
L’établi de l’alchimiste est un support dans l’atelier d’alchimie.
La fiole rouge est une potion sur l’établi de l’alchimiste.
La fiole bleue est une potion sur l’établi de l’alchimiste.
La fiole verte est une potion sur l’établi de l’alchimiste.
Le chiffon est un objet sur l’établi de l’alchimiste.

action mélanger ceci avec cela:

  définitions:
    ceci est un objet visible et accessible.
    cela est un objet visible et accessible.

  phase prérequis:
    si ceci n’est pas une potion:
      refuser "[Intitulé ceci] n’est pas une potion.".
    fin si
    si cela n’est pas une potion:
      refuser "[Intitulé cela] n’est pas une potion.".
    fin si
    si ceci est cela:
      refuser "Vous ne pouvez pas mélanger une potion avec elle-même.".
    fin si
    si ceci est mélangée:
      refuser "[Intitulé ceci] a déjà servi à un mélange.".
    fin si
    si cela est mélangée:
      refuser "[Intitulé cela] a déjà servi à un mélange.".
    fin si

  phase exécution:
    changer ceci est mélangée.
    changer cela est mélangée.

  phase épilogue:
    dire "Vous versez [intitulé ceci] dans [intitulé cela].".

fin action

Le joueur est dans l’atelier d’alchimie.`;

  it('[F125-T005] exemple wiki « mélanger les potions » : refus de la même potion', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCN_WIKI_POTIONS, false);
    expect(jouer(ctx, 'mélanger la fiole verte avec la fiole verte')).toContain('Vous ne pouvez pas mélanger une potion avec elle-même.');
    // la potion n’a pas été consommée par le refus
    expect(jouer(ctx, 'mélanger la fiole verte avec la fiole bleue')).toContain('Vous versez la fiole verte dans la fiole bleue.');
    expect(jouer(ctx, 'mélanger la fiole rouge avec la fiole bleue')).toContain('a déjà servi à un mélange.');
  });

});
