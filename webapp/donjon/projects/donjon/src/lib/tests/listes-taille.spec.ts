import { ConditionsUtils, GroupeNominal } from "../../public-api";

import { Jeu } from "../models/jeu/jeu";
import { Liste } from "../models/jeu/liste";
import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/4] TAILLE: LISTE VIDE (taille = 0)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Taille: liste vide (taille = 0)', () => {

  let jeu: Jeu = new Jeu();
  let liste = new Liste("historique", new GroupeNominal("l’", "historique"));
  jeu.listes.push(liste);
  const condUtils = new ConditionsUtils(jeu, false);

  // vaut
  it('taille vaut 0 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille vaut 1 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille ne vaut pas 0 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne vaut pas 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille ne vaut pas 1 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne vaut pas 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

  // atteint (>=)
  it('taille atteint 0 (0 >= 0) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille atteint 1 (0 >= 1) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 1', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille n’atteint pas 1 (0 < 1) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique n’atteint pas 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille n’atteint pas 0 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique n’atteint pas 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  // dépasse (>)
  it('taille dépasse 0 (0 > 0) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique dépasse 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille ne dépasse pas 0 (not 0 > 0) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne dépasse pas 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/4] TAILLE: LISTE AVEC 1 ÉLÉMENT (taille = 1)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Taille: liste avec 1 élément (taille = 1)', () => {

  let jeu: Jeu = new Jeu();
  let liste = new Liste("historique", new GroupeNominal("l’", "historique"));
  liste.ajouterTexte('"premier"');
  jeu.listes.push(liste);
  const condUtils = new ConditionsUtils(jeu, false);

  // vaut
  it('taille vaut 1 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille vaut 0 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', undefined, undefined, undefined, 0)).toBeFalse();
  });

  // atteint (>=)
  it('taille atteint 1 (1 >= 1) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille atteint 0 (1 >= 0) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille atteint 2 (1 >= 2) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 2', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille n’atteint pas 2 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique n’atteint pas 2', undefined, undefined, undefined, 0)).toBeTrue();
  });

  // dépasse (>)
  it('taille dépasse 0 (1 > 0) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique dépasse 0', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille dépasse 1 (1 > 1) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique dépasse 1', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille ne dépasse pas 1 (not 1 > 1) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne dépasse pas 1', undefined, undefined, undefined, 0)).toBeTrue();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [3/4] TAILLE: LISTE AVEC 5 ÉLÉMENTS (taille = 5)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Taille: liste avec 5 éléments (taille = 5)', () => {

  let jeu: Jeu = new Jeu();
  let liste = new Liste("historique", new GroupeNominal("l’", "historique"));
  liste.ajouterTexte('"a"');
  liste.ajouterTexte('"b"');
  liste.ajouterTexte('"c"');
  liste.ajouterTexte('"d"');
  liste.ajouterTexte('"e"');
  jeu.listes.push(liste);
  const condUtils = new ConditionsUtils(jeu, false);

  // vaut
  it('taille vaut 5 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 5', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille vaut 4 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 4', undefined, undefined, undefined, 0)).toBeFalse();
  });

  // atteint (>=)
  it('taille atteint 5 (5 >= 5) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 5', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille atteint 6 (5 >= 6) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 6', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille atteint 3 (5 >= 3) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique atteint 3', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille n’atteint pas 6 → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique n’atteint pas 6', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille n’atteint pas 5 → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique n’atteint pas 5', undefined, undefined, undefined, 0)).toBeFalse();
  });

  // dépasse (>)
  it('taille dépasse 4 (5 > 4) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique dépasse 4', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille dépasse 5 (5 > 5) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique dépasse 5', undefined, undefined, undefined, 0)).toBeFalse();
  });

  it('taille ne dépasse pas 5 (not 5 > 5) → vrai', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne dépasse pas 5', undefined, undefined, undefined, 0)).toBeTrue();
  });

  it('taille ne dépasse pas 4 (5 > 4) → faux', () => {
    expect(condUtils.siEstVrai('la taille de l’historique ne dépasse pas 4', undefined, undefined, undefined, 0)).toBeFalse();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [4/4] TAILLE: SCÉNARIO DSL avec groupe d'accusés
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Taille: scénario DSL (groupe d’accusés)', () => {

  it('taille atteint 5 après 5 ajouts', () => {

    const scenario = `
Le tribunal est un lieu.
Le groupe d’accusés est une liste.
action accuser:
  changer le groupe d’accusés contient "accusé".
fin action
action vérifier:
  si la taille du groupe d’accusés atteint 5:
    changer le joueur est coupable.
  finsi
fin action
`;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    // 4 ajouts: le joueur ne doit pas être coupable
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'coupable', ctx.eju)).toBeFalse();

    // 5e ajout: atteint 5
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'coupable', ctx.eju)).toBeTrue();

  });

  it('taille dépasse 3 après 4 ajouts', () => {

    const scenario = `
Le couloir est un lieu.
Les témoins sont une liste.
action témoigner:
  changer les témoins contient "témoin".
fin action
action contrôler:
  si la taille des témoins dépasse 3:
    changer le joueur est satisfait.
  finsi
fin action
`;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    // 3 ajouts: ne dépasse pas encore 3
    ctx.com.executerCommande("témoigner", false);
    ctx.com.executerCommande("témoigner", false);
    ctx.com.executerCommande("témoigner", false);
    ctx.com.executerCommande("contrôler", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();

    // 4e ajout: dépasse 3 (4 > 3)
    ctx.com.executerCommande("témoigner", false);
    ctx.com.executerCommande("contrôler", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();

  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [5/5] TAILLE: INTITULÉS DE DIFFÉRENTES COMPLEXITÉS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Taille: intitulés de différentes complexités', () => {

  // ─── 1. Simple masculin : "le compteur" → "du compteur" ─────────────────────
  it('simple masculin: la taille du compteur atteint 2', () => {
    const scenario = `
Le hall est un lieu.
Le compteur est une liste.
action marquer:
  changer le compteur contient "item".
fin action
action vérifier:
  si la taille du compteur atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("marquer", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("marquer", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 2. Simple féminin : "la file" → "de la file" ───────────────────────────
  it('simple féminin: la taille de la file atteint 2', () => {
    const scenario = `
Le hall est un lieu.
La file est une liste.
action entrer:
  changer la file contient "personne".
fin action
action vérifier:
  si la taille de la file atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("entrer", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("entrer", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 3. Élidé : "l'archive" → "de l'archive" ────────────────────────────────
  it('élidé: la taille de l’archive atteint 2', () => {
    const scenario = `
Le hall est un lieu.
L'archive est une liste.
action archiver:
  changer l'archive contient "doc".
fin action
action vérifier:
  si la taille de l'archive atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("archiver", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("archiver", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 4. Pluriel : "les éléments" → "des éléments" ───────────────────────────
  it('pluriel: la taille des éléments atteint 2', () => {
    const scenario = `
Le hall est un lieu.
Les éléments sont une liste.
action ajouter:
  changer les éléments contient "élément".
fin action
action vérifier:
  si la taille des éléments atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("ajouter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("ajouter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 5. Composé masculin + épithète : "le groupe actif" → "du groupe actif" ─
  it('composé + épithète (masc): la taille du groupe actif atteint 2', () => {
    const scenario = `
Le hall est un lieu.
Le groupe actif est une liste.
action recruter:
  changer le groupe actif contient "membre".
fin action
action vérifier:
  si la taille du groupe actif atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("recruter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("recruter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 6. Pluriel composé + épithète : "les notes importantes" → "des notes importantes" ─
  it('pluriel composé + épithète: la taille des notes importantes atteint 2', () => {
    const scenario = `
Le hall est un lieu.
Les notes importantes sont une liste.
action noter:
  changer les notes importantes contient "note".
fin action
action vérifier:
  si la taille des notes importantes atteint 2:
    changer le joueur est satisfait.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("noter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("noter", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'satisfait', ctx.eju)).toBeTrue();
  });

  // ─── 7. Nom composé (apostrophe) + épithète : "le groupe d’accusés actifs" ──
  xit("nom composé (apostrophe) + épithète: la taille du groupe d’accusés actifs atteint 2", () => {
    const scenario = `
Le tribunal est un lieu.
Le groupe d’accusés actifs est une liste.
action accuser:
  changer le groupe d’accusés actifs contient "accusé".
fin action
action vérifier:
  si la taille du groupe d'accusés actifs atteint 2:
    changer le joueur est coupable.
  finsi
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'coupable', ctx.eju)).toBeFalse();
    ctx.com.executerCommande("accuser", false);
    ctx.com.executerCommande("vérifier", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'coupable', ctx.eju)).toBeTrue();
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [6/6] BALISES [c] ET [s] POUR LA TAILLE D’UNE LISTE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Balises [c] et [s] pour la taille d’une liste', () => {

  // ─── [c taille du X] — valeur numérique ─────────────────────────────────────

  it('[c taille du compteur] — vaut 0 puis 2', () => {
    const scenario = `
Le hall est un lieu.
Le compteur est une liste.
action ajouter:
  changer le compteur contient "item".
fin action
action afficher:
  dire "[c taille du compteur]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("0");
    ctx.com.executerCommande("ajouter", false);
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("2");
  });

  it('[c taille des éléments] — vaut 0 puis 3', () => {
    const scenario = `
Le hall est un lieu.
Les éléments sont une liste.
action ajouter:
  changer les éléments contient "item".
fin action
action afficher:
  dire "[c taille des éléments]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("0");
    ctx.com.executerCommande("ajouter", false);
    ctx.com.executerCommande("ajouter", false);
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("3");
  });

  it('[c taille de l’archive] — vaut 0 puis 1', () => {
    const scenario = `
Le hall est un lieu.
L’archive est une liste.
action archiver:
  changer l’archive contient "doc".
fin action
action afficher:
  dire "[c taille de l’archive]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("0");
    ctx.com.executerCommande("archiver", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("1");
  });

  // ─── [s taille du X] — pluriel (vide si 1, "s" sinon) ──────────────────────

  it('[s taille du compteur] — "" si 1 élément, "s" si 2', () => {
    const scenario = `
Le hall est un lieu.
Le compteur est une liste.
action ajouter:
  changer le compteur contient "item".
fin action
action afficher:
  dire "élément[s taille du compteur]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("élément");
    expect(ctx.com.executerCommande("afficher", false).sortie).not.toContain("éléments");
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("éléments");
  });

  it('[s taille des éléments] — "" si 1 élément, "s" si 2', () => {
    const scenario = `
Le hall est un lieu.
Les éléments sont une liste.
action ajouter:
  changer les éléments contient "item".
fin action
action afficher:
  dire "élément[s taille des éléments]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("élément");
    expect(ctx.com.executerCommande("afficher", false).sortie).not.toContain("éléments");
    ctx.com.executerCommande("ajouter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("éléments");
  });

  it('[s taille de l’archive] — "" si 1 doc, "s" si 2', () => {
    const scenario = `
Le hall est un lieu.
L’archive est une liste.
action archiver:
  changer l’archive contient "doc".
fin action
action afficher:
  dire "document[s taille de l’archive]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.com.executerCommande("archiver", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("document");
    expect(ctx.com.executerCommande("afficher", false).sortie).not.toContain("documents");
    ctx.com.executerCommande("archiver", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("documents");
  });

  it('[c] et [s] combinés dans un même dire', () => {
    const scenario = `
Le hall est un lieu.
Les notes importantes sont une liste.
action noter:
  changer les notes importantes contient "note".
fin action
action afficher:
  dire "Il y a [c taille des notes importantes] note[s taille des notes importantes].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("0 note.");
    ctx.com.executerCommande("noter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("1 note.");
    ctx.com.executerCommande("noter", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("2 notes.");
  });

});
