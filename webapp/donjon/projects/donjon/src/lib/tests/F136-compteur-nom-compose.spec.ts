// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F136] COMPTEUR AU NOM COMPOSÉ AFFICHABLE (issue #265)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « Le poids transporté est affiché. » : le compteur est retrouvé par son nom complet
// (attributs antéposés + nom + épithète), pas seulement par son nom (« poids »).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { TestUtils } from "../utils/test-utils";

function position(declaration: string, affichage: string): string | undefined {
  const ctx = TestUtils.genererEtCommencerLeJeu(`${declaration}\n${affichage}`);
  return ctx.jeu.compteurs[0].positionAffichage;
}

describe('[F136] Compteur au nom composé affichable', () => {

  it('[F136-T001] « Le poids transporté est affiché en haut à gauche. »', () => {
    expect(position('Le poids transporté est un compteur initialisé à 0.', 'Le poids transporté est affiché en haut à gauche.')).toEqual('haut-gauche');
  });

  it('[F136-T002] « Le score total est affiché. » (épithète)', () => {
    expect(position('Le score total est un compteur initialisé à 0.', 'Le score total est affiché.')).toEqual('haut-droite');
  });

  it('[F136-T003] « Le grand total est affiché en bas. » (attribut antéposé)', () => {
    expect(position('Le grand total est un compteur initialisé à 0.', 'Le grand total est affiché en bas.')).toEqual('bas-droite');
  });

  it('[F136-T004] « afficher le poids transporté dans le cartouche du bas. »', () => {
    expect(position('Le poids transporté est un compteur initialisé à 0.', 'afficher le poids transporté dans le cartouche du bas.')).toEqual('bas-droite');
  });

  it('[F136-T005] non-régression : « La bourse », « Les points de vie »', () => {
    expect(position('La bourse est un compteur initialisé à 100.', 'La bourse est affichée en bas à gauche.')).toEqual('bas-gauche');
    expect(position('Les points de vie sont un compteur initialisé à 3.', 'Les points de vie sont affichés.')).toEqual('haut-droite');
  });

  it('[F136-T006] non-régression : compteur inconnu → « Compteur inconnu »', () => {
    const rc = CompilateurV8.analyserScenarioSeul(`
Le poids transporté est un compteur initialisé à 0.
Le poids total est affiché.`, false);
    expect(rc.messages.map(m => m.titre)).toEqual(['Compteur inconnu']);
  });

});
