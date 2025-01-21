import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenarioListePleine = `        
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  L’écranMachine est une liste.
  Elle contient "A" et "B".

  La machine est un objet dans le salon.
  Sa description est "Une machine.[si écranMachine est vide]L'écran principal est vide[sinon]L'écran principal affiche << [décrire écranMachine] >>[fin si].".
  `

  const scenarioListeVide = `        
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  L’écranMachine est une liste.

  La machine est un objet dans le salon.
  Sa description est "Une machine.[si écranMachine est vide]L'écran principal est vide[sinon]L'écran principal affiche << [décrire écranMachine] >>[fin si].".
  `

describe('Condition autours d’un décrire liste vide/remplie', () => {


  it('condition autours d’une liste remplie', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioListePleine, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu");

    let ctxCommande = ctxPartie.com.executerCommande("examiner machine");

    expect(ctxCommande.sortie)
      .withContext("La liste n’est pas vide et le contenu de l’écran doit être listé.")
      .toEqual(`Une machine.{E}L'écran principal affiche « {E}"A" et "B".{E} »{E}.{N}`);

  });


  it('condition autours d’une liste vide', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioListeVide, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu");

    let ctxCommande = ctxPartie.com.executerCommande("examiner machine");

    expect(ctxCommande.sortie)
      .withContext("La liste est vide, il n’y a rien a lister.")
      .toEqual(`Une machine.{E}L'écran principal est vide{E}.{N}`);

  });


});