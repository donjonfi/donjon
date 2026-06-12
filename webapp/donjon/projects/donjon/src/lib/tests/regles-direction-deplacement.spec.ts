import { Abreviations } from "../utils/jeu/abreviations";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// [F075] Règles sur la direction d'un déplacement (« règle après aller vers le nord »).
// Le moteur remplace ceci par le lieu de destination (activerRemplacementDestinationDeplacements),
// mais l'évènement mémorise l'orientation (Evenement.orientationDeplacement) pour que les règles
// ciblant une direction se déclenchent aussi.

const BASE = `
Le salon est un lieu.
Le jardin est un lieu au nord du salon.
`;

describe('Règles sur direction de déplacement (F075)', () => {

  it('[F075-T001] règle « après aller vers le nord » déclenchée par « aller au nord »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
règle après aller vers le nord:
  dire "RÈGLE NORD DÉCLENCHÉE".
fin règle`);
    const sortie = ctx.com.executerCommande('aller au nord', false).sortie;
    expect(sortie).withContext(sortie).toContain('RÈGLE NORD DÉCLENCHÉE');
  });

  it('[F075-T002] déclenchée aussi par les synonymes « nord » et « n »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
Le verger est un lieu au nord du jardin.
règle après aller vers le nord:
  dire "RÈGLE NORD DÉCLENCHÉE".
fin règle`);
    // les raccourcis joueur (« nord », « n ») sont étendus par Abreviations dans le lecteur
    const cmd1 = Abreviations.obtenirCommandeComplete('nord', ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets);
    const sortie1 = ctx.com.executerCommande(cmd1, false).sortie;
    expect(sortie1).withContext(cmd1 + ' => ' + sortie1).toContain('RÈGLE NORD DÉCLENCHÉE');
    const cmd2 = Abreviations.obtenirCommandeComplete('n', ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets);
    const sortie2 = ctx.com.executerCommande(cmd2, false).sortie;
    expect(sortie2).withContext(cmd2 + ' => ' + sortie2).toContain('RÈGLE NORD DÉCLENCHÉE');
  });

  it('[F075-T003] règle « après aller dans le jardin » toujours déclenchée par « aller au nord »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
règle après aller dans le jardin:
  dire "RÈGLE JARDIN DÉCLENCHÉE".
fin règle`);
    const sortie = ctx.com.executerCommande('aller au nord', false).sortie;
    expect(sortie).withContext(sortie).toContain('RÈGLE JARDIN DÉCLENCHÉE');
  });

  it('[F075-T004] les deux règles (direction + lieu) se déclenchent toutes les deux', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
règle après aller vers le nord:
  dire "RÈGLE NORD DÉCLENCHÉE".
fin règle

règle après aller dans le jardin:
  dire "RÈGLE JARDIN DÉCLENCHÉE".
fin règle`);
    const sortie = ctx.com.executerCommande('aller au nord', false).sortie;
    expect(sortie).withContext(sortie).toContain('RÈGLE NORD DÉCLENCHÉE');
    expect(sortie).withContext(sortie).toContain('RÈGLE JARDIN DÉCLENCHÉE');
  });

  it('[F075-T005] une direction sans sortie ne déclenche pas la règle', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
règle après aller vers le sud:
  dire "RÈGLE SUD DÉCLENCHÉE".
fin règle`);
    const sortie = ctx.com.executerCommande('aller au sud', false).sortie;
    expect(sortie).withContext(sortie).not.toContain('RÈGLE SUD DÉCLENCHÉE');
    expect(sortie).withContext(sortie).toContain('Je ne peux pas aller par là.');
  });

  it('[F075-T006] la règle nord ne se déclenche pas pour un déplacement vers une autre direction', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
La cave est un lieu au sud du salon.
règle après aller vers le nord:
  dire "RÈGLE NORD DÉCLENCHÉE".
fin règle`);
    const sortie = ctx.com.executerCommande('aller au sud', false).sortie;
    expect(sortie).withContext(sortie).not.toContain('RÈGLE NORD DÉCLENCHÉE');
  });

  it('[F075-T007] « sortir » avec une seule sortie orientée au nord déclenche la règle nord', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASE + `
règle après aller vers le nord:
  dire "RÈGLE NORD DÉCLENCHÉE".
fin règle`);
    // « sortir » → « aller dehors » ; avec une seule sortie visible, le moteur réoriente
    // le déplacement vers cette sortie (ici le nord)
    const cmd = Abreviations.obtenirCommandeComplete('sortir', ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets);
    const sortie = ctx.com.executerCommande(cmd, false).sortie;
    expect(sortie).withContext(cmd + ' => ' + sortie).toContain('RÈGLE NORD DÉCLENCHÉE');
  });

});
