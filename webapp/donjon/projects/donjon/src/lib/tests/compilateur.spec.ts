import { Compilateur, ExprReg } from "../../public-api";

describe('Compilateur − Nettoyer scénario', () => {

  it('Nettoyer: 1 phrase simple', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'La plante est un objet.'
    );    
    expect(scenarioNettoye).toEqual("La plante est un objet.");
  });

  it('Nettoyer: 1 phrase avec un texte', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'La description de la plante est "Une plante".'
    );    
    expect(scenarioNettoye).toEqual('La description de la plante est "Une plante".');
  });

  it('Nettoyer: 2 phrases, chacune sur une ligne différente', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'La plante set un objet.\nSa description est "Une plante".'
    );    
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne vide', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'La plante set un objet.\n\nSa description est "Une plante".'
    );    
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne vide, avec partie sans point', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'Le titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde"'
    );    
    expect(scenarioNettoye).toEqual('Le titre du jeu est "Sauvons Noël !".' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'PARTIE "Description du monde".');
  });
  
  it('Nettoyer: 2 phrases, séparées par une ligne avec des espaces', () => {
    const scenarioNettoye = Compilateur.nettoyerCodeSource(
      'La plante set un objet.\n      \nSa description est "Une plante".'
    );    
    expect(scenarioNettoye).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ' ' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

});

describe('Compilateur − Nombre de lignes', () => {

  it('Nombre de lignes: 1 phrase', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );    
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].ligne).toEqual(1);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, sans texte', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'La plante est un objet.\nElle est fixée.'
    );    
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Nombre de lignes: 3 phrases, 1 par ligne, sans texte, avec 2 lignes vides', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n\nElle est fixée.\n\nElle est ici.'
    );    
    expect(phrases).toHaveSize(3); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, sans texte, avec ligne espaces', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n    \nElle est fixée.'
    );    
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
  });
  
  it('Nombre de lignes: 4 phrases, 1 par ligne, avec textes et lignes vides', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'Son titre est "a".\n\nLe chapeau est un objet.\n\nLe titre du jeu est "Sauvons Noël !".\n\nIl est ici.'
    );    
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Nombre de lignes: 4 phrases, 1 par ligne, avec parties, textes et lignes vides', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'PARTIE "Informations sur le jeu".\n\nLe titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde".\n\nCHAPITRE "le joueur".'
    );    
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Nombre de lignes: 2 phrases, sur même ligne, sans texte', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'La plante est un objet. Elle est fixée.'
    );    
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

  it('Nombre de lignes: 2 phrases, 1 par ligne, avec textes', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !".\nL’auteur du jeu est "JG".'
    );    
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Nombre de lignes: 2 phrases, sur même ligne, avec textes', () => {
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !". L’auteur du jeu est "JG".'
    );    
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

});