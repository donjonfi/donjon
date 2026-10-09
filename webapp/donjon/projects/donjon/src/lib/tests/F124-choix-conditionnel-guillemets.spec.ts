// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F124] CHOIX CONDITIONNEL CONTENANT DES GUILLEMETS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// L’exemple du wiki « choix "[si le joueur est fatigué]Je n’en peux plus ![fin]": » fonctionne,
// mais « choix "[si l’historique contient "toto"]…[fin]": » faisait échouer la compilation
// (les guillemets internes coupaient le libellé du choix).

import { TestUtils } from "../utils/test-utils";
import { TypeInterruption } from "../models/jeu/interruption";
import { ContextePartie } from "../models/jouer/contexte-partie";

/** Scénario : l’action « tester » propose 2 choix fixes + 1 choix conditionnel. */
function scenarioChoix(choixConditionnel: string, declencheur: string, declaration = 'L’historique est une liste.'): string {
  return `
La salle de gym est un lieu.
${declaration}

action tester:
  choisir:
    choix "C’est parti":
      dire "Go go go".
    choix "Toujours chaud !":
      dire "On continue !".
    choix ${choixConditionnel}:
      dire "On se repose !".
  fin choisir
fin action

action fatiguer:
  ${declencheur}
  dire "Ça fatigue !".
fin action`;
}

/** Libellé tel qu’affiché, sans balises de mise en forme ({E}, {N}…) ni espaces insécables. */
function nettoyer(texte: string): string {
  return texte.replace(/\{\w\}/g, '').replace(/[  ]/g, ' ');
}

/** Joue « tester » et renvoie les libellés des choix proposés. */
function libellesProposes(ctx: ContextePartie): string[] {
  ctx.com.executerCommande('tester', false);
  const interruption = ctx.jeu.tamponInterruptions[0];
  expect(interruption?.typeInterruption).toEqual(TypeInterruption.attendreChoix);
  return interruption.choix.map(c => nettoyer(c.valeurs[0].toString()));
}

/** Répond au choix « attendreChoix » en cours (par son libellé) et renvoie la sortie. */
function repondre(ctx: ContextePartie, libelle: string): string {
  const interruption = ctx.jeu.tamponInterruptions.shift();
  const choix = interruption.choix.find(c => nettoyer(c.valeurs[0].toString()) == libelle);
  expect(choix).toBeDefined();
  interruption.tour.reponse = choix.valeurs[0];
  interruption.tour.reste.unshift(...choix.instructions);
  return ctx.com.continuerLeTourInterrompu(interruption.tour);
}

/** Vérifie : choix masqué au départ, affiché (et jouable) après « fatiguer ». */
function verifierChoixConditionnel(choixConditionnel: string, declencheur: string, libelleAttendu: string) {
  let ctx: ContextePartie;
  expect(() => ctx = TestUtils.genererEtCommencerLeJeu(scenarioChoix(choixConditionnel, declencheur))).not.toThrow();

  // condition fausse : 2 choix
  expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"']);
  repondre(ctx, '"C’est parti"');

  // condition vraie : 3 choix
  expect(nettoyer(ctx.com.executerCommande('fatiguer', false).sortie)).toContain('Ça fatigue !');
  expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"', libelleAttendu]);
  expect(nettoyer(repondre(ctx, libelleAttendu))).toContain('On se repose !');

  expect(ctx.jeu.tamponErreurs).toEqual([]);
}

describe('[F124] choix conditionnel — exemple du wiki (état)', () => {

  it('[F124-T001] « [si le joueur est fatigué] » : masqué puis affiché', () => {
    verifierChoixConditionnel(
      '"[si le joueur est fatigué]Je n’en peux plus ![fin si]"',
      'changer le joueur est fatigué.',
      '"Je n’en peux plus !"');
  });

});

