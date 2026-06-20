// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F096] COMPTEURS-UTILS (P0) — mutation runtime de la valeur d'un compteur (compteurs-utils)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// CompteursUtils.changerValeurCompteurOuPropriete applique sur un Compteur les verbes
// 'vaut' (affectation), 'augmente' (+=), 'diminue' (-=). La surface DSL passe par
// « changer le X vaut/augmente/diminue de N » (instruction-changer.ts → verbe='vaut'|'augmente'|'diminue').
// On exerce l'init, l'incrémentation, la décrémentation, l'affectation, l'absence de borne
// (pas de clamp sur un compteur, contrairement à la quantité d'un objet), puis le pur
// helper statique intituleNombreVersNombre.

import { TestUtils } from "../utils/test-utils";
import { CompteursUtils } from "../utils/jeu/compteurs-utils";

/** Retrouve la valeur courante d'un compteur par son nom. */
function valeurCompteur(ctx: any, nom: string): number {
  return ctx.jeu.compteurs.find((c: any) => c.nom === nom).valeur;
}

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Initialisation
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — initialisation', () => {

  it('[F096-T001] compteur sans initialisation → valeur 0', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur.
`);
    expect(ctx.jeu.compteurs).toHaveSize(1);
    expect(valeurCompteur(ctx, 'score')).toEqual(0);
  });

  it('[F096-T002] compteur initialisé à 5 → valeur 5', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 5.
`);
    expect(valeurCompteur(ctx, 'score')).toEqual(5);
  });

});

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Augmenter (verbe 'augmente' → +=)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — augmenter', () => {

  it('[F096-T010] « changer le score augmente de 3 » → 5 + 3 = 8', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 5.
action tester:
  changer le score augmente de 3.
fin action`, false);
    expect(valeurCompteur(ctx, 'score')).toEqual(5);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(8);
  });

  it('[F096-T011] deux incréments successifs cumulent', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 0.
action tester:
  changer le score augmente de 2.
  changer le score augmente de 4.
fin action`, false);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(6);
  });

});

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Diminuer (verbe 'diminue' → -=)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — diminuer', () => {

  it('[F096-T020] « changer le score diminue de 2 » → 5 - 2 = 3', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 5.
action tester:
  changer le score diminue de 2.
fin action`, false);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(3);
  });

  it('[F096-T021] décrément sous zéro → valeur négative (pas de borne sur un compteur)', () => {
    // comportement actuel : un compteur (≠ quantité d'objet) n'est PAS borné à 0.
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 5.
action tester:
  changer le score diminue de 8.
fin action`, false);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(-3);
  });

});

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Affecter (verbe 'vaut' → affectation)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — affecter (vaut)', () => {

  it('[F096-T030] « changer le score vaut 42 » → 42', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 5.
action tester:
  changer le score vaut 42.
fin action`, false);
    expect(valeurCompteur(ctx, 'score')).toEqual(5);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(42);
  });

  it('[F096-T031] affectation après incrément écrase la valeur cumulée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 0.
action tester:
  changer le score augmente de 10.
  changer le score vaut 1.
fin action`, false);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(1);
  });

});

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Plusieurs compteurs : indépendance
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — compteurs indépendants', () => {

  it('[F096-T040] modifier un compteur ne touche pas l\'autre', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 0.
la bourse est un compteur initialisé à 100.
action tester:
  changer le score augmente de 7.
fin action`, false);
    ctx.com.executerCommande("tester", false);
    expect(valeurCompteur(ctx, 'score')).toEqual(7);
    expect(valeurCompteur(ctx, 'bourse')).toEqual(100);
  });

});

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Helper statique pur : intituleNombreVersNombre
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————

describe('[F096] compteurs-utils — intituleNombreVersNombre (statique)', () => {

  it('[F096-T050] entier "7" → 7', () => {
    expect(CompteursUtils.intituleNombreVersNombre("7")).toEqual(7);
  });

  it('[F096-T051] chaîne non numérique "abc" → 0 (fallback)', () => {
    // comportement actuel : aucune correspondance numérique → 0 (≠ null d'intituleValeurVersNombre)
    expect(CompteursUtils.intituleNombreVersNombre("abc")).toEqual(0);
  });

  it('[F096-T052] décimal à virgule "3,5" → 3.5 (virgule convertie en point)', () => {
    expect(CompteursUtils.intituleNombreVersNombre("3,5")).toBeCloseTo(3.5, 5);
  });

});
