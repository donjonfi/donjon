// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F147] PAS DE CONSEIL « NI ÉLÉMENT NI ÉTAT » SUR « AFFICHER L’INVENTAIRE »
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Depuis la 3.12, « i » affichait le conseil « Ni élément ni état trouvé : « l’aide » »
// (action afficher : « si ceci est l’aide » avec ceci = l’inventaire), une fois de plus à chaque « i ».

import { CompilateurV8 } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

describe('[F147] Pas de conseil sur « afficher l’inventaire »', () => {

  it('[F147-T001] « afficher l’inventaire » répété : aucun conseil', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
Le joueur est dans la salle.
`, actions, false);
    const ctx = new ContextePartie(Generateur.genererJeu(rc));
    ctx.com.executerCommande('commencer le jeu', false);
    ctx.jeu.tamponConseils.length = 0;

    const conseilsParCommande: string[][] = [];
    for (let i = 0; i < 3; i++) {
      const sortie = ctx.com.executerCommande('afficher l’inventaire', false).sortie;
      expect(sortie).toContain('est vide.');
      conseilsParCommande.push(ctx.jeu.tamponConseils.splice(0));
    }
    expect(conseilsParCommande).toEqual([[], [], []]);
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F147-T002] sujet ceci/cela comparé à un mot : aucun conseil', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
La pomme est un objet dans la salle.
Le joueur est dans la salle.

action tester ceci:
  définitions:
    ceci est un intitulé.
  phase exécution:
    si ceci est l’aide ou ceci est rouge, dire "OUI".
    sinon dire "NON".
    fin si
fin action
`, actions, false);
    const ctx = new ContextePartie(Generateur.genererJeu(rc));
    ctx.com.executerCommande('commencer le jeu', false);
    ctx.jeu.tamponConseils.length = 0;
    expect(ctx.com.executerCommande('tester la pomme', false).sortie).toContain('NON');
    expect(ctx.jeu.tamponConseils).toEqual([]);
  });

});
