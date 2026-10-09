// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F140] BALISE [Le ceci] (issue #269)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// [Le ceci] / [L’ ceci] : article défini avec majuscule.
// Une propriété non reconnue sur un élément affiche @problème balise@ (au lieu d’une chaîne vide).

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

function frotter(balises: string, objet: string): { sortie: string, erreurs: string[] } {
  const rc = CompilateurV8.analyserScenarioEtActions(`
La salle est un lieu.
La valise est un objet dans la salle.
Le carnet est un objet dans la salle.
Les clés sont des objets dans la salle.
L’épée (f) est un objet dans la salle.
L’arc (m) est un objet dans la salle.

action frotter ceci:
  dire "${balises}".
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
  const sortie = ctx.com.executerCommande('frotter ' + objet, false).sortie;
  return { sortie, erreurs: ctx.jeu.tamponErreurs };
}

describe('[F140] Balise [Le ceci]', () => {

  it('[F140-T001] [Le ceci] : Le / La / Les', () => {
    expect(frotter('[Le ceci]|[le ceci]', 'la valise')).toEqual({ sortie: 'La|la', erreurs: [] });
    expect(frotter('[Le ceci]|[le ceci]', 'le carnet')).toEqual({ sortie: 'Le|le', erreurs: [] });
    expect(frotter('[Le ceci]|[le ceci]', 'les clés')).toEqual({ sortie: 'Les|les', erreurs: [] });
  });

  it('[F140-T002] [L’ ceci] : L’ / Les', () => {
    expect(frotter('[L’ ceci]épée|[l’ ceci]épée', 'l’épée')).toEqual({ sortie: 'L’épée|l’épée', erreurs: [] });
    expect(frotter("[L' ceci]arc|[l' ceci]arc", 'l’arc')).toEqual({ sortie: 'L’arc|l’arc', erreurs: [] });
    expect(frotter('[L’ ceci]clés', 'les clés')).toEqual({ sortie: 'Les clés', erreurs: [] });
  });

  it('[F140-T003] propriété non reconnue sur un élément : @problème balise@ + erreur', () => {
    const r = frotter('A[Lui ceci]B', 'la valise');
    expect(r.sortie).toBe('A{+@problème balise@+}B');
    expect(r.erreurs).toEqual(['Balise pas comprise ou propriété pas trouvée: [Lui ceci]']);
  });

});
