import { TestUtils } from "../utils/test-utils";
import { ActionsUtils } from "../utils/jeu/actions-utils";
import { VerbesElementsUtils } from "../utils/jeu/tactile/verbes-elements-utils";

// [F082] Actions « masquées » : exclues des propositions faites au joueur (menu tactile +
// suggestions du correcteur automatique) tout en restant exécutables si tapées exactement.
// Deux formes : « Les actions masquées sont … » (liste) et « L'action X est masquée. ».

describe('Actions masquées (F082)', () => {

  // Deux actions personnalisées parallèles, toutes deux avec « ceci » (donc candidates au menu
  // tactile des objets) : « recalibrer » est masquée, « inspecter » ne l'est pas — contraste sur
  // toutes les surfaces.
  const SCENARIO = `
Le bureau est un lieu.
La borne est un objet dans le bureau.

action recalibrer ceci:
  définitions:
    ceci est un objet.
  phase épilogue:
    dire "Recalibrage de [ceci].".
fin action

action inspecter ceci:
  définitions:
    ceci est un objet.
  phase épilogue:
    dire "Vous inspectez [ceci].".
fin action

Les actions masquées sont recalibrer.
`;

  it('[F082-T001] la forme liste pose le flag masquee sur l’action visée (et pas sur les autres)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const deboguer = ctx.jeu.actions.find(a => a.infinitif === 'recalibrer');
    const inspecter = ctx.jeu.actions.find(a => a.infinitif === 'inspecter');
    expect(deboguer?.masquee).withContext('recalibrer doit être masquée').toBe(true);
    expect(inspecter?.masquee).withContext('inspecter ne doit pas être masquée').toBe(false);
  });

  it('[F082-T002] une action masquée est absente du menu tactile d’un élément (l’autre y est)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const borne = ctx.jeu.objets.find(o => o.nom === 'borne');
    const groupes = VerbesElementsUtils.listerGroupesVerbes(borne, ctx.jeu, ctx.eju);
    const infinitifs = groupes.map(g => g.infinitif);
    expect(infinitifs).withContext(infinitifs.join(', ')).not.toContain('recalibrer');
    expect(infinitifs).withContext(infinitifs.join(', ')).toContain('inspecter');
  });

  it('[F082-T003] le masque prime sur une déclaration « action courante »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO + `
Les actions courantes pour les objets sont recalibrer et inspecter.
`);
    const borne = ctx.jeu.objets.find(o => o.nom === 'borne');
    const infinitifs = VerbesElementsUtils.listerGroupesVerbes(borne, ctx.jeu, ctx.eju).map(g => g.infinitif);
    expect(infinitifs).withContext(infinitifs.join(', ')).not.toContain('recalibrer');
    expect(infinitifs).withContext(infinitifs.join(', ')).toContain('inspecter');
  });

  it('[F082-T004] le correcteur ne suggère pas une action masquée (mais suggère les autres)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const act = new ActionsUtils(ctx.jeu, false);
    // « recalibrar » (faute de frappe) ressemble à « recalibrer » (masquée) → ne doit pas être suggérée
    const resMasquee = act.chercherCandidatsActionSansControle('recalibrar', false, false, true, true);
    expect(resMasquee.verbesSimilaires).withContext(resMasquee.verbesSimilaires.join(', ')).not.toContain('recalibrer');
    // « inspceter » (faute de frappe) ressemble à « inspecter » (non masquée) → doit être suggérée
    const resVisible = act.chercherCandidatsActionSansControle('inspceter', false, false, true, true);
    expect(resVisible.verbesSimilaires).withContext(resVisible.verbesSimilaires.join(', ')).toContain('inspecter');

    // chemin réel joueur (commandeur) : une commande mal orthographiée propose les verbes
    // similaires via un QCM (questions.QcmInfinitif). L'action masquée ne doit jamais y figurer,
    // l'action visible si (preuve que le correcteur agit bien par ce chemin).
    ctx.com.executerCommande('regarder', false);
    const verbesProposes = (cmd: string): string[] => {
      const res = ctx.com.executerCommande(cmd, false);
      return (res.questions?.QcmInfinitif?.Choix ?? []).map(c => String(c.valeurs?.[0]));
    };
    expect(verbesProposes('inspceter la borne')).withContext('correcteur actif').toContain('inspecter');
    expect(verbesProposes('recalibrar la borne')).withContext('masquée jamais suggérée').not.toContain('recalibrer');
  });

  it('[F082-T005] une action masquée reste exécutable si elle est tapée exactement', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('recalibrer la borne', false).sortie;
    expect(sortie).withContext(sortie).toContain('Recalibrage de');
  });

  it('[F082-T006] la forme par-action « L’action X est masquée. » pose aussi le flag', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action recalibrer:
  phase épilogue:
    dire "Recalibrage.".
fin action

L'action recalibrer est masquée.
`);
    expect(ctx.jeu.actions.find(a => a.infinitif === 'recalibrer')?.masquee).toBe(true);
  });

  it('[F082-T007] masquer un infinitif inexistant émet un conseil (pas une erreur)', () => {
    const jeu = TestUtils.genererLeJeu(`
Le bureau est un lieu.
Les actions masquées sont voler.
`);
    expect(jeu.tamponConseils.some(c => c.includes('voler')))
      .withContext(jeu.tamponConseils.join(' | ')).toBe(true);
  });

  // Casse : un infinitif d'action conserve la casse d'origine de l'auteur (« Recalibrer ») ; le
  // masquage doit matcher indépendamment de la casse — la comparaison passe par la forme sans accent.
  const SCENARIO_MAJUSCULE = `
Le bureau est un lieu.

action Recalibrer:
  phase épilogue:
    dire "Recalibrage.".
fin action
`;

  it('[F082-T008] masquer une action à infinitif majuscule avec la même casse pose le flag', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO_MAJUSCULE + `
L'action Recalibrer est masquée.
`);
    const action = ctx.jeu.actions.find(a => a.infinitif === 'Recalibrer');
    expect(action).withContext('action Recalibrer présente').toBeTruthy();
    expect(action?.masquee).withContext('Recalibrer doit être masquée').toBe(true);
    expect(ctx.jeu.tamponConseils.some(c => c.includes('Recalibrer')))
      .withContext('aucun conseil « ne correspond à aucune action » ne doit être émis').toBe(false);
  });

  it('[F082-T009] masquer par-action avec une casse différente matche quand même', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO_MAJUSCULE + `
L'action recalibrer est masquée.
`);
    expect(ctx.jeu.actions.find(a => a.infinitif === 'Recalibrer')?.masquee)
      .withContext('casse divergente instruction/définition').toBe(true);
  });

  it('[F082-T010] la forme liste globale matche aussi une action à infinitif majuscule', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO_MAJUSCULE + `
Les actions masquées sont Recalibrer.
`);
    expect(ctx.jeu.actions.find(a => a.infinitif === 'Recalibrer')?.masquee)
      .withContext('forme liste globale, infinitif majuscule').toBe(true);
  });

  it('[F082-T011] une action à infinitif majuscule déclarée « action courante » est classée principale (sans faux conseil)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.
La borne est un objet dans le bureau.

action Recalibrer ceci:
  définitions:
    ceci est un objet.
  phase épilogue:
    dire "Recalibrage de [ceci].".
fin action

Les actions courantes pour les objets sont Recalibrer.
`);
    // pas de faux conseil « ne sera pas proposé » (site generateur : validation des actions tactiles)
    expect(ctx.jeu.tamponConseils.some(c => c.includes('Recalibrer')))
      .withContext(ctx.jeu.tamponConseils.join(' | ')).toBe(false);
    // la classification principale/secondaire matche malgré la casse
    const borne = ctx.jeu.objets.find(o => o.nom === 'borne');
    const groupe = VerbesElementsUtils.listerGroupesVerbes(borne, ctx.jeu, ctx.eju)
      .find(g => g.infinitif === 'Recalibrer');
    expect(groupe).withContext('le verbe doit être proposé').toBeTruthy();
    expect(groupe?.niveau).withContext('doit être classé principale').toBe('principale');
  });

});
