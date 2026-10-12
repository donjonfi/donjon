// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F149] ACTIONS DE BASE : CORRECTIONS TROUVÉES PAR LE BALAYAGE F148
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

import { CompilateurV8 } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

function commencer(): ContextePartie {
  const ctx = new ContextePartie(Generateur.genererJeu(CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
La pomme est un objet dans la salle.
La boîte est un contenant ouvert dans la salle.
Le coffre est un contenant ouvert dans la salle.
La table est un support dans la salle.
La magicienne est une personne dans la salle.
Le joueur est dans la salle.
`, actions, false)));
  ctx.nouvelleGraineAleatoire();
  ctx.com.executerCommande('commencer le jeu', false);
  ctx.jeu.tamponConseils.length = 0;
  return ctx;
}

describe('[F149] Actions de base : corrections', () => {

  it('[F149-T001] embrasser ceci : vivant, objet, joueur', () => {
    const ctx = commencer();
    expect(ctx.com.executerCommande('embrasser la magicienne', false).sortie).toContain('Vous lui avez demandé son avis');
    expect(ctx.com.executerCommande('embrasser la pomme', false).sortie).toContain('Vous avez de drôles d’idées.');
    expect(ctx.com.executerCommande('embrasser moi', false).sortie).toMatch(/^Pardon/);
    expect(ctx.jeu.tamponConseils).toEqual([]);
  });

  it('[F149-T002] mettre un objet dans lui-même : refusé', () => {
    const ctx = commencer();
    let sortie = '';
    expect(() => sortie = ctx.com.executerCommande('mettre la boîte dans la boîte', false).sortie).not.toThrow();
    expect(sortie).toContain('Je ne peux pas la mettre dans elle-même.');
    expect(ctx.com.executerCommande('regarder', false).sortie).toContain('boîte');
  });

  it('[F149-T003] mettre un contenant dans ce qu’il contient : refusé', () => {
    const ctx = commencer();
    expect(ctx.com.executerCommande('mettre la boîte dans le coffre', false).sortie).toContain('C’est fait.');
    let sortie = '';
    expect(() => sortie = ctx.com.executerCommande('mettre le coffre dans la boîte', false).sortie).not.toThrow();
    expect(sortie).toContain('La boîte se trouve déjà dans le coffre.');
    expect(ctx.com.executerCommande('regarder', false).sortie).toContain('coffre');
  });

});
