import { commencerExempleWiki } from "./exemples-wiki-utils";

/**
 * Exemples du tutoriel « Le Cirque Étoile » (ressources/scenarios/exemples/wiki/tuto-cirque/),
 * chargés tels quels depuis les fichiers.
 */

describe('Exemples wiki — tuto-cirque', () => {

  describe('07_c — le hochet itinérant d’Anatolette', () => {

    const CHEMIN = 'tuto-cirque/07_c_anatolette_temps.djn';

    function lieuDuHochet(ctx: any): string {
      const hochet = ctx.jeu.objets.find((o: any) => o.nom.startsWith('hochet'));
      return ctx.jeu.lieux.find((l: any) => l.id === hochet.position.cibleId)?.nom;
    }

    it('[F127-T001] une action quelconque garde sa sortie normale et le vent déplace le hochet', () => {
      const { ctx } = commencerExempleWiki(CHEMIN);
      const avant = lieuDuHochet(ctx);
      const sortie = ctx.com.executerCommande('sauter', false).sortie;
      expect(ctx.jeu.tamponErreurs).toEqual([]);
      expect(sortie).toContain('Vous sautez sur place.');
      expect(sortie).toContain('Une rafale de vent');
      expect(lieuDuHochet(ctx)).not.toEqual(avant);
    });

    it('[F127-T002] examiner ne déplace pas le hochet', () => {
      const { ctx } = commencerExempleWiki(CHEMIN);
      const avant = lieuDuHochet(ctx);
      const sortie = ctx.com.executerCommande('examiner le hochet à grelot', false).sortie;
      expect(sortie).not.toContain('Une rafale de vent');
      expect(lieuDuHochet(ctx)).toEqual(avant);
    });

    it('[F127-T003] le hochet fait le cycle place ternie → roulotte de Mucia → chapiteau du miroir', () => {
      const { ctx } = commencerExempleWiki(CHEMIN);
      const parcours = [lieuDuHochet(ctx)];
      for (let i = 0; i < 3; i++) {
        ctx.com.executerCommande('sauter', false);
        parcours.push(lieuDuHochet(ctx));
      }
      expect(parcours).toEqual(['place ternie', 'roulotte de mucia', 'chapiteau du miroir', 'place ternie']);
    });

  });

  describe('07_d — jeu complet (code de la page partie7_rires)', () => {

    it('[F127-T004] le hochet fait le cycle sur les 4 lieux du cirque-miroir', () => {
      const { ctx } = commencerExempleWiki('tuto-cirque/07_d_jeu_complet.djn');
      const hochet = ctx.jeu.objets.find(o => o.nom.startsWith('hochet'));
      const lieu = () => ctx.jeu.lieux.find(l => l.id === hochet.position.cibleId)?.nom;
      const parcours = [lieu()];
      for (let i = 0; i < 4; i++) {
        ctx.com.executerCommande('sauter', false);
        parcours.push(lieu());
      }
      expect(ctx.jeu.tamponErreurs).toEqual([]);
      expect(parcours).toEqual(['place ternie', 'roulotte de petunie', 'roulotte de mucia', 'chapiteau du miroir', 'place ternie']);
    });

  });

});
