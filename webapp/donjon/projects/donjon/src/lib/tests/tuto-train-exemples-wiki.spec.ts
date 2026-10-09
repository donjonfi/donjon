import { commencerExempleWiki } from "./exemples-wiki-utils";

/**
 * Exemples du tutoriel « L’Express de 23h47 » (ressources/scenarios/exemples/wiki/tuto-train/),
 * chargés tels quels depuis les fichiers.
 */

describe('Exemples wiki — tuto-train', () => {

  describe('04_c — annuler une routine programmée', () => {

    const CHEMIN = 'tuto-train/04_c_routine_annulee.djn';

    it('[F128-T001] au démarrage, la routine « alarme » est programmée', () => {
      const { ctx, intro } = commencerExempleWiki(CHEMIN);
      expect(intro).toContain('Vous avez quinze secondes');
      expect(ctx.jeu.programmationsTemps.map(p => p.routine)).toEqual(['alarme']);
    });

    it('[F128-T002] tirer sur le levier annule la routine « alarme »', () => {
      const { ctx } = commencerExempleWiki(CHEMIN);
      const sortie = ctx.com.executerCommande('tirer sur le levier de sécurité', false).sortie;
      expect(ctx.jeu.tamponErreurs).toEqual([]);
      expect(sortie).toContain('l’alarme est désactivée à temps');
      expect(ctx.jeu.programmationsTemps).toEqual([]);
    });

  });

});
