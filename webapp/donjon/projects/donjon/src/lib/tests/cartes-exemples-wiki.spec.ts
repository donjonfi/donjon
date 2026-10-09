import { commencerExempleWiki } from "./exemples-wiki-utils";

/**
 * Exemples « cartes » du wiki (ressources/scenarios/exemples/wiki/cartes/),
 * chargés tels quels depuis les fichiers.
 */

describe('Exemples wiki — cartes', () => {

  it('[F134-T001] 02_grille_3x3 : 9 salles distinctes, objets placés, déplacements dans la grille', () => {
    const { ctx } = commencerExempleWiki('cartes/02_grille_3x3.djn');
    expect(ctx.jeu.lieux.map(l => l.intitule.toString())).toEqual([
      'la salle a1', 'la salle a2', 'la salle a3',
      'la salle b1', 'la salle b2', 'la salle b3',
      'la salle c1', 'la salle c2', 'la salle c3',
    ]);
    const lieuDe = (nom: string) => {
      const o = ctx.jeu.objets.find(x => x.nom.startsWith(nom));
      return ctx.jeu.lieux.find(l => l.id === o.position?.cibleId)?.intitule.toString();
    };
    expect(lieuDe('clef')).toEqual('la salle a1');
    expect(lieuDe('fiole')).toEqual('la salle a3');
    expect(lieuDe('gardien')).toEqual('la salle b2');
    expect(lieuDe('rat')).toEqual('la salle c2');
    expect(lieuDe('coffre')).toEqual('la salle c3');

    // départ en b2 : nord → a2, est → a3 (la fiole)
    expect(ctx.com.executerCommande('aller vers le nord', false).sortie).toContain('Vous êtes dans la salle a2.');
    expect(ctx.com.executerCommande('aller vers l’est', false).sortie).toContain('fiole');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
