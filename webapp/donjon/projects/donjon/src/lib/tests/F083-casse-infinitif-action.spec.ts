import { TestUtils } from "../utils/test-utils";

// [F083] Casse de l'infinitif d'une action : un infinitif d'action conserve la casse d'origine de
// l'auteur (« Recalibrer »). Les règles avant/après référencent une action par son verbe (mis en
// minuscule au parsing) : le déclenchement doit matcher indépendamment de la casse — sinon une
// règle « après Recalibrer » ne se déclenche jamais pour l'action « Recalibrer ».

describe('Casse de l’infinitif d’action — règles avant/après (F083)', () => {

  it('[F083-T001] une règle « après » se déclenche pour une action à infinitif majuscule', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.

action Recalibrer:
  phase épilogue:
    dire "Recalibrage en cours.".
fin action

règle après Recalibrer:
  dire "La machine ronronne.".
fin règle
`);
    // le déclenchement de la règle « après » prouve que « recalibrer » a matché l'action « Recalibrer »
    const sortie = ctx.com.executerCommande('recalibrer', false).sortie;
    expect(sortie).withContext(sortie).toContain('La machine ronronne.');
  });

  it('[F083-T002] une règle « avant » se déclenche pour une action à infinitif majuscule', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
La salle est un lieu.

action Recalibrer:
  phase épilogue:
    dire "Recalibrage en cours.".
fin action

règle avant Recalibrer:
  dire "Vérification préalable.".
fin règle
`);
    // le déclenchement de la règle « avant » prouve que « recalibrer » a matché l'action « Recalibrer »
    const sortie = ctx.com.executerCommande('recalibrer', false).sortie;
    expect(sortie).withContext(sortie).toContain('Vérification préalable.');
  });

});
