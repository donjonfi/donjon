// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F151] DÉPLACER UN OBJET DANS LUI-MÊME OU DANS CE QU’IL CONTIENT
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « déplacer X dans X » ou un cycle (X dans Y alors que Y est dans X) faisait planter le moteur
// (getLieuObjet) et les objets disparaissaient. Désormais : rien n’est déplacé, erreur pour l’auteur.

import { TestUtils } from "../utils/test-utils";

const scenario = `
La salle est un lieu.
La boîte est un contenant ouvert et vu dans la salle.
Le coffre est un contenant ouvert et vu dans la salle.
La bourse est un contenant ouvert et vu dans le coffre.
La table est un support vu dans la salle.
action tester ceci avec cela:
  déplacer ceci dans cela.
  dire "OK".
fin action
action poser ceci avec cela:
  déplacer ceci sur cela.
  dire "OK".
fin action
action situer:
  dire "[si la boîte se trouve dans la salle]BOÎTE-SALLE[fin si] [si le coffre se trouve dans la salle]COFFRE-SALLE[fin si] [si la bourse se trouve dans le coffre]BOURSE-COFFRE[fin si] [si la table se trouve dans la salle]TABLE-SALLE[fin si]".
fin action
Le joueur est dans la salle.
`;

describe('[F151] Déplacer : pas d’objet dans lui-même ni de cycle', () => {

    it('[F151-T001] déplacer un objet dans lui-même : refusé, erreur auteur', () => {
        const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
        expect(() => ctx.com.executerCommande('tester la boîte avec la boîte', false)).not.toThrow();
        expect(ctx.jeu.tamponErreurs.length, JSON.stringify(ctx.jeu.tamponErreurs)).toBe(1);
        expect(ctx.jeu.tamponErreurs[0]).toContain('déplacer');
        expect(ctx.com.executerCommande('situer', false).sortie).toContain('BOÎTE-SALLE');
    });

    it('[F151-T002] déplacer un contenant dans un objet qu’il contient (indirectement) : refusé', () => {
        const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
        expect(() => ctx.com.executerCommande('tester le coffre avec la bourse', false)).not.toThrow();
        expect(ctx.jeu.tamponErreurs.length, JSON.stringify(ctx.jeu.tamponErreurs)).toBe(1);
        const sortie = ctx.com.executerCommande('situer', false).sortie;
        expect(sortie).toContain('COFFRE-SALLE');
        expect(sortie).toContain('BOURSE-COFFRE');
    });

    it('[F151-T003] poser un support sur lui-même : refusé', () => {
        const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
        expect(() => ctx.com.executerCommande('poser la table avec la table', false)).not.toThrow();
        expect(ctx.jeu.tamponErreurs.length, JSON.stringify(ctx.jeu.tamponErreurs)).toBe(1);
        expect(ctx.com.executerCommande('situer', false).sortie).toContain('TABLE-SALLE');
    });

    it('[F151-T004] déplacement légitime toujours possible', () => {
        const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
        ctx.com.executerCommande('tester la boîte avec le coffre', false);
        expect(ctx.jeu.tamponErreurs).toEqual([]);
        expect(ctx.com.executerCommande('situer', false).sortie).not.toContain('BOÎTE-SALLE');
    });

});
