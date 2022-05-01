import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ExprReg } from "../../public-api";

describe('Compilateur V8 − Convertir code source en phrases', () => {

  it('Phrases: 1 phrase', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].ligne).toEqual(1);
  });

  it('Phrases: 2 phrases, 1 par ligne, sans texte', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.\nElle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Phrases: 3 phrases, 1 par ligne, sans texte, avec 2 lignes vides', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n\nElle est fixée.\n\nElle est ici.'
    );
    expect(phrases).toHaveSize(3); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
  });

  it('Phrases: 2 phrases, 1 par ligne, sans texte, avec ligne espaces', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.\n    \nElle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
  });

  it('Phrases: 4 phrases, 1 par ligne, avec textes et lignes vides', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Son titre est "a".\n\nLe chapeau est un objet.\n\nLe titre du jeu est "Sauvons Noël !".\n\nIl est ici.'
    );
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Phrases: 4 phrases, 1 par ligne, avec parties, textes et lignes vides', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'PARTIE "Informations sur le jeu".\n\nLe titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde".\n\nCHAPITRE "le joueur".'
    );
    expect(phrases).toHaveSize(4); // 4 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(3);
    expect(phrases[2].ligne).toEqual(5);
    expect(phrases[3].ligne).toEqual(7);
  });

  it('Phrases: 2 phrases, sur même ligne, sans texte', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet. Elle est fixée.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

  it('Phrases: 2 phrases, 1 par ligne, avec textes', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !".\nL’auteur du jeu est "JG".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(2);
  });

  it('Phrases: 2 phrases, sur même ligne, avec textes', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Le titre du jeu est "Sauvons Noël !". L’auteur du jeu est "JG".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[1].ligne).toEqual(1);
  });

  it('Phrases: 2 phrases, sur même ligne, avec textes', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action créer: exécution: dire "C’est fait!".'
    );
    expect(phrases).toHaveSize(3); // 2 phrases
    // [0] action créer
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[0].phrase).toHaveSize(1);
    expect(phrases[0].phrase[0]).toEqual('action créer:');
    // [1] exécution
    expect(phrases[1].ligne).toEqual(1);
    expect(phrases[1].phrase).toHaveSize(1);
    expect(phrases[1].phrase[0]).toEqual('exécution:');
    // [2] dire "C’est fait!"
    expect(phrases[2].ligne).toEqual(1);
    expect(phrases[2].phrase).toHaveSize(2);
    expect(phrases[2].phrase[0]).toEqual('dire');
    expect(phrases[2].phrase[1]).toEqual(ExprReg.caractereDebutTexte + 'C’est fait!' + ExprReg.caractereFinTexte);
  });

  it('Phrases: 2 phrases, sur même ligne, avec textes', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant aller vers étang: si l’historique contient "natation": dire "Vous nagez !". sinon: dire "Vous ne savez pas nager !". fin si'
    );
    expect(phrases).toHaveSize(6); // 2 phrases
    // [0] règle avant aller vers étang
    expect(phrases[0].ligne).toEqual(1);
    expect(phrases[0].phrase).toHaveSize(1);
    expect(phrases[0].phrase[0]).toEqual('règle avant aller vers étang:');
    // [1] exécution
    expect(phrases[1].ligne).toEqual(1);
    expect(phrases[1].phrase).toHaveSize(3);
    expect(phrases[1].phrase[0]).toEqual('si l’historique contient');
    expect(phrases[1].phrase[1]).toEqual(ExprReg.caractereDebutTexte + 'natation' + ExprReg.caractereFinTexte);
    expect(phrases[1].phrase[2]).toEqual(':');
    // [2] dire "C’est fait!"
    expect(phrases[2].ligne).toEqual(1);
    expect(phrases[2].phrase).toHaveSize(2);
    expect(phrases[2].phrase[0]).toEqual('dire');
    expect(phrases[2].phrase[1]).toEqual(ExprReg.caractereDebutTexte + 'Vous nagez !' + ExprReg.caractereFinTexte);
    // [3] sinon
    expect(phrases[3].ligne).toEqual(1);
    expect(phrases[3].phrase).toHaveSize(1);
    expect(phrases[3].phrase[0]).toEqual('sinon:');
    // [4] dire "C’est fait!"
    expect(phrases[4].ligne).toEqual(1);
    expect(phrases[4].phrase).toHaveSize(2);
    expect(phrases[4].phrase[0]).toEqual('dire');
    expect(phrases[4].phrase[1]).toEqual(ExprReg.caractereDebutTexte + 'Vous ne savez pas nager !' + ExprReg.caractereFinTexte);
    // [5] sinon
    expect(phrases[5].ligne).toEqual(1);
    expect(phrases[5].phrase).toHaveSize(1);
    expect(phrases[5].phrase[0]).toEqual('fin si');

  });

});