// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F144] GENRE (f)/(m) AVANT L’ÉPITHÈTE (issue #273)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « L’épée (f) en bronze est un objet » ≡ « L’épée en bronze (f) est un objet ».

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { Genre } from "../models/commun/genre.enum";

function objets(declarations: string): { messages: string[], objets: string[] } {
  const rc = CompilateurV8.analyserScenarioEtActions(`La salle est un lieu.\n${declarations}\nLe joueur est dans la salle.`, '', false);
  const jeu = Generateur.genererJeu(rc);
  return {
    messages: rc.messages.map(m => m.titre),
    objets: jeu.objets
      .filter(o => o.nom !== 'joueur' && o.nom !== 'inventaire')
      .map(o => `${o.intitule.nomEpithete}:${o.genre === Genre.f ? 'f' : 'm'}:${o.position?.cibleId === jeu.lieux[0].id ? 'salle' : '?'}`),
  };
}

describe('[F144] Genre (f)/(m) avant l’épithète', () => {

  it('[F144-T001] « L’épée (f) en bronze est un objet dans la salle »', () => {
    expect(objets('L’épée (f) en bronze est un objet dans la salle.')).toEqual({ messages: [], objets: ['épée en bronze:f:salle'] });
  });

  it('[F144-T002] épithète simple : « Le vase (m) bleu », « L’arc (m) long »', () => {
    expect(objets('Le vase (m) bleu est un objet dans la salle.\nL’arc (m) long est un objet dans la salle.'))
      .toEqual({ messages: [], objets: ['vase bleu:m:salle', 'arc long:m:salle'] });
  });

  it('[F144-T003] support : « La table (f) en chêne est un support dans la salle »', () => {
    expect(objets('La table (f) en chêne est un support dans la salle.')).toEqual({ messages: [], objets: ['table en chêne:f:salle'] });
  });

  it('[F144-T004] non-régression : genre en fin de groupe, genre sans épithète', () => {
    expect(objets('L’épée en bronze (f) est un objet dans la salle.\nL’étoile (f) est un objet dans la salle.'))
      .toEqual({ messages: [], objets: ['épée en bronze:f:salle', 'étoile:f:salle'] });
  });

});
