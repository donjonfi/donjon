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

// « exécuter la routine X avec ceci/cela » : comme pour « exécuter l’action », ceci et cela
// désignent les éléments de l’appelant (code interne), ils ne sont pas cherchés par leur nom.
const scenarioArguments = `
La salle est un lieu.
La pomme est un objet vu dans la salle.
Le bouton est un objet vu dans la salle.

routine decrire:
  définitions:
    ceci est un objet.
  exécution:
    dire "OBJET [intitulé ceci]".
fin routine

routine rapprocher:
  définitions:
    ceci est un objet.
    cela est un objet.
  exécution:
    dire "PAIRE [intitulé ceci] ET [intitulé cela]".
fin routine

routine relayer:
  définitions:
    ceci est un objet.
  exécution:
    exécuter la routine decrire avec ceci.
fin routine

routine decrireLieu:
  définitions:
    ceci est un lieu.
  exécution:
    dire "LIEU [intitulé ceci]".
fin routine

action inspecter ceci:
  exécuter la routine decrire avec ceci.
fin action

action frotter ceci avec cela:
  exécuter la routine rapprocher avec ceci et cela.
fin action

action inverser ceci avec cela:
  exécuter la routine rapprocher avec cela et ceci.
fin action

action transmettre ceci:
  exécuter la routine relayer avec ceci.
fin action

action visiter ceci:
  exécuter la routine decrireLieu avec ceci.
fin action

action situer ceci:
  exécuter la routine decrireLieu avec ici.
fin action

Le joueur est dans la salle.
`;

describe('[F155] « exécuter la routine X avec ceci/cela »', () => {

  it('[F155-T010] ceci de l’action passé à la routine', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioArguments);
    expect(ctx.com.executerCommande('inspecter la pomme', false).sortie).toContain('OBJET la pomme');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T011] ceci et cela passés à la routine, dans l’ordre donné', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioArguments);
    expect(ctx.com.executerCommande('frotter la pomme avec le bouton', false).sortie).toContain('PAIRE la pomme ET le bouton');
    expect(ctx.com.executerCommande('inverser la pomme avec le bouton', false).sortie).toContain('PAIRE le bouton ET la pomme');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T012] ceci d’une routine passé à une autre routine', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioArguments);
    expect(ctx.com.executerCommande('transmettre la pomme', false).sortie).toContain('OBJET la pomme');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T013] ici passé à la routine', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioArguments);
    expect(ctx.com.executerCommande('situer la pomme', false).sortie).toContain('LIEU la salle');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F155-T014] ceci d’un type qui ne correspond pas : refusé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioArguments);
    expect(ctx.com.executerCommande('visiter la pomme', false).sortie).not.toContain('LIEU');
    expect(ctx.jeu.tamponErreurs.join(' ')).toContain('ne correspond aux arguments fournis');
  });

});
