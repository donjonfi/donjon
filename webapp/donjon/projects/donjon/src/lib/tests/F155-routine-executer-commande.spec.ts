// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F155] « EXÉCUTER LA COMMANDE » DANS UNE ROUTINE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Depuis les routines avec paramètres (#254), une routine s’exécute dans un nouveau contexte
// de tour, sans commande : « exécuter la commande » y plantait (contexteTour.commande undefined).

import { TestUtils } from "../utils/test-utils";

const scenario = `
La salle est un lieu.
La pomme est un objet vu dans la salle.
Le bouton est un objet vu dans la salle.

action saluer:
  dire "BONJOUR".
fin action

action nommer ceci:
  dire "NOM [intitulé ceci]".
fin action

routine accueillir:
  exécuter la commande "saluer".
fin routine

routine presenter:
  définitions:
    ceci est un objet.
  exécution:
    exécuter la commande "nommer [intitulé ceci]".
fin routine

action appuyer sur ceci:
  exécuter la routine accueillir.
fin action

action presser ceci:
  exécuter la commande "appuyer sur [intitulé ceci]".
fin action

action secouer ceci:
  exécuter la routine presenter avec la pomme.
fin action

Le joueur est dans la salle.
`;

describe('[F155] « exécuter la commande » dans une routine', () => {

  it('[F155-T001] routine appelée par une action', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('appuyer sur le bouton', false).sortie).toContain('BONJOUR');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T002] routine appelée par une commande elle-même exécutée par une action', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('presser le bouton', false).sortie).toContain('BONJOUR');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T003] routine avec paramètre : balise dans la commande', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.com.executerCommande('secouer la pomme', false).sortie).toContain('NOM la pomme');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
