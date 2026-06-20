// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F094] ELEMENT-JEU — accesseurs « nbAffichage » robustes (B10)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// ⚠️ Guard du bug B10 : le getter nbAffichageDescription faisait `.find(…).nbAffichage` SANS `?.`
// (contrairement à nbAffichageApercu) → exception en lisant un élément sans propriété « description ».
// Corrigé en `.find(…)?.nbAffichage`.

import { TestUtils } from "../utils/test-utils";

describe('[F094] ElementJeu.nbAffichageDescription (B10)', () => {

  it('[F094-T001] lire nbAffichageDescription ne lève jamais, même sans propriété description', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`Le salon est un lieu. La bricole est un objet ici.`);
    // avant le fix : tout élément sans propriété « description » faisait planter le getter.
    ctx.jeu.objets.forEach(o => expect(() => o.nbAffichageDescription).not.toThrow());
  });

  it('[F094-T002] un objet avec description expose un compteur d\'affichage numérique', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `Le salon est un lieu. Le vase est un objet ici. Sa description est "Un joli vase.".`
    );
    const vase = ctx.jeu.objets.find(o => o.nbAffichageDescription !== undefined);
    expect(vase).toBeDefined();
    expect(typeof vase.nbAffichageDescription).toBe('number');
  });
});
