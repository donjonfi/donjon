// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F133] NOMS DE LIEUX MAL DIFFÉRENCIÉS (issue #263)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// A. deux lieux qui ne diffèrent que par l’épithète ou un adjectif antéposé sont distincts ;
// B. un nom numérique (« salle 1 ») ne provoque pas d’exception ;
// C. le titre du lieu garde ses adjectifs antéposés.

import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { actions } from "./scenario_actions";

function commencer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  expect(rc.erreurs).toEqual([]);
  expect(rc.messages.map(m => m.titre)).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.jeu.commence = true;
  return ctx;
}

function intitulesLieux(ctx: ContextePartie): string[] {
  return ctx.jeu.lieux.map(l => l.intitule.toString());
}

describe('[F133] Noms de lieux', () => {

  it('[F133-T001] « salle a1 » / « salle a2 » : deux lieux distincts, objet et sortie corrects', () => {
    const ctx = commencer(`
La salle a1 est un lieu.
La salle a2 est un lieu à l'est de la salle a1.
La fiole est un objet dans la salle a2.
Le joueur se trouve dans la salle a1.`);
    expect(intitulesLieux(ctx)).toEqual(['la salle a1', 'la salle a2']);
    expect(ctx.com.executerCommande('aller vers l’est', false).sortie).toContain('Vous apercevez une fiole.');
    expect(ctx.com.executerCommande('prendre la fiole', false).sortie).toContain('La fiole a été ajoutée à votre inventaire.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F133-T002] « salon rouge » / « salon bleu » : deux lieux distincts', () => {
    const ctx = commencer(`
Le salon rouge est un lieu.
Le salon bleu est un lieu au sud du salon rouge.`);
    expect(intitulesLieux(ctx)).toEqual(['le salon rouge', 'le salon bleu']);
  });

  it('[F133-T003] « grand salon » / « petit salon » : deux lieux distincts', () => {
    const ctx = commencer(`
Le grand salon est un lieu.
Le petit salon est un lieu au nord du grand salon.`);
    expect(intitulesLieux(ctx)).toEqual(['le grand salon', 'le petit salon']);
  });

  it('[F133-T004] « salle 1 » / « salle 2 » : pas d’exception, déplacement possible', () => {
    const ctx = commencer(`
La salle 1 est un lieu.
La salle 2 est un lieu à l'est de la salle 1.
Le joueur se trouve dans la salle 1.`);
    expect(intitulesLieux(ctx)).toEqual(['la salle 1', 'la salle 2']);
    expect(ctx.com.executerCommande('aller vers l’est', false).sortie).toContain('Vous êtes dans la salle 2.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

  it('[F133-T005] le titre et les sorties gardent l’adjectif antéposé', () => {
    const ctx = commencer(`
Le grand salon est un lieu.
Le petit salon est un lieu au nord du grand salon.
Le joueur se trouve dans le grand salon.`);
    expect(ctx.com.executerCommande('regarder', false).sortie).toContain('{_{*Le grand salon*}_}');
    const auNord = ctx.com.executerCommande('aller vers le nord', false).sortie;
    expect(auNord).toContain('{_{*Le petit salon*}_}');
    expect(auNord).toContain('Le grand salon');
  });

  it('[F133-T006] un même lieu déclaré deux fois reste un seul lieu', () => {
    const ctx = commencer(`
La cuisine est un lieu.
Le jardin est un lieu.
La cuisine est un lieu au nord du jardin.`);
    expect(intitulesLieux(ctx)).toEqual(['la cuisine', 'le jardin']);
  });

  it('[F133-T007] grille de salles a1…c3 (exemple wiki cartes/02_grille_3x3) : objets placés', () => {
    const ctx = commencer(`
La salle a1 est un lieu.
La salle a2 est un lieu à l'est de la salle a1.
La salle a3 est un lieu à l'est de la salle a2.
La salle b1 est un lieu au sud de la salle a1.
La salle b2 est un lieu au sud de la salle a2.
La salle c2 est un lieu au sud de la salle b2.
La fiole est un objet dans la salle a3.
Le gardien est une personne dans la salle b2.
Le rat est un animal dans la salle c2.`);
    expect(ctx.jeu.lieux.length).toEqual(6);
    const lieuDe = (nom: string) => {
      const o = ctx.jeu.objets.find(x => x.nom === nom);
      return ctx.jeu.lieux.find(l => l.id === o.position?.cibleId)?.intitule.toString();
    };
    expect(lieuDe('fiole')).toEqual('la salle a3');
    expect(lieuDe('gardien')).toEqual('la salle b2');
    expect(lieuDe('rat')).toEqual('la salle c2');
  });

});
