import { commencerExempleWiki } from "./exemples-wiki-utils";

/**
 * Exemples des pages « référence » du wiki (ressources/scenarios/exemples/wiki/<thème>/),
 * chargés tels quels depuis les fichiers.
 */

describe('Exemples wiki — référence', () => {

  it('[F130-T001] texte/au_hasard : « jeter la bille » donne une des trois phrases, au hasard', () => {
    const { ctx } = commencerExempleWiki('texte/au_hasard.djn');
    const phrases = ['Vous atteignez la lucarne', 'Raté.', 'Bien essayé.'];
    const obtenues = new Set<string>();
    for (let i = 0; i < 15; i++) {
      const sortie = ctx.com.executerCommande('jeter la bille', false).sortie;
      const phrase = phrases.find(p => sortie.includes(p));
      expect(phrase).withContext(sortie).toBeDefined();
      obtenues.add(phrase);
    }
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(obtenues.size).toBeGreaterThan(1);
  });

  it('[F130-T002] proprietes/afficher_prix : « évaluer » affiche le prix et la couleur', () => {
    const { ctx } = commencerExempleWiki('proprietes/afficher_prix.djn');
    // « L’épée en bronze (f) » : féminin
    expect(ctx.com.executerCommande('regarder', false).sortie).toContain('une épée en bronze');
    const sortie = ctx.com.executerCommande('évaluer l’épée en bronze', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(sortie).toContain('coûte 45 pièce');
    expect(sortie).toContain('(Couleur : bronze.)');
  });

  it('[F130-T005] proprietes/soulever_poids : compare la force du joueur au poids de l’objet', () => {
    const { ctx } = commencerExempleWiki('proprietes/soulever_poids.djn');
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('soulever le sac', false).sortie).toContain('Vous soulevez le sac (force 7 ≥ poids 4).');
    expect(ctx.com.executerCommande('soulever l’enclume', false).sortie).toContain('L’enclume est trop lourde (20) pour vous (7).');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F130-T003] texte/accord_intitule : « inspecter » accorde l’intitulé', () => {
    const { ctx } = commencerExempleWiki('texte/accord_intitule.djn');
    expect(ctx.com.executerCommande('inspecter la porte', false).sortie).toContain('La porte est verrouillée.');
    expect(ctx.com.executerCommande('inspecter le coffre', false).sortie).toContain('Le coffre est verrouillé.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F130-T004] memoire/score_points_vie : « boire la potion de soin » rend 3 points de vie', () => {
    const { ctx } = commencerExempleWiki('memoire/score_points_vie.djn');
    const vie = () => ctx.jeu.compteurs.find(c => c.nom === 'vie').valeur;
    const avant = vie();
    const sortie = ctx.com.executerCommande('boire la potion de soin', false).sortie;
    expect(ctx.jeu.tamponErreurs).toEqual([]);
    expect(sortie).toContain('La potion vous revigore.');
    expect(vie()).toEqual(avant + 3);
  });

});
