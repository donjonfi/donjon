import { CompilateurBeta, ExprReg, Generateur } from "../../public-api";

import { RechercheUtils } from "../utils/commun/recherche-utils";

describe('Compilateur − Nettoyer scénario', () => {

  it('Nettoyer: 1 phrase simple', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'La plante est un objet.'
    );
    expect(scenarioNettoye).toEqual("La plante est un objet.");
  });

  it('Nettoyer: 1 phrase avec un texte', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'La description de la plante est "Une plante".'
    );
    expect(scenarioNettoye).toEqual('La description de la plante est "Une plante".');
  });

  it('Nettoyer: 2 phrases, chacune sur une ligne différente', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'La plante set un objet.\nSa description est "Une plante".'
    );
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne vide', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'La plante set un objet.\n\nSa description est "Une plante".'
    );
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne vide, avec partie sans point', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'Le titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde"'
    );
    expect(scenarioNettoye).toEqual('Le titre du jeu est "Sauvons Noël !".' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'PARTIE "Description du monde".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne avec des espaces', () => {
    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(
      'La plante set un objet.\n      \nSa description est "Une plante".'
    );
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ' ' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

});

describe('Compilateur − Nombre de lignes', () => {

  it('Nombre de lignes: 1 phrase', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].ligne).toEqual(1);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, sans texte', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'La plante est un objet.\nElle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Nombre de lignes: 3 phrases, 1 par ligne, sans texte, avec 2 lignes vides', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n\nElle est fixée.\n\nElle est ici.'
    );
    expect(phrases).toHaveSize(3); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, sans texte, avec ligne espaces', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n    \nElle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
  });

  it('Nombre de lignes: 4 phrases, 1 par ligne, avec textes et lignes vides', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'Son titre est "a".\n\nLe chapeau est un objet.\n\nLe titre du jeu est "Sauvons Noël !".\n\nIl est ici.'
    );
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Nombre de lignes: 4 phrases, 1 par ligne, avec parties, textes et lignes vides', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'PARTIE "Informations sur le jeu".\n\nLe titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde".\n\nCHAPITRE "le joueur".'
    );
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Nombre de lignes: 2 phrases, sur même ligne, sans texte', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'La plante est un objet. Elle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, avec textes', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !".\nL’auteur du jeu est "JG".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Nombre de lignes: 2 phrases, sur même ligne, avec textes', () => {
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !". L’auteur du jeu est "JG".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

});

describe('Compilateur − Analyser scénario', () => {

  it('Analyser scénario avec 3 lieux, 1 objet, 1 action et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      'Le joueur peut sauter: dire "Vous sautez!". ' +
      'L’historique est une liste. '
      ;
    const resultatCompilation = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);

    expect(resultatCompilation).toBeDefined();
    expect(resultatCompilation.erreurs.length).toEqual(0); // aucune erreur
    expect(resultatCompilation.monde.lieux.length).toEqual(3); // les 3 lieux
    expect(resultatCompilation.monde.objets.length).toEqual(2); // le joueur + l’alligator
    expect(resultatCompilation.actions.length).toEqual(1); // action sauter
    expect(resultatCompilation.listes.length).toEqual(1); // liste historique

  });

});

describe('Compilateur − Analyser et Générer le jeu', () => {

  it('Compilation scénario avec 3 lieux, 1 objet, 1 action et 1 liste.', function () {
    let scenario =
      'La chambre est un lieu. ' +
      'La chambre à coucher rouge est un lieu à l’est de la chambre. ' +
      'La salle de bain est un lieu au nord de la chambre. ' +
      'L’alligator est dans la chambre. ' +
      'Le joueur peut sauter: dire "Vous sautez!". ' +
      'L’historique est une liste. '
      ;
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    expect(rc).toBeDefined();
    expect(rc.erreurs.length).toBe(0); // aucune erreur
    expect(rc.monde.lieux.length).toBe(3); // les 3 lieux
    expect(rc.monde.objets.length).toBe(1 + 1); // joueur + alligator
    expect(rc.actions.length).toBe(1); // action sauter
    expect(rc.listes.length).toBe(1); // liste historique

    const jeu = Generateur.genererJeu(rc);
    expect(jeu).toBeDefined();
    expect(jeu.tamponErreurs.length).toBe(0); // aucune erreur lors de la génération
    expect(jeu.lieux.length).toBe(3); // les 3 lieux
    expect(jeu.objets.length).toBe(2 + 1); // joueur et inventaire + alligator
    expect(jeu.actions.length).toBe(1); // action sauter
    expect(jeu.listes.length).toBe(1); // liste historique

    const chambre = jeu.lieux.find(x => x.nom == 'chambre');
    expect(chambre).toBeDefined();
    const chambreACoucher = jeu.lieux.find(x => x.nom == RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('chambre à coucher rouge'));
    expect(chambreACoucher).toBeDefined();
    const sdb = jeu.lieux.find(x => x.nom == 'salle de bain');
    expect(sdb).toBeDefined();

    // la chambre a 2 voisins (la chambre à coucher et la salle de bain)
    expect(chambre.voisins.length).toBe(2);
    // la chambre à coucher et la salle de bain ont 1 voisin (la chambre)
    expect(chambreACoucher.voisins.length).toBe(1);
    expect(sdb.voisins.length).toBe(1);

  });

});
