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

});
