// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F153] DÉSAMBIGUÏSATION : REPRENDRE LA PRÉPOSITION DU JOUEUR
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « Comment dois-je interpréter votre commande ? » : les choix proposés reprennent la
// préposition tapée par le joueur si l’action l’accepte (probable ou possible), sinon
// celle de l’en-tête de l’action ; « à le »/« de les »… sont contractés.

import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/** Harnais manuel (cf. F110-T004) : un scénario volontairement ambigu peut émettre un message du validateur. */
function commencer(scenario: string): ContextePartie {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);
    return ctxPartie;
}

/** Libellés des choix de la question posée (ceci, cela ou ceci+cela). */
function choix(ctxPartie: ContextePartie, commande: string): string[] {
    const ctxCom = ctxPartie.com.executerCommande(commande, false);
    expect(ctxCom.commandeValidee, 'commande ambiguë').toBeFalsy();
    const q = ctxCom.questions?.QcmCela ?? ctxCom.questions?.QcmCeci ?? ctxCom.questions?.QcmCeciEtCela;
    expect(q, 'question posée').toBeDefined();
    return q.Choix.map(c => c.valeurs[0].toString());
}

describe('[F153] Désambiguïsation : préposition du joueur', () => {

    const bougies = `
      Le salon est un lieu.
      La sauge est un objet dans le salon.
      La bougie blanche est un objet dans le salon.
      La bougie verte est un objet dans le salon.
    `;

    it('[F153-T001] « mettre sauge sur bougie » : les choix reprennent « sur »', () => {
        const libelles = choix(commencer(bougies), 'mettre sauge sur bougie');
        expect(libelles.length).toBe(2);
        libelles.forEach(l => {
            expect(l).toContain('sur {=la bougie');
            expect(l).not.toContain(' dans ');
        });
    });

    it('[F153-T002] ambiguïté sur ceci ET cela : « sur » repris', () => {
        const libelles = choix(commencer(`
          Le salon est un lieu.
          La sauge sèche est un objet dans le salon.
          La sauge fraîche est un objet dans le salon.
          La bougie blanche est un objet dans le salon.
          La bougie verte est un objet dans le salon.
        `), 'mettre sauge sur bougie');
        expect(libelles.length).toBe(4);
        libelles.forEach(l => expect(l).toContain(' sur {=la bougie'));
    });

    it('[F153-T003] préposition non acceptée par l’action : celle de l’en-tête', () => {
        const libelles = choix(commencer(bougies + `
          action coller ceci sur cela:
            définitions: ceci et cela sont des objets visibles.
            dire "Collé.".
          fin action
        `), 'coller sauge dans bougie');
        libelles.forEach(l => {
            expect(l).toContain('sur {=la bougie');
            expect(l).not.toContain(' dans ');
        });
    });

    it('[F153-T004] contraction « à le » → « au »', () => {
        const libelles = choix(commencer(`
          Le salon est un lieu.
          La pomme est un objet dans le salon.
          Le garde rouge est un objet dans le salon.
          Le garde bleu est un objet dans le salon.
          action tendre ceci à cela:
            définitions: ceci et cela sont des objets visibles.
            dire "Tendu.".
          fin action
        `), 'tendre pomme au garde');
        expect(libelles.length).toBe(2);
        libelles.forEach(l => {
            expect(l).toContain('au {=garde');
            expect(l).not.toContain('à {=le');
        });
    });

});
