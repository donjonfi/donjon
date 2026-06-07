import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Exemples testables de la référence « Définitions du monde ».
// Corps identiques aux .djn de ressources/scenarios/exemples/wiki/definitions/.

const CLASSE = `
affamé et repu forment une bascule.

Un familier est un animal.
Un familier est affamé.

Un chaton est un familier.

La maison est un lieu.
Le chat est un familier dans la maison.
Le chien est un familier dans la maison.
Le chien est repu.
Le minou est un chaton dans la maison.
Le joueur est dans la maison.

action recenser:
  dire "Familiers : [nombre de familiers].".
  si le chat est affamé, dire "Le chat est affamé (défaut du type).".
  si le chien est repu, dire "Le chien est repu (défini sur l'instance).".
  si le minou est un familier, dire "Le minou (chaton) est aussi un familier.".
  si le minou est affamé, dire "Le minou est affamé (défaut hérité en chaîne).".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/recenser/}.".
fin règle`;

describe('Exemples wiki — définitions', () => {

  it('[F064-T001] classe personnalisée : héritage (chaîné), défaut de type, surcharge', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + CLASSE);
    const s = ctx.com.executerCommande('recenser', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    // familier ← animal, chaton ← familier : chat + chien + minou (chaton, donc familier)
    expect(s).toContain('Familiers : 3.');
    expect(s).toContain('Le chat est affamé (défaut du type).');
    expect(s).toContain('Le chien est repu (défini sur l\'instance).');
    expect(s).toContain('Le minou (chaton) est aussi un familier.');
    expect(s).toContain('Le minou est affamé (défaut hérité en chaîne).');
  });

});
