// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F132] BALISE DE PROPRIÉTÉ SANS « DE » : [force le joueur] (issue #262)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Pour une balise sans « de », le moteur insère « de » après le premier mot :
// « [force le joueur] » doit donner « force du joueur » (et non « force de le joueur »).

import { TestUtils } from "../utils/test-utils";

const SCENARIO = `
La cave est un lieu.
Le joueur se trouve dans la cave.
La force du joueur vaut 7.
La pomme est un objet ici.
La couleur de la pomme est "rouge".
L'épée est un objet vu ici.
Le poids de l'épée vaut 5.
Les cailloux sont des objets ici.
Le poids des cailloux vaut 3.

action tester ceci:
  dire "Prix de ceci : [poids ceci].".
fin action

action dire:
  dire "Force A : [force le joueur]. Force B : [force du joueur]. Couleur : [couleur la pomme]. Épée : [poids l'épée]. Cailloux : [poids les cailloux].".
fin action`;

describe('[F132] Balise de propriété sans « de »', () => {

  let sortie: string;
  let erreurs: string[];

  beforeAll(() => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    sortie = ctx.com.executerCommande('dire', false).sortie;
    erreurs = [...ctx.jeu.tamponErreurs];
  });

  it('[F132-T001] [force le joueur] → « force du joueur »', () => {
    expect(sortie).toContain('Force A : 7.');
  });

  it('[F132-T002] [poids les cailloux] → « poids des cailloux »', () => {
    expect(sortie).toContain('Cailloux : 3.');
  });

  it('[F132-T003] non-régression : [force du joueur], [couleur la pomme], [poids l’épée]', () => {
    expect(sortie).toContain('Force B : 7.');
    expect(sortie).toContain('Couleur : rouge.');
    expect(sortie).toContain('Épée : 5.');
  });

  it('[F132-T004] aucune erreur de balise', () => {
    expect(sortie).not.toContain('problème balise');
    expect(erreurs).toEqual([]);
  });

  it('[F132-T005] non-régression : [poids ceci]', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    expect(ctx.com.executerCommande('tester l’épée', false).sortie).toContain('Prix de ceci : 5.');
  });

});
