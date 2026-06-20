// [F105] Instructions « système » (instruction-systeme.ts)
// Couvre les 3 infinitifs réellement gérés par InstructionSysteme :
//   - attendre (une touche / N secondes, avec clamp à 10 s)
//   - déterminer le déplacement du joueur (branches direction + sortie unique « sortir »)
// L'instruction « tester audio » n'est PAS couverte ici : testSon() instancie un
// LecteurAudio et appelle play(), ce que Chrome headless rejette (cf. F062-T009).
// effacer/terminer/déclencher ne vivent PAS dans ce fichier source.

import { TestUtils } from "../utils/test-utils";
import { TypeInterruption } from "../models/jeu/interruption";
import { actions } from "./scenario_actions";

describe('[F105] Instructions système — attendre / déterminer déplacement', () => {

  // --- attendre une touche -------------------------------------------------
  it('[F105-T001] attendre une touche → interruption attendreTouche', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
L'observatoire est un lieu.

action contempler:
  dire "Première vision.".
  attendre une touche.
  dire "Seconde vision.".
fin action`);
    const sortie = ctx.com.executerCommande('contempler', false).sortie;
    expect(sortie).toContain('Première vision');
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption)
      .toEqual(TypeInterruption.attendreTouche);
  });

  // --- attendre N secondes -------------------------------------------------
  it('[F105-T002] attendre 1 seconde → interruption attendreSecondes, nbSecondesAttendre = 1', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
L'observatoire est un lieu.

action patienter:
  dire "Pssssht.".
  attendre 1 seconde.
  dire "KABOOM.".
fin action`);
    const sortie = ctx.com.executerCommande('patienter', false).sortie;
    expect(sortie).toContain('Pssssht');
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption)
      .toEqual(TypeInterruption.attendreSecondes);
    expect(ctx.jeu.tamponInterruptions[0]?.nbSecondesAttendre).toEqual(1);
  });

  // --- clamp > 10 secondes (branche ligne 65-68) ---------------------------
  it('[F105-T003] attendre douze secondes → clampé à 10 s maximum', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
L'observatoire est un lieu.

action lambiner:
  attendre 12 secondes.
fin action`);
    ctx.com.executerCommande('lambiner', false);
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption)
      .toEqual(TypeInterruption.attendreSecondes);
    // le moteur plafonne à 10 secondes (« Attendre: 10 secondes maximum. »)
    expect(ctx.jeu.tamponInterruptions[0]?.nbSecondesAttendre).toEqual(10);
  });

  // --- déterminer déplacement : branche direction (aller au nord) ----------
  it('[F105-T004] déplacement par direction : aller au nord change le lieu courant', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le salon est un lieu.
Le jardin est un lieu au nord du salon.
Le joueur est dans le salon.`);
    expect(ctx.eju.curLieu.nom).toEqual('salon');
    ctx.com.executerCommande('aller au nord', false);
    expect(ctx.eju.curLieu.nom).toEqual('jardin');
  });

});
