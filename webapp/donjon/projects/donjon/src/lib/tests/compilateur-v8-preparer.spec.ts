import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ExprReg } from "../../public-api";

describe('Compilateur V8 − Préparer code source', () => {

  it('Préparer: 1 phrase simple', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante est un objet.'
    );
    expect(scenarioPrepare).toEqual("La plante est un objet.");
  });

  it('Préparer: 1 phrase avec un texte', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La description de la plante est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La description de la plante est "Une plante".');
  });

  it('Préparer: 2 phrases, chacune sur une ligne différente', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Préparer: 2 phrases, séparées par une ligne vide', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\n\nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne vide, avec partie sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'Le titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde"'
    );
    expect(scenarioPrepare).toEqual('Le titre du jeu est "Sauvons Noël !".' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'PARTIE "Description du monde".');
  });

  it('Nettoyer: 2 phrases, séparées par une ligne avec des espaces', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\n      \nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ' ' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('Préparer: fi si sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'fin si'
    );
    expect(scenarioPrepare).toEqual("fin si.");
  });

  it('Préparer: finsi sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'finsi'
    );
    expect(scenarioPrepare).toEqual('finsi.');
  });

  it('Préparer: [finsi] sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      '[finsi]'
    );
    expect(scenarioPrepare).toEqual('[finsi]');
  });

  it('Préparer: fi si|finsi sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'fin si finsi'
    );
    expect(scenarioPrepare).toEqual('fin si. finsi.');
  });

  it('Préparer: bloc si fi si sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'si le chateau est hanté:\n' +
      '  effacer les plantes.\n' +
      'sinon\n' +
      ' dire "Ok pour cette fois!".\n' +
      'fin si\n' +
      'dire "bla bla"\n'
    );
    expect(scenarioPrepare).toEqual(
      'si le chateau est hanté' + ExprReg.caractereDeuxPoints + ':' + ExprReg.caractereRetourLigne +
      ' effacer les plantes.' + ExprReg.caractereRetourLigne +
      'sinon' + ExprReg.caractereDeuxPoints + ':' + ExprReg.caractereRetourLigne +
      ' dire "Ok pour cette fois!".' + ExprReg.caractereRetourLigne +
      'fin si.' + ExprReg.caractereRetourLigne +
      'dire "bla bla"' + ExprReg.caractereRetourLigne
    );
  });

  
  it('Préparer: bloc choisir', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'dire "Boire ou conduire, il faut choisir !"\n' +
      'choisir\n' +
      '  choix "boire":\n' +
      '    dire "Vous ne conduirez donc pas !\n'+
      '  choix "conduire":\n' +
      '    dire "Vous ne boirez donc pas !"\n' +
      'fin choisir'
    );
    expect(scenarioPrepare).toEqual(
      'dire "Boire ou conduire, il faut choisir !"' + ExprReg.caractereRetourLigne +
      'choisir' + ExprReg.caractereDeuxPoints + ':' + ExprReg.caractereRetourLigne +
      ' choix "boire"' + ExprReg.caractereDeuxPoints + ':' + ExprReg.caractereRetourLigne +
      ' dire "Vous ne conduirez donc pas !' + ExprReg.caractereRetourLigne +
      ' choix "conduire"' + ExprReg.caractereDeuxPoints + ':' + ExprReg.caractereRetourLigne +
      ' dire "Vous ne boirez donc pas !"' + ExprReg.caractereRetourLigne +
      'fin choisir.'
    );
  });

});