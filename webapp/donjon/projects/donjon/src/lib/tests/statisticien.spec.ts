import { Statisticien } from "../utils/jeu/statisticien";

describe('Statisticien − Extraire textes affichables au joueur', () => {

  it('une instruction dire simple', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "Bonjour!".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(1);
    expect(textes[0]).toEqual('Bonjour!');
  });

  it('une instruction dire simple et commentaire', () => {
    const scenario = '' +
      'avant commencer le jeu:\n' +
      '  -- dire "commentaire"\n' +
      '  dire "Bonjour!".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(1);
    expect(textes[0]).toEqual('Bonjour!');
  });

  it('une instruction dire avec une condition', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "Bonjour[si le compteur est possédé] texte en plus [fin si]!".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(1);
    expect(textes[0]).toEqual('Bonjour texte en plus !');
  });

  it('une instruction dire avec du style', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "{+Bonjour !+}".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(1);
    expect(textes[0]).toEqual('Bonjour !');
  });

  it('une instruction dire avec sous texte (à ne pas compatibiliser)', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "Bonjour [si l’historique contient "chien"]Médor[sinon]Inconnu[fin si]!".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(1);
    expect(textes[0]).toEqual('Bonjour MédorInconnu!');
  });

  it('une instruction dire avec crochets conditionnels, ponctuation séparée, apostrophe', () => {
    const scenario = '' +
      'avant commencer le jeu: \n' +
      '  dire "L’hôpital". \n' +
      '  dire "Bon[si il est tard]soir[sinon]jour[fin si] [intitulé ceci]facteur !".';
    const textes = Statisticien.extraireTextesAffichablesAuJoueurNettoyes(scenario);
    expect(textes).toHaveSize(2);
    expect(textes[0]).toEqual('L’hôpital');
    expect(textes[1]).toEqual('Bonsoirjour facteur !');
  });

});

describe('Statisticien − Nombre de mots scénario', () => {

  it('une instruction dire simple', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "Bonjour".';
    const statistiques = Statisticien.calculerStatistiquesScenario(scenario);
    expect(statistiques.nbCaracteresAffichables).toEqual("Bonjour".length);
    expect(statistiques.nbMotsAffichables).toEqual(1);
  });

  it('une instruction dire avec du style', () => {
    const scenario = '' +
      'avant commencer le jeu: ' +
      '  dire "{+Bonjour+}".';
    const statistiques = Statisticien.calculerStatistiquesScenario(scenario);
    expect(statistiques.nbCaracteresAffichables).toEqual("Bonjour".length);
    expect(statistiques.nbMotsAffichables).toEqual(1);
  });

  it('une instruction dire avec crochets conditionnels, ponctuation séparée et apostrophe', () => {
    const scenario = '' +
      'avant commencer le jeu: \n' +
      '  dire "L’hôpital". \n' +
      '  dire "Bon[si il est tard]soir[sinon]jour[fin si] [intitulé ceci]facteur !".';
    const statistiques = Statisticien.calculerStatistiquesScenario(scenario);
    expect(statistiques.nbCaracteresAffichables).toEqual("L’hôpitalBonsoirjour facteur !".length);
    // le point de ponctuation ne compte pas comme un mot
    expect(statistiques.nbMotsAffichables).toEqual(4);
  });

});


describe('Statisticien − Nombre de mots sortie', () => {

  it('une instruction dire simple', () => {
    const sortie =
      '<h5>Nouveau jeu</h5>' +
      '<p>Un jeu de Anonyme</p>' +
      '<p><u><b>Le salon</b></u><br>' +
      'Vous êtes dans un salon.</p>' +
      '<p>Il n’y a pas de sortie.</p>' +
      '<p><span class="t-commande"> > nombre mots</span>';

    // A. retirer balises HTML
    const sortieNettoyee = Statisticien.nettoyerTexteSortie(sortie);

    expect(sortieNettoyee).toEqual(
      'Nouveau jeu' +
      '\nUn jeu de Anonyme' +
      '\nLe salon' +
      '\nVous êtes dans un salon.' +
      '\nIl n’y a pas de sortie.' +
      '\n > nombre mots'
    );

    // B. compter mots et caractères
    const nbMots = Statisticien.compterMotsTexte(sortieNettoyee);
    expect(nbMots).toEqual(22);
  });

});