describe('[F124] choix conditionnel — historique (guillemets imbriqués)', () => {

  it('[F124-T010] « [si l’historique contient "toto"] » (apostrophe typographique)', () => {
    verifierChoixConditionnel(
      '"[si l’historique contient "toto"]Je n’en peux plus ![fin si]"',
      'ajouter "toto" à la liste historique.',
      '"Je n’en peux plus !"');
  });

  it('[F124-T011] « [si l\'historique contient "toto"] » (apostrophe droite)', () => {
    verifierChoixConditionnel(
      `"[si l'historique contient "toto"]Je n’en peux plus ![fin si]"`,
      `ajouter "toto" à la liste historique.`,
      '"Je n’en peux plus !"');
  });

  it('[F124-T012] « [si L’historique contient "toto"] » (majuscule)', () => {
    verifierChoixConditionnel(
      '"[si L’historique contient "toto"]Je n’en peux plus ![fin si]"',
      'ajouter "toto" à la liste historique.',
      '"Je n’en peux plus !"');
  });

  it('[F124-T013] fermeture « [fin] » (comme dans le wiki)', () => {
    verifierChoixConditionnel(
      '"[si l’historique contient "toto"]Je n’en peux plus ![fin]"',
      'ajouter "toto" à la liste historique.',
      '"Je n’en peux plus !"');
  });

  it('[F124-T014] valeur de plusieurs mots « "toto est passé" »', () => {
    verifierChoixConditionnel(
      '"[si l’historique contient "toto est passé"]Je n’en peux plus ![fin si]"',
      'ajouter "toto est passé" à la liste historique.',
      '"Je n’en peux plus !"');
  });

  it('[F124-T015] texte autour de la condition (avec [sinon]) : le libellé change', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioChoix(
      '"Je [si l’historique contient "toto"]n’en peux plus[sinon]suis en forme[fin si] !"',
      'ajouter "toto" à la liste historique.'));
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"', '"Je suis en forme !"']);
    repondre(ctx, '"C’est parti"');
    ctx.com.executerCommande('fatiguer', false);
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"', '"Je n’en peux plus !"']);
    expect(nettoyer(repondre(ctx, '"Je n’en peux plus !"'))).toContain('On se repose !');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F124-T017] « changer l’historique contient "toto" » (au lieu de « ajouter … à la liste »)', () => {
    verifierChoixConditionnel(
      '"[si l’historique contient "toto"]Je n’en peux plus ![fin si]"',
      'changer l’historique contient "toto".',
      '"Je n’en peux plus !"');
  });

  it('[F124-T018] « changer l\'historique contient "toto" » (apostrophe droite)', () => {
    verifierChoixConditionnel(
      `"[si l'historique contient "toto"]Je n’en peux plus ![fin si]"`,
      `changer l'historique contient "toto".`,
      '"Je n’en peux plus !"');
  });

  it('[F124-T019] historique non déclaré comme liste : compile et ne plante pas', () => {
    let ctx: ContextePartie;
    expect(() => ctx = TestUtils.genererEtCommencerLeJeu(scenarioChoix(
      '"[si l’historique contient "toto"]Je n’en peux plus ![fin si]"',
      'changer l’historique contient "toto".',
      ''))).not.toThrow();
    // condition sur un élément inexistant : le choix reste masqué
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"']);
  });

  it('[F124-T016] « [si l’historique ne contient pas "toto"] » : affiché puis masqué', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioChoix(
      '"[si l’historique ne contient pas "toto"]Je suis en forme ![fin si]"',
      'ajouter "toto" à la liste historique.'));
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"', '"Je suis en forme !"']);
    expect(nettoyer(repondre(ctx, '"Je suis en forme !"'))).toContain('On se repose !');
    ctx.com.executerCommande('fatiguer', false);
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Toujours chaud !"']);
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});

describe('[F124] choix conditionnel — bloc d’instructions dans le choix', () => {

  const scenarioBloc = `
La salle de gym est un lieu.
L’historique est une liste.
Le score est un compteur initialisé à 0.

action tester:
  dire "Que faire ?".
  choisir:
    choix "C’est parti":
      dire "Go go go".
    choix "[si l’historique contient "toto"]Je n’en peux plus ![fin si]":
      dire "On se repose !".
      changer le score augmente de 1.
      si l’historique contient "toto":
        dire "Toto est passé par là.".
      fin si
      changer l’historique contient "repos".
    choix "[si l’historique contient "repos"]Encore du repos[fin si]":
      dire "Toujours au repos.".
  fin choisir
  dire "Fin du choix.".
fin action

action fatiguer:
  changer l’historique contient "toto".
fin action`;

  it('[F124-T030] toutes les instructions du choix conditionnel sont exécutées', () => {
    let ctx: ContextePartie;
    expect(() => ctx = TestUtils.genererEtCommencerLeJeu(scenarioBloc)).not.toThrow();

    expect(libellesProposes(ctx)).toEqual(['"C’est parti"']);
    expect(nettoyer(repondre(ctx, '"C’est parti"'))).toContain('Go go go');

    ctx.com.executerCommande('fatiguer', false);
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Je n’en peux plus !"']);
    const sortie = nettoyer(repondre(ctx, '"Je n’en peux plus !"'));
    expect(sortie).toContain('On se repose !');
    expect(sortie).toContain('Toto est passé par là.');
    expect(sortie).toContain('Fin du choix.');
    expect(ctx.jeu.compteurs.find(c => c.nom == 'score').valeur).toEqual(1);

    // le 3e choix dépend d’une valeur ajoutée par le bloc du 2e
    expect(libellesProposes(ctx)).toEqual(['"C’est parti"', '"Je n’en peux plus !"', '"Encore du repos"']);
    expect(nettoyer(repondre(ctx, '"Encore du repos"'))).toContain('Toujours au repos.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});

describe('[F124] guillemets imbriqués dans un « dire » d’une action', () => {

  it('[F124-T020] « dire "[si l’historique contient "toto"]…" »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle de gym est un lieu.
L’historique est une liste.
action tester:
  dire "[si l’historique contient "toto"]OUI[sinon]NON[fin si]".
fin action
action fatiguer:
  ajouter "toto" à la liste historique.
fin action`);
    expect(ctx.com.executerCommande('tester', false).sortie).toContain('NON');
    ctx.com.executerCommande('fatiguer', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toContain('OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
