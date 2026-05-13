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

const scenarioApercuTiretStatique = `
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  La table basse est un support dans le salon.
  Son aperçu est "-".

  La chaise est un objet dans le salon.
  `;

const scenarioApercuTiretDynamique = `
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  La table basse est un support dans le salon.
  Son aperçu est "[1ère fois]-[2e fois]aperçu suivant.[fin choix]".

  La chaise est un objet dans le salon.
  `;

const scenarioApercuTiretPorte = `
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  Le couloir est un lieu à l’est du salon.
  La porte battante est une porte ouverte à l’est du salon.
  Son aperçu est "-".
  `;

const scenarioApercuTiretObstacle = `
  Le carrefour est un lieu.
  Sa description est "Un carrefour en pleine forêt.".

  La clairière est un lieu au nord du carrefour.

  Le grand rocher est un obstacle au nord du carrefour.
  Son aperçu est "-".
  `;

describe('Lister et décrire le contenu', () => {

  it('[F032-T001] lister le contenu d’un objet', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioListerContenu, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    let ctxCommande = ctxPartie.com.executerCommande("examiner table", false);

    expect(ctxCommande.sortie)
      .withContext("Le contenu de la table doit être listé. Le livre ne doit être mentionné qu’une fois.")
      .toEqual('Une table en bois couverte de livres sur laquelle est adossée une chaise.{N}');

    ctxCommande = ctxPartie.com.executerCommande("regarder", false);

      expect(ctxCommande.sortie)
        .withContext("La chaise et la table ne doivent pas être mentionnées 2x.")
        .toEqual('{_{*Le salon*}_}{n}Vous êtes dans un salon. Une chaise est adossée à la table.{N}{P}Il n’y a pas de sortie.{N}');

  });


  // Régression : un aperçu (statique ou dynamique) qui se résout à « - »
  // signifie « ne rien afficher ». Le tiret doit être interprété — pas rendu littéralement.

  it('[F032-T002] aperçu statique "-" sur un objet — la table basse n’apparaît pas dans la description du lieu', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioApercuTiretStatique, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCommande = ctxPartie.com.executerCommande("regarder", false);

    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » : la table basse ne doit pas être listée.")
      .not.toContain('table basse');
    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » : le tiret ne doit pas être rendu littéralement (encadré de balises {E}).")
      .not.toContain('{E}-{E}');
    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » : le tiret ne doit pas être rendu nu après un {U}.")
      .not.toContain('{U}-');
  });


  it('[F032-T003] aperçu dynamique résolvant à "-" (1ère fois) puis à un texte (2e fois) — masqué à la 1ère fois, visible à la 2e', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioApercuTiretDynamique, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    // 1ère fois : « commencer le jeu » déclenche la description initiale du lieu.
    // L’aperçu résout à « - » → table basse masquée, pas de tiret affiché.
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", false);
    expect(ctxCommande.sortie)
      .withContext("1ère fois : aperçu = « - », la table basse ne doit pas être listée.")
      .not.toContain('table basse');
    expect(ctxCommande.sortie)
      .withContext("1ère fois : le tiret entouré de balises de style ne doit pas être rendu.")
      .not.toContain('{E}-{E}');
    expect(ctxCommande.sortie)
      .withContext("1ère fois : aucun texte d’aperçu pour la table basse ne doit être ajouté.")
      .not.toContain('aperçu suivant.');

    // 2e fois : « regarder » → aperçu résolu à « aperçu suivant. » → affiché normalement.
    ctxCommande = ctxPartie.com.executerCommande("regarder", false);
    expect(ctxCommande.sortie)
      .withContext("2e fois : le texte d’aperçu doit être affiché.")
      .toContain('aperçu suivant.');
  });


  it('[F032-T004] aperçu "-" sur une porte d’un lieu — la porte n’apparaît pas dans la description du lieu', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioApercuTiretPorte, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCommande = ctxPartie.com.executerCommande("regarder", false);

    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » sur une porte : la porte ne doit pas être listée.")
      .not.toContain('porte battante');
    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » sur une porte : le tiret ne doit pas être rendu littéralement.")
      .not.toContain('{E}-{E}');
    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » sur une porte : pas de tiret nu après un {U}.")
      .not.toContain('{U}-');
  });


  it('[F032-T005] aperçu "-" sur un obstacle bloquant — pas de tiret dans le message de chemin bloqué', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioApercuTiretObstacle, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    // tenter d’aller dans la direction bloquée par l’obstacle (déclenche la balise [obstacle vers ceci])
    const ctxCommande = ctxPartie.com.executerCommande("aller au nord", false);

    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » sur un obstacle : le tiret entouré de balises de style ne doit pas être rendu.")
      .not.toContain('{E}-{E}');
    // Le tiret entouré d’espaces serait un rendu littéral incorrect du « - » suppressif.
    expect(ctxCommande.sortie)
      .withContext("Aperçu « - » sur un obstacle : pas de tiret isolé dans le message.")
      .not.toMatch(/(^|[\s>])-(\s|$)/);
  });


});