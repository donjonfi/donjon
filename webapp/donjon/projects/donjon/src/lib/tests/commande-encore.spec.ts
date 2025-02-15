import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenario = `        
Le salon est un lieu.
La table est un support dans le salon.
`;


describe('Test de l’action répéter (la dernière commande)', () => {

  it('répéter la dernière commande', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", false);
    ctxCommande = ctxPartie.com.executerCommande("examiner la table", false);
    expect(ctxCommande.sortie).toEqual("C’est une table.{N}Il n’y a rien de particulier dessus.{N}");
    ctxCommande = ctxPartie.com.executerCommande("répéter la dernière commande", false);
    expect(ctxCommande.sortie).toEqual("C’est une table.{N}Il n’y a rien de particulier dessus.{N}");
    ctxCommande = ctxPartie.com.executerCommande("répéter la dernière commande", false);
    expect(ctxCommande.sortie).toEqual("C’est une table.{N}Il n’y a rien de particulier dessus.{N}");
    ctxCommande = ctxPartie.com.executerCommande("prendre la table", false);
    expect(ctxCommande.sortie).toEqual("Elle est fixée.{N}");
    ctxCommande = ctxPartie.com.executerCommande("répéter la dernière commande", false);
    expect(ctxCommande.sortie).toEqual("Elle est fixée.{N}");
    ctxCommande = ctxPartie.com.executerCommande("répéter la dernière commande", false);
    expect(ctxCommande.sortie).toEqual("Elle est fixée.{N}");

  });

});
