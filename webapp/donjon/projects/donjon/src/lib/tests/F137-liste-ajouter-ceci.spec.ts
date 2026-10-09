// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F137] AJOUTER / RETIRER CECI D’UNE LISTE (issue #266)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « ajouter ceci à la liste indices. » ajoute l’élément désigné par ceci (pas le texte « ceci »).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const SCENARIO = `
La salle est un lieu.
La carte de visite est un objet dans la salle.
La pomme est un objet dans la salle.
Les indices sont une liste.

règle après prendre un objet:
  ajouter ceci à la liste indices.
fin règle

règle après poser un objet:
  retirer ceci de la liste indices.
fin règle

action tester:
  si les indices contiennent la carte de visite:
    dire "CARTE-OUI".
  sinon
    dire "CARTE-NON".
  fin si
  si les indices contiennent la pomme:
    dire "POMME-OUI".
  sinon
    dire "POMME-NON".
  fin si
fin action

Le joueur est dans la salle.
`;

function commencer(): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(SCENARIO, actions, false);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.com.executerCommande('commencer le jeu', false);
  ctx.jeu.commence = true;
  return ctx;
}

describe('[F137] Ajouter / retirer ceci d’une liste', () => {

  it('[F137-T001] ajouter ceci à la liste : l’élément est dans la liste', () => {
    const ctx = commencer();
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('CARTE-NONPOMME-NON');
    ctx.com.executerCommande('prendre la carte de visite', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('CARTE-OUIPOMME-NON');
    expect(ctx.jeu.listes[0].contientTexte('ceci')).toBeFalse();
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F137-T002] deux objets ajoutés via ceci : les deux sont dans la liste', () => {
    const ctx = commencer();
    ctx.com.executerCommande('prendre la carte de visite', false);
    ctx.com.executerCommande('prendre la pomme', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('CARTE-OUIPOMME-OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F137-T003] retirer ceci de la liste : l’élément n’est plus dans la liste', () => {
    const ctx = commencer();
    ctx.com.executerCommande('prendre la carte de visite', false);
    ctx.com.executerCommande('prendre la pomme', false);
    ctx.com.executerCommande('poser la carte de visite', false);
    expect(ctx.com.executerCommande('tester', false).sortie).toBe('CARTE-NONPOMME-OUI');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});
