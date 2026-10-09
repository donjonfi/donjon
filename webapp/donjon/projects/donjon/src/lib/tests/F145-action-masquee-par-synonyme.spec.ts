// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F145] ACTION MASQUÉE PAR UN SYNONYME D’UNE AUTRE ACTION (issue #274)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Un synonyme a moins de poids qu’une action définie pour le même infinitif :
// « action lancer ceci » l’emporte sur « interpréter lancer comme jeter » (actions de base).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

function commencer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
La balle est un objet dans la salle.
${scenario}
Le joueur est dans la salle.
`, actions, false);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.com.executerCommande('commencer le jeu', false);
  ctx.jeu.commence = true;
  ctx.com.executerCommande('prendre la balle', false);
  return ctx;
}

const ACTION_LANCER = `
action lancer ceci:
  dire "ACTION-LANCER".
fin action
`;

describe('[F145] Action masquée par un synonyme d’une autre action', () => {

  it('[F145-T001] l’action « lancer » de l’auteur est exécutée', () => {
    const ctx = commencer(ACTION_LANCER);
    expect(ctx.com.executerCommande('lancer la balle', false).sortie).toBe('ACTION-LANCER');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F145-T002] conseil : le synonyme est retiré de l’autre action', () => {
    const ctx = commencer(ACTION_LANCER);
    expect(ctx.jeu.tamponConseils).toEqual([
      '« lancer » était un synonyme de « jeter » : c’est l’action « lancer » qui est utilisée.',
    ]);
  });

  it('[F145-T003] « jeter » fonctionne toujours', () => {
    const ctx = commencer(ACTION_LANCER);
    expect(ctx.com.executerCommande('jeter la balle', false).sortie).not.toContain('ACTION-LANCER');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F145-T004] non-régression : sans action « lancer », « lancer » reste un synonyme de « jeter », sans conseil', () => {
    const ctx = commencer('');
    expect(ctx.jeu.tamponConseils).toEqual([]);
    const sortieLancer = ctx.com.executerCommande('lancer la balle', false).sortie;
    expect(sortieLancer).not.toContain('pas compris');
    expect(ctx.jeu.objets.find(o => o.nom === 'balle').position.cibleId).toBe(ctx.jeu.lieux[0].id);
  });

});
