// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F138] CONTIENT / RETIRER SUR UNE LISTE MIXTE (issue #267)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Une liste mixte (texte + nombre + élément) : « contient » et « retirer » fonctionnent pour chaque type.

import { ClassesRacines } from "../models/commun/classes-racines";
import { TestUtils } from "../utils/test-utils";

const SCENARIO = `
La salle est un lieu.
La carte est un objet dans la salle.
La pomme est un objet dans la salle.
Les notes sont une liste.

action remplir:
  ajouter "grotte visitée" à la liste notes.
  ajouter 3 à la liste notes.
  ajouter la carte à la liste notes.
fin action

action vider:
  retirer "grotte visitée" de la liste notes.
  retirer 3 de la liste notes.
  retirer la carte de la liste notes.
fin action

action tester:
  si les notes contiennent "grotte visitée", dire "T-OUI".
  si les notes ne contiennent pas "grotte visitée", dire "T-NON".
  si les notes contiennent 3, dire "N-OUI".
  si les notes ne contiennent pas 3, dire "N-NON".
  si les notes contiennent la carte, dire "C-OUI".
  si les notes ne contiennent pas la carte, dire "C-NON".
  si les notes contiennent "grotte bloquée", dire "X-OUI".
  si les notes contiennent 4, dire "X-OUI".
  si les notes contiennent la pomme, dire "X-OUI".
fin action

Le joueur est dans la salle.
`;

describe('[F138] Contient / retirer sur une liste mixte', () => {

  it('[F138-T001] la liste mixte contient le texte, le nombre et l’élément ajoutés (et pas les autres)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    ctx.com.executerCommande('remplir', false);
    expect(ctx.jeu.listes[0].classe).toBe(ClassesRacines.ListeMixte);
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('T-OUIN-OUIC-OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F138-T002] retirer chaque type d’une liste mixte ; la liste redevient vide', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    ctx.com.executerCommande('remplir', false);
    ctx.com.executerCommande('vider', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('T-NONN-NONC-NON');
    expect(ctx.jeu.listes[0].vide).toBeTrue();
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
