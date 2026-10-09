// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F126] UN OBJET DÉCORATIF EST FIXE (issue #259)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Plusieurs exemples du wiki écrivaient « objet décoratif fixé » (sans « et » : ligne non reconnue).
// Ils écrivent désormais « objet décoratif », car décoratif implique déjà fixe (dsl-02-elements.md).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

const SCENARIO = `
La cabine de pilotage est un lieu.
Sa description est "Une cabine étroite. Au-dessus du tableau de bord, le [@levier de sécurité].".
Le levier de sécurité est un objet décoratif dans la cabine de pilotage.
Le joueur est dans la cabine de pilotage.`;

function compilerAvecActions(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  expect(rc.messages.map(m => m.titre)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.jeu.commence = true;
  return ctx;
}

describe('[F126] Objet décoratif', () => {

  it('[F126-T001] « objet décoratif » : l’objet est décoratif ET fixe', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const levier = ctx.jeu.objets.find(o => o.nom.startsWith('levier'));
    expect(levier).toBeDefined();
    expect(ctx.jeu.etats.possedeEtatIdElement(levier, ctx.jeu.etats.decoratifID)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatIdElement(levier, ctx.jeu.etats.fixeID)).toBeTrue();
  });

  it('[F126-T002] un objet décoratif ne peut pas être pris', () => {
    const ctx = compilerAvecActions(SCENARIO);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('prendre le levier de sécurité', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    const levier = ctx.jeu.objets.find(o => o.nom.startsWith('levier'));
    expect(levier.position.cibleId).not.toEqual(ctx.jeu.joueur.id);
    expect(sortie).not.toContain('ajouté');
  });

  it('[F126-T004] un objet décoratif ne peut pas être déplacé (il est fixé)', () => {
    const ctx = compilerAvecActions(SCENARIO);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('déplacer le levier de sécurité', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(sortie).toContain('Il est fixé.');
  });

  it('[F126-T003] « objet décoratif et fixé » est reconnu (décoratif et fixe)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La cabine est un lieu.
Le levier est un objet décoratif et fixé dans la cabine.`);
    const levier = ctx.jeu.objets.find(o => o.nom === 'levier');
    expect(levier).toBeDefined();
    expect(ctx.jeu.etats.possedeEtatIdElement(levier, ctx.jeu.etats.decoratifID)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatIdElement(levier, ctx.jeu.etats.fixeID)).toBeTrue();
  });

});
