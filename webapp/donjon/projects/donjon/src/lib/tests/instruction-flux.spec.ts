// [F104] Instructions de contrôle de flux (interrompre / continuer / terminer / commencer / annuler)
//
// Cible : utils/jeu/instruction-flux.ts — fonctions à faible couverture de branches
// (executerAnnuler, executerCommencer, executerInterrompre, executerContinuer, executerTerminer).
// On exerce un succès + une erreur par fonction via une « action tester: ».

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

describe('[F104] instruction-flux : contrôle de flux', () => {

  // --- interrompre ---------------------------------------------------------

  it('[F104-T001] « interrompre la partie » met le jeu en interrompu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  interrompre la partie.
fin action
`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('tester', false);
    expect(ctx.jeu.interrompu).toBeTrue();
  });

  it('[F104-T002] « interrompre la partie » deux fois signale « déjà interrompue »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  interrompre la partie.
  interrompre la partie.
fin action
`);
    ctx.com.executerCommande('tester', false);
    expect(ctx.jeu.interrompu).toBeTrue();
    const erreurs = ctx.jeu.tamponErreurs.join(' ');
    expect(erreurs).toContain('déjà interrompue');
  });

  // --- continuer -----------------------------------------------------------

  it('[F104-T003] « continuer la partie » après interruption ne produit pas d’erreur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  interrompre la partie.
  continuer la partie.
fin action
`);
    ctx.com.executerCommande('tester', false);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F104-T004] « continuer la partie » sans interruption préalable signale « n’est pas interrompue »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  continuer la partie.
fin action
`);
    ctx.com.executerCommande('tester', false);
    const erreurs = ctx.jeu.tamponErreurs.join(' ');
    expect(erreurs).toContain('interrompue');
  });

  // --- terminer ------------------------------------------------------------

  it('[F104-T005] « terminer le jeu » marque le jeu comme terminé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  terminer le jeu.
fin action
`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('tester', false);
    expect(ctx.jeu.termine).toBeTrue();
  });

  // --- commencer (branche erreur : seule « nouvelle partie » est valide) ---

  it('[F104-T006] « commencer le repas » (sujet invalide) signale une erreur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  commencer le repas.
fin action
`);
    ctx.com.executerCommande('tester', false);
    const erreurs = ctx.jeu.tamponErreurs.join(' ');
    expect(erreurs).toContain('nouvelle partie');
  });

  // --- annuler (branche erreur : ni tours ni routine) ----------------------

  it('[F104-T007] « annuler le voyage » (sujet invalide) signale une erreur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
action tester:
  annuler le voyage.
fin action
`);
    ctx.com.executerCommande('tester', false);
    const erreurs = ctx.jeu.tamponErreurs.join(' ');
    expect(erreurs).toContain('annuler');
  });

});
