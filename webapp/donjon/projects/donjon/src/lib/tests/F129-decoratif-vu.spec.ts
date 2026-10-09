// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F129] UN OBJET DÉCORATIF EST VU QUAND LE LIEU EST DÉCRIT (issue #260)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Comme un objet discret, un objet décoratif n’est pas listé dans la description du lieu,
// mais il doit être « vu » : le joueur peut l’examiner ou agir dessus.

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { actions } from "./scenario_actions";

const SCENARIO = `
La cabine de pilotage est un lieu.
Sa description est "Un voyant rouge clignote au-dessus du levier de sécurité.".
Le levier de sécurité est un objet décoratif dans la cabine de pilotage.
Sa description est "Un levier de bois cerclé de laiton.".

Le wagon-restaurant est un lieu au sud de la cabine de pilotage.
La nappe brodée est un objet décoratif dans le wagon-restaurant.
Sa description est "Une nappe aux motifs dorés.".

Le joueur se trouve dans la cabine de pilotage.`;

function commencer(): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(SCENARIO, actions, false);
  expect(rc.messages.map(m => m.titre)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.jeu.commence = true;
  ctx.com.executerCommande('regarder', false);
  return ctx;
}

describe('[F129] Objet décoratif vu', () => {

  it('[F129-T001] après « regarder », un objet décoratif du lieu peut être examiné', () => {
    const ctx = commencer();
    const sortie = ctx.com.executerCommande('examiner le levier de sécurité', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(sortie).toContain('Un levier de bois cerclé de laiton.');
  });

  it('[F129-T002] il ne peut toujours pas être pris', () => {
    const ctx = commencer();
    ctx.com.executerCommande('prendre le levier de sécurité', false);
    const levier = ctx.jeu.objets.find(o => o.nom.startsWith('levier'));
    expect(levier.position.cibleId).not.toEqual(ctx.jeu.joueur.id);
  });

  it('[F129-T003] un objet décoratif d’un autre lieu reste « pas encore vu »', () => {
    const ctx = commencer();
    const nappe = ctx.jeu.objets.find(o => o.nom.startsWith('nappe'));
    expect(ctx.jeu.etats.possedeEtatIdElement(nappe, ctx.jeu.etats.vuID)).toBeFalse();
  });

});
