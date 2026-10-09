// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F146] CONDITION DE POSITION : LA PRÉPOSITION EST VÉRIFIÉE (issue #275)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « si X est/se trouve dans|sur|sous Y » : vrai seulement si X est rattaché à Y avec CETTE préposition.

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

function commencer(): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
Le tapis est un support dans la salle.
La clé est un objet sur le tapis.
La pièce est un objet sous le tapis.
La boîte est un contenant ouvert dans la salle.
La bille est un objet dans la boîte.
La pomme est un objet dans la salle.

action tester ceci:
  si ceci est dans le tapis:
    dire "[[est-dans]]".
  fin si
  si ceci est sur le tapis:
    dire "[[est-sur]]".
  fin si
  si ceci est sous le tapis:
    dire "[[est-sous]]".
  fin si
  si ceci se trouve dans le tapis:
    dire "[[st-dans]]".
  fin si
  si ceci se trouve sur le tapis:
    dire "[[st-sur]]".
  fin si
  si ceci se trouve sous le tapis:
    dire "[[st-sous]]".
  fin si
  si ceci n’est pas sous le tapis:
    dire "[[pas-sous]]".
  fin si
  si ceci est dans la boîte:
    dire "[[boite-dans]]".
  fin si
  si ceci est sur la boîte:
    dire "[[boite-sur]]".
  fin si
  si ceci est dans la salle:
    dire "[[salle-dans]]".
  fin si
  si ceci se trouve dans l’inventaire:
    dire "[[inventaire]]".
  fin si
fin action

Le joueur est dans la salle.
`, actions, false);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.com.executerCommande('commencer le jeu', false);
  ctx.jeu.commence = true;
  ctx.com.executerCommande('regarder', false);
  ctx.com.executerCommande('examiner le tapis', false);
  ctx.com.executerCommande('regarder sous le tapis', false);
  ctx.com.executerCommande('examiner la boîte', false);
  return ctx;
}

function marqueurs(ctx: ContextePartie, commande: string): string {
  const sortie = ctx.com.executerCommande(commande, false).sortie;
  return (sortie.match(/\[[a-z-]+\]/g) ?? []).map(m => m.slice(1, -1)).join(' ');
}

describe('[F146] Condition de position : la préposition est vérifiée', () => {

  it('[F146-T001] objet SUR le tapis', () => {
    const ctx = commencer();
    expect(marqueurs(ctx, 'tester la clé')).toBe('est-sur st-sur pas-sous');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F146-T002] objet SOUS le tapis', () => {
    const ctx = commencer();
    expect(marqueurs(ctx, 'tester la pièce')).toBe('est-sous st-sous');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F146-T003] objet DANS un contenant, DANS un lieu', () => {
    const ctx = commencer();
    expect(marqueurs(ctx, 'tester la bille')).toBe('pas-sous boite-dans');
    expect(marqueurs(ctx, 'tester la pomme')).toBe('pas-sous salle-dans');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F146-T004] objet dans l’inventaire', () => {
    const ctx = commencer();
    ctx.com.executerCommande('prendre la pomme', false);
    expect(marqueurs(ctx, 'tester la pomme')).toBe('pas-sous inventaire');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
