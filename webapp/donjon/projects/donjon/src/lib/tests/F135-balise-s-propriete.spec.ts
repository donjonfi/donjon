// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F135] [s X] AVEC UNE PROPRIÉTÉ NUMÉRIQUE (issue #264)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// [s X] gère un élément ([s ceci]), un compteur ([s score]) et désormais une propriété numérique
// ([s prix ceci], [s force du joueur]). Si rien ne correspond : « (élément « X » pas trouvé) ».

import { TestUtils } from "../utils/test-utils";
import { ContextePartie } from "../models/jouer/contexte-partie";

const SCENARIO = `
L'étal est un lieu.
Le joueur se trouve dans l'étal.
La force du joueur vaut 7.
Le score est un compteur initialisé à 3.
L'épée en bronze (f) est un objet vu ici.
Son prix vaut 45.
L'épée en or (f) est un objet vu ici.
Son prix vaut 1.
Les pommes sont des objets vus ici.

action évaluer ceci:
  dire "[prix ceci] pièce[s prix ceci] / [c prix ceci]".
fin action

action compter ceci:
  dire "objet[s ceci]".
fin action

action tester:
  dire "force[s force du joueur] / point[s score] / X[s truc inconnu]".
fin action`;

function jouer(ctx: ContextePartie, commande: string): string {
  return ctx.com.executerCommande(commande, false).sortie;
}

describe('[F135] [s X] avec une propriété numérique', () => {

  it('[F135-T001] [s prix ceci] : « s » pour 45, rien pour 1 ; [c prix ceci] donne la valeur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    expect(jouer(ctx, 'évaluer l’épée en bronze')).toContain('45 pièces / 45');
    expect(jouer(ctx, 'évaluer l’épée en or')).toContain('1 pièce / 1');
  });

  it('[F135-T002] [s force du joueur] ; non-régression [s score] (compteur)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = jouer(ctx, 'tester');
    expect(sortie).toContain('forces / points');
  });

  it('[F135-T003] non-régression : [s ceci] (élément au pluriel / au singulier)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    expect(jouer(ctx, 'compter les pommes')).toContain('objets');
    expect(jouer(ctx, 'compter l’épée en or')).toContain('objet');
    expect(jouer(ctx, 'compter l’épée en or')).not.toContain('objets');
  });

  it('[F135-T004] rien ne correspond : « (élément « X » pas trouvé) »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    expect(jouer(ctx, 'tester')).toContain('X(élément « truc inconnu » pas trouvé)');
  });

});
