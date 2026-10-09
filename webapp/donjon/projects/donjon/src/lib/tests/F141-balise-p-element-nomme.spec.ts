// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F141] BALISE [p prop élément] POUR UN ÉLÉMENT NOMMÉ (issue #270)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// [p prix la hache], [p poids sac] : comme [p prix ceci], mais pour un élément désigné par son nom.

import { TestUtils } from "../utils/test-utils";

function dire(texte: string): { sortie: string, erreurs: string[] } {
  const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.
La hache est un objet dans la salle.
Son prix vaut 12.
Le sac est un objet dans la salle.
Son poids vaut 3.
Sa couleur est "rouge".
L’épée (f) est un objet dans la salle.
Son prix vaut 40.

action tester:
  dire "${texte}".
fin action

Le joueur est dans la salle.
`);
  const sortie = ctx.com.executerCommande('tester', false).sortie;
  return { sortie, erreurs: ctx.jeu.tamponErreurs };
}

describe('[F141] Balise [p prop élément] pour un élément nommé', () => {

  it('[F141-T001] propriété numérique, avec article', () => {
    expect(dire('[p prix la hache]|[p poids le sac]|[p prix l’épée]')).toEqual({ sortie: '12|3|40', erreurs: [] });
  });

  it('[F141-T002] propriété numérique, sans article', () => {
    expect(dire('[p poids sac]|[p prix hache]')).toEqual({ sortie: '3|12', erreurs: [] });
  });

  it('[F141-T003] propriété texte', () => {
    expect(dire('[p couleur le sac]')).toEqual({ sortie: 'rouge', erreurs: [] });
  });

  it('[F141-T004] élément introuvable : @problème balise@ + erreur', () => {
    expect(dire('A[p prix la pioche]B')).toEqual({
      sortie: 'A{+@problème balise@+}B',
      erreurs: ['Balise pas comprise ou propriété pas trouvée: [p prix la pioche]'],
    });
  });

});
