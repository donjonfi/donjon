import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Exemples testables de la référence « Texte / balises » :
//  - famille [nombre de …] (compter des éléments du jeu) ;
//  - verbes conjugués [v …].
// Corps identiques aux .djn de ressources/scenarios/exemples/wiki/texte/.

const COMPTER = `
Un trophée est une sorte d'objet.

La salle des coupes est un lieu.
La vitrine est un contenant ouvert dans la salle des coupes.
L'étagère est un support dans la salle des coupes.
La table est un support dans la salle des coupes.

Le trophée d'or est un trophée dans la vitrine.
Le trophée d'argent est un trophée dans la vitrine.
Le trophée de bronze est un trophée sur l'étagère.
Le tabouret est un objet sous la table.
La lampe rouge est un objet allumé sur l'étagère.
La lampe bleue est un objet éteint sur l'étagère.

action compter:
  dire "Trophées dans le jeu : [nombre de trophées].".
  dire "Objets allumés : [nombre d'objets allumés].".
  dire "Trophées dans la vitrine : [nombre de trophées dans la vitrine].".
  dire "Trophées sur l'étagère : [nombre de trophées sur l'étagère].".
  dire "Objets allumés sur l'étagère : [nombre d'objets allumés sur l'étagère].".
  dire "Objets sous la table : [nombre d'objets sous la table].".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/compter/}.".
fin règle`;

const CONJUGAISON = `
La crypte est un lieu.

La statue est un objet féminin dans la crypte.
Sa description est "[Intitulé ceci] [v sembler ipr ceci] figé[accord ceci]. [Pronom ceci] [v être ipac ceci] sculpté[accord ceci] jadis et [v bouger ipr plus ceci].".

Les veilleurs sont des objets dans la crypte.
Sa description est "[Intitulé ceci] vous [v fixer ipr ceci]. Autrefois, [pronom ceci] [v murmurer iimp ceci] des prières.".

Le joueur est dans la crypte.

règle avant commencer le jeu:
  dire "Essayez : {/examiner la statue/}, {/examiner les veilleurs/}.".
fin règle`;

describe('Exemples wiki — texte', () => {

  it('[F063-T001] [nombre de …] : classe / état / dans / sur / sous', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + COMPTER);
    const s = ctx.com.executerCommande('compter', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(s).toContain('Trophées dans le jeu : 3.');
    expect(s).toContain('Objets allumés : 1.');
    // filtrage classe + position (régression : sans le filtre classe, « sur l'étagère » comptait
    // les 3 objets posés dessus au lieu du seul trophée).
    expect(s).toContain('Trophées dans la vitrine : 2.');
    expect(s).toContain('Trophées sur l\'étagère : 1.');
    expect(s).toContain('Objets allumés sur l\'étagère : 1.');
    expect(s).toContain('Objets sous la table : 1.');
  });

  it('[F063-T002] [v …] : présent / passé composé / imparfait / négation, accordés au sujet', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + CONJUGAISON);
    ctx.com.executerCommande('regarder', false);
    const statue = ctx.com.executerCommande('examiner la statue', false).sortie;
    const veilleurs = ctx.com.executerCommande('examiner les veilleurs', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    // singulier : semble / a été sculptée / ne bouge plus
    expect(statue).toContain('La statue semble figée.');
    expect(statue).toContain('Elle a été sculptée jadis et ne bouge plus.');
    // pluriel : fixent / murmuraient
    expect(veilleurs).toContain('Les veilleurs vous fixent.');
    expect(veilleurs).toContain('Autrefois, ils murmuraient des prières.');
  });

});
