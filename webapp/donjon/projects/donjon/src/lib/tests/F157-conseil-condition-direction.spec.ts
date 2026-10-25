// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F157] PAS DE CONSEIL « NI ÉLÉMENT NI ÉTAT » QUAND LE COMPLÉMENT EST UNE DIRECTION
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Depuis la 3.12, « si ceci est le sud » dans « règle après aller ceci » affichait le conseil
// « Ni élément ni état trouvé : « le sud » » quand ceci était un lieu (« aller dans l’alcôve ») :
// une direction n’était pas reconnue comme un complément existant.

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

function scenario(condition: string): string {
  return `
Le labo est un lieu.
L’alcôve est un lieu à l’est du labo.
Le couloir est un lieu au sud du labo.

règle après aller ceci:
  si ${condition}:
    dire "VICTOIRE".
  finsi
fin règle

Le joueur est dans le labo.
` + actions;
}

describe('[F157] Conseil « ni élément ni état » : directions', () => {

  it('[F157-T001] « ceci est le sud » avec ceci = lieu : faux, sans conseil', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('ceci est le sud'));
    expect(ctx.com.executerCommande('aller dans l’alcôve', false).sortie).not.toContain('VICTOIRE');
    expect(ctx.jeu.tamponConseils).toEqual([]);
  });

  it('[F157-T002] « ceci est sud » (sans article) avec ceci = lieu : faux, sans conseil', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('ceci est sud'));
    expect(ctx.com.executerCommande('aller dans l’alcôve', false).sortie).not.toContain('VICTOIRE');
    expect(ctx.jeu.tamponConseils).toEqual([]);
  });

  it('[F157-T003] « ceci est le sud » avec ceci = direction : vrai', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('ceci est le sud'));
    expect(ctx.com.executerCommande('aller au sud', false).sortie).toContain('VICTOIRE');
    expect(ctx.jeu.tamponConseils).toEqual([]);
  });

  it('[F157-T004] faute de frappe : toujours signalée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('ceci est le sdu'));
    ctx.com.executerCommande('aller dans l’alcôve', false);
    expect(ctx.jeu.tamponConseils).toEqual(['Ni élément ni état trouvé : « le sdu ».']);
  });

});
