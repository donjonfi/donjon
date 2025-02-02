import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenarioListerContenu = `        
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon. Une chaise[#chaise] est adossée à la table.[#table]".

  La table est un support dans le salon.
  Sa description est "Une table en bois couverte de livres[#livre] sur laquelle est adossée une chaise.[#chaise]".

  La chaise est un objet dans le salon.
  Sa description est "Une chaise en bois.".

  Le livre est un objet sur la table.
  Sa description est "Un livre ancien.".
  `;

describe('Lister et décrire le contenu', () => {

  it('lister le contenu d’un objet', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioListerContenu, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu");

    let ctxCommande = ctxPartie.com.executerCommande("examiner table");

    expect(ctxCommande.sortie)
      .withContext("Le contenu de la table doit être listé. Le livre ne doit être mentionné qu’une fois.")
      .toEqual('Une table en bois couverte de livres sur laquelle est adossée une chaise.{N}');

    ctxCommande = ctxPartie.com.executerCommande("regarder");

      expect(ctxCommande.sortie)
        .withContext("La chaise et la table ne doivent pas être mentionnées 2x.")
        .toEqual('{_{*Le salon*}_}{n}Vous êtes dans un salon. Une chaise est adossée à la table.{N}{P}Il n’y a pas de sortie.{N}');

  });



});