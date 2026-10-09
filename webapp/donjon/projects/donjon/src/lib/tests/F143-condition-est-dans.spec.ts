// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F143] CONDITION « X EST DANS Y » (issue #272)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « si X est dans/sur/sous Y » équivaut à « si X se trouve dans/sur/sous Y ».
// « si X est <mot> » dont le complément n’est ni un état, ni un élément, ni une position : conseil.

import { TestUtils } from "../utils/test-utils";

function tester(condition: string): { sortie: string, erreurs: string[], conseils: string[] } {
  const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.
La cave est un lieu en bas de la salle.
La pomme est un objet dans la salle.
La boîte est un contenant ouvert dans la salle.
La clé est un objet dans la boîte.
La table est un support dans la salle.
Le livre est un objet sur la table.

action tester:
  si ${condition}:
    dire "OUI".
  sinon
    dire "NON".
  fin si
fin action

Le joueur est dans la salle.
`);
  const sortie = ctx.com.executerCommande('tester', false).sortie;
  return { sortie, erreurs: ctx.jeu.tamponErreurs, conseils: ctx.jeu.tamponConseils };
}

describe('[F143] Condition « X est dans Y »', () => {

  it('[F143-T001] objet dans un lieu', () => {
    expect(tester('la pomme est dans la salle')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
    expect(tester('la pomme est dans la cave')).toEqual({ sortie: 'NON', erreurs: [], conseils: [] });
  });

  it('[F143-T002] objet dans un contenant, sur un support', () => {
    expect(tester('la clé est dans la boîte')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
    expect(tester('le livre est sur la table')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
  });

  it('[F143-T003] le joueur est dans le lieu', () => {
    expect(tester('le joueur est dans la salle')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
    expect(tester('le joueur est dans la cave')).toEqual({ sortie: 'NON', erreurs: [], conseils: [] });
  });

  it('[F143-T004] négation', () => {
    expect(tester('la pomme n’est pas dans la salle')).toEqual({ sortie: 'NON', erreurs: [], conseils: [] });
    expect(tester('la pomme n’est pas dans la cave')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
  });

  it('[F143-T005] balise conditionnelle [si la pomme est dans la salle]', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.
La pomme est un objet dans la salle.

action tester:
  dire "[si la pomme est dans la salle]OUI[sinon]NON[fin si]".
fin action

Le joueur est dans la salle.
`);
    expect(ctx.com.executerCommande('tester', false).sortie).toContain('OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F143-T006] pas de conseil : état connu, élément existant', () => {
    expect(tester('la boîte est ouverte')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
    expect(tester('la pomme est la pomme')).toEqual({ sortie: 'OUI', erreurs: [], conseils: [] });
    expect(tester('la pomme est la clé')).toEqual({ sortie: 'NON', erreurs: [], conseils: [] });
  });

  it('[F143-T007] conseil : état inconnu', () => {
    expect(tester('la pomme est rouge')).toEqual({ sortie: 'NON', erreurs: [], conseils: ['État introuvable : « rouge ».'] });
  });

  it('[F143-T008] conseil : « est le/la X » dont X n’est ni un état ni un élément', () => {
    const r = tester('la pomme est la poire');
    expect(r.sortie).toBe('NON');
    expect(r.conseils.length).withContext(JSON.stringify(r.conseils)).toBe(1);
    expect(r.conseils[0]).toContain('« la poire »');
  });

});
