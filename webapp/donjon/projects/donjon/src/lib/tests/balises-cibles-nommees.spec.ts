import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// [F074] Balises de propriété ([lui X], [Cest X], [Singulier X], [le X], [pronom X], [quantité X]…)
// avec une cible NOMMÉE (un élément du jeu désigné par son intitulé), en plus des cibles
// spéciales (ceci, cela, ici, origine, destination, orientation, réponse).
// Si la cible nommée n'est pas résolue, la balise est laissée intacte pour les handlers
// suivants du pipeline (compteurs [c X]/[s X], propriétés génériques [description X]…).

const VERGER = `
Le verger est un lieu.
La pomme est un objet mangeable dans le verger.
Sa description est "Une belle pomme rouge.".
Son prix est 5.
Les cerises (f) sont un objet dans le verger.
Le balai est un objet dans le verger.
Le score est un compteur initialisé à 3.
`;

describe('Balises propriété — cibles nommées (F074)', () => {

  function jouer(instructions: string) {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + VERGER + `
action tester:
${instructions}
fin action`);
    ctx.com.executerCommande('regarder', false);
    return ctx;
  }

  it('[F074-T001] [lui X] — pronom tonique accordé sur un élément nommé', () => {
    const ctx = jouer(`  dire "Sans [lui pomme], sans [lui balai], sans [lui cerises].".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('Sans elle, sans lui, sans elles.');
  });

  it('[F074-T002] [Cest X] — démonstratif accordé sur un élément nommé', () => {
    const ctx = jouer(`  dire "[Cest pomme] rouge. [Cest cerises] rouges.".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('C’est rouge. Ce sont rouges.');
  });

  it('[F074-T003] [Singulier X] / [Pluriel X] / [pronom X] sur un élément nommé', () => {
    const ctx = jouer(`  dire "[Singulier cerises] / [Pluriel pomme] / [pronom balai] / [pronom cerises].".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('Une cerise / Les pommes / il / elles.');
  });

  it('[F074-T004] [quantité X] et [le X] sur un élément nommé', () => {
    const ctx = jouer(`  dire "quantité : [quantité pomme] ; [le pomme] pomme, [le balai] balai, [le cerises] cerises.".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('quantité : 1 ; la pomme, le balai, les cerises.');
  });

  it('[F074-T005] non-régression — [c score] et [s score] restent traités par le handler compteur', () => {
    const ctx = jouer(`  dire "Vous avez [c score] point[s score].".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('Vous avez 3 points.');
  });

  it('[F074-T006] non-régression — [description X] et [prix de la X] (chemin générique)', () => {
    const ctx = jouer(`  dire "[description pomme] Prix : [prix de la pomme].".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).toContain('Une belle pomme rouge.');
    expect(sortie).withContext(sortie).toContain('Prix : 5.');
  });

  it('[F074-T007] non-régression — cibles spéciales inchangées ([lui ceci], [le ceci])', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + VERGER + `
règle après prendre la pomme:
  dire "Vous ne partirez pas sans [lui ceci] ([le ceci] ceci).".
fin règle`);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('prendre la pomme', false).sortie;
    expect(sortie).withContext(sortie).toContain('sans elle (la ceci).');
  });

  it('[F074-T008] cible inexistante — balise non résolue, erreur propre, pas de plantage', () => {
    const ctx = jouer(`  dire "Sans [lui licorne].".`);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).withContext(sortie).not.toContain('Sans elle');
    expect(ctx.jeu.tamponErreurs.some(e => e.includes('[lui licorne]'))).withContext(ctx.jeu.tamponErreurs.join(' | ')).toBeTrue();
  });

});
