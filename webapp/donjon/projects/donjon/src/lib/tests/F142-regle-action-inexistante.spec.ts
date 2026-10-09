// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F142] RÈGLE SUR UNE ACTION INEXISTANTE : CONSEIL (issue #271)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « règle après laisser un objet » alors que l’action « laisser » n’existe pas : conseil à l’auteur.

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

function conseils(regles: string): string[] {
  const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
La cave est un lieu en bas de la salle.
La pomme est un objet dans la salle.
${regles}
Le joueur est dans la salle.
`, actions, false);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`)).toEqual([]);
  return Generateur.genererJeu(rc).tamponConseils;
}

describe('[F142] Règle sur une action inexistante', () => {

  it('[F142-T001] règle après sur une action inexistante : conseil', () => {
    expect(conseils(`règle après laisser un objet:\n  dire "x".\nfin règle`)).toEqual([
      '« règle après laisser un objet » : « laisser » ne correspond à aucune action du jeu — cette règle ne sera jamais déclenchée.',
    ]);
  });

  it('[F142-T002] règle avant, déclencheurs combinés : seul le verbe inconnu est signalé', () => {
    expect(conseils(`règle avant examiner la pomme ou bidouiller la pomme:\n  dire "x".\nfin règle`)).toEqual([
      '« règle avant bidouiller la pomme » : « bidouiller » ne correspond à aucune action du jeu — cette règle ne sera jamais déclenchée.',
    ]);
  });

  it('[F142-T003] pas de conseil : action existante, synonyme, commencer le jeu, déplacement', () => {
    expect(conseils(`
règle avant commencer le jeu:
  dire "x".
fin règle
règle après prendre un objet:
  dire "x".
fin règle
règle après déposer la pomme:
  dire "x".
fin règle
règle après aller dans la cave:
  dire "x".
fin règle
`)).toEqual([]);
  });

  it('[F142-T004] pas de conseil : règle après une action quelconque', () => {
    expect(conseils(`règle après une action quelconque:\n  dire "x".\nfin règle`)).toEqual([]);
  });

  it('[F142-T005] commandes de base désactivées : pas de règle « afficher aide » injectée, mais conseil pour les règles de l’auteur', () => {
    const scenarioSansBase = (regles: string) => {
      const rc = CompilateurV8.analyserScenarioEtActions(`Désactiver les commandes de base.\nLa salle est un lieu.\naction psalmodier:\n  dire "x".\nfin action\n${regles}`, actions, false);
      return Generateur.genererJeu(rc).tamponConseils;
    };
    expect(scenarioSansBase('')).toEqual([]);
    expect(scenarioSansBase(`règle après prendre un objet:\n  dire "x".\nfin règle`)).toEqual([
      '« règle après prendre un objet » : « prendre » ne correspond à aucune action du jeu — cette règle ne sera jamais déclenchée.',
    ]);
  });

});
