// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F150] CONDITION « X SE TROUVE DANS CECI/CELA » QUAND CECI/CELA EST UN OBJET
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « se trouve dans ceci » n’acceptait qu’un lieu pour ceci (toujours faux pour un contenant/support),
// alors que « se trouve dans la boîte » fonctionnait.

import { TestUtils } from "../utils/test-utils";

const scenario = `
La salle est un lieu.
La boîte est un contenant ouvert et vu dans la salle.
La clé est un objet vu dans la boîte.
La table est un support vu dans la salle.
Le livre est un objet vu sur la table.
La pomme est un objet vu dans la salle.

action tester ceci avec cela:
  si cela se trouve dans ceci, dire "DANS".
  si cela se trouve sur ceci, dire "SUR".
  si ceci se trouve dans cela, dire "INV".
  dire "FIN".
fin action

Le joueur est dans la salle.
`;

describe('[F150] Condition « X se trouve dans ceci/cela » (objet)', () => {

  it('[F150-T001] contenant : « cela se trouve dans ceci » et « ceci se trouve dans cela »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('tester la boîte avec la clé', false).sortie).toMatch(/^DANS.*FIN$/s);
    expect(ctx.com.executerCommande('tester la clé avec la boîte', false).sortie).toMatch(/^INV.*FIN$/s);
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F150-T002] support : « cela se trouve sur ceci »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('tester la table avec le livre', false).sortie).toMatch(/^SUR.*FIN$/s);
  });

  it('[F150-T003] pas de relation : faux', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('tester la boîte avec la pomme', false).sortie).toBe('FIN');
  });

});
