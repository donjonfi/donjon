// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F131] « AFFICHER <COMPTEUR> DANS LE CARTOUCHE » (issue #261)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Par analogie avec « afficher le lieu dans le cartouche », un compteur peut être affiché avec
// « afficher <compteur> dans le cartouche [du haut|du bas] [à gauche|à droite] ».
// Par défaut : en haut à droite (comme « <compteur> est affiché. »).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { TestUtils } from "../utils/test-utils";

describe('[F131] Afficher un compteur dans le cartouche', () => {

  it('[F131-T001] « afficher le score dans le cartouche. » → en haut à droite', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le score est un compteur initialisé à 0.
afficher le score dans le cartouche.`);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-droite');
  });

  it('[F131-T002] « … dans le cartouche du bas. » → en bas à droite', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La vie est un compteur initialisé à 10.
afficher la vie dans le cartouche du bas.`);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-droite');
  });

  it('[F131-T003] « … dans le cartouche du bas à gauche. » → en bas à gauche', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La bourse est un compteur initialisé à 100.
Afficher la bourse dans le cartouche du bas à gauche.`);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('bas-gauche');
  });

  it('[F131-T004] « … dans le cartouche du haut à gauche. » → en haut à gauche', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le score est un compteur initialisé à 0.
afficher le score dans le cartouche du haut à gauche.`);
    expect(ctx.jeu.compteurs[0].positionAffichage).toEqual('haut-gauche');
  });

  it('[F131-T005] compteur inexistant → « Compteur inconnu »', () => {
    const rc = CompilateurV8.analyserScenarioSeul(`
Le score est un compteur initialisé à 0.
afficher la fortune dans le cartouche.`, false);
    expect(rc.messages.map(m => m.titre)).toEqual(['Compteur inconnu']);
  });

  it('[F131-T006] « afficher le lieu dans le cartouche du bas. » agit toujours sur le lieu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le score est un compteur initialisé à 0.
afficher le lieu dans le cartouche du bas.`);
    expect(ctx.jeu.parametres.afficherTitreLieu).toEqual('bas');
    expect(ctx.jeu.compteurs[0].positionAffichage).toBeUndefined();
  });

  it('[F131-T007] les deux compteurs de l’exemple « score et points de vie » du wiki', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le score est un compteur initialisé à 0.
La vie est un compteur initialisé à 10.
afficher le score dans le cartouche.
afficher la vie dans le cartouche.`);
    expect(ctx.jeu.compteurs.map(c => c.positionAffichage)).toEqual(['haut-droite', 'haut-droite']);
  });

});
