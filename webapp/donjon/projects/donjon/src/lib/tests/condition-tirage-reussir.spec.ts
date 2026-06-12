import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Non-régression : la condition « si un tirage à X chance(s) sur Y réussit/échoue »
// était inversée à cause d'une coquille de regex (/résussi/ au lieu de /réussi/) dans
// analyseur.condition.ts → la négation valait toujours « pas », donc « réussit » se
// comportait comme « échoue ». « 1 chance sur 1 » rend l'issue certaine.
describe('Condition — tirage « réussit » / « échoue »', () => {

  const tenter = (corps: string) => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + corps);
    return ctx.com.executerCommande('tenter', false).sortie;
  };

  it('[F061-T001] « réussit » avec 1 chance sur 1 est toujours vrai', () => {
    const s = tenter(`
Le casino est un lieu.
action tenter:
  si un tirage à 1 chance sur 1 réussit, dire "REUSSITE.".
fin action`);
    expect(s).toContain('REUSSITE');
  });

  it('[F061-T002] « échoue » avec 1 chance sur 1 est toujours faux', () => {
    const s = tenter(`
Le casino est un lieu.
action tenter:
  si un tirage à 1 chance sur 1 échoue, dire "ECHEC.".
fin action`);
    expect(s).not.toContain('ECHEC');
  });

});
