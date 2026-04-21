import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenario = `
La salle est un lieu.
La boîte est un objet ici.
`;

const regleAvantRefuser = scenario + `
règle avant prendre ceci:
  refuser "Défense de prendre quoi que ce soit.".
fin règle
`;

const regleAvantArreter = scenario + `
règle avant prendre ceci:
  dire "Je vais bloquer l'action.".
  arrêter l'action.
fin règle
`;

const regleAvantRefuserAction = scenario + `
règle avant prendre ceci:
  dire "Message séparé.".
  refuser l'action.
fin règle
`;

describe('refuser dans règle avant', () => {

  it('refuser "raison" arrête l\'action et affiche le message', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(regleAvantRefuser, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCommande = ctxPartie.com.executerCommande("prendre la boîte", false);
    expect(ctxCommande.sortie).toEqual("Défense de prendre quoi que ce soit.{N}");
  });

  it('refuser "raison" empêche l\'exécution de l\'action (objet non pris)', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(regleAvantRefuser, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);
    ctxPartie.com.executerCommande("prendre la boîte", false);

    const ctxInventaire = ctxPartie.com.executerCommande("inventaire", false);
    expect(ctxInventaire.sortie).not.toContain("boîte");
  });

  it('refuser l\'action arrête l\'action sans message propre (combiné avec dire)', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(regleAvantRefuserAction, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCommande = ctxPartie.com.executerCommande("prendre la boîte", false);
    expect(ctxCommande.sortie).toEqual("Message séparé.{N}");

    const ctxInventaire = ctxPartie.com.executerCommande("inventaire", false);
    expect(ctxInventaire.sortie).not.toContain("boîte");
  });

  it('arrêter l\'action dans règle avant fonctionne toujours (régression)', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(regleAvantArreter, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCommande = ctxPartie.com.executerCommande("prendre la boîte", false);
    expect(ctxCommande.sortie).toEqual("Je vais bloquer l'action.{N}");

    const ctxInventaire = ctxPartie.com.executerCommande("inventaire", false);
    expect(ctxInventaire.sortie).not.toContain("boîte");
  });

});
