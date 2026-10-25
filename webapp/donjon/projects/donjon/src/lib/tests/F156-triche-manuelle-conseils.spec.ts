// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F156] TRICHE MANUELLE : CONSEILS AFFICHÉS ENTRE LES ÉTAPES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// La mise à jour de la graine (étape 'g') est appliquée sans conseil : c’était du bruit
// pour l’auteur, d’autant que beaucoup de jeux n’utilisent pas le hasard.
// Le déclenchement d’une routine (étape 'd') reste signalé.

import { LecteurComponent } from "../lecteur/lecteur.component";

/** Lecteur minimal pour exécuter `executerProchaineEtapeManuTriche` sur une suite d’étapes. */
function lecteurTriche(etapes: string[]) {
    const lecteur: any = Object.create(LecteurComponent.prototype);
    lecteur.manuTricheActif = true;
    lecteur.indexDerniereCommandeRestauration = -1;
    lecteur.jeu = { sauvegarde: { etapesSauvegarde: etapes }, tamponConseils: [] as string[] };
    lecteur.partie = { nouvelleGraineAleatoire: vi.fn() };
    return lecteur;
}

describe('[F156] Triche manuelle : conseils', () => {

    it('[F156-T001] graine : appliquée sans conseil, commande suivante proposée', () => {
        const lecteur = lecteurTriche(['g:0.42', 'c:regarder']);
        lecteur.executerProchaineEtapeManuTriche();
        expect(lecteur.partie.nouvelleGraineAleatoire).toHaveBeenCalledWith('0.42');
        expect(lecteur.commande).toBe('regarder');
        expect(lecteur.jeu.tamponConseils).toEqual([]);
    });

    it('[F156-T002] déclenchement de routine : toujours signalé', () => {
        const lecteur = lecteurTriche(['d:sonner', 'c:regarder']);
        lecteur.executerProchaineEtapeManuTriche();
        expect(lecteur.commande).toBe('regarder');
        expect(lecteur.jeu.tamponConseils).toEqual(['La routine « sonner » avait été déclenchée avant la prochaine commande']);
    });

});
