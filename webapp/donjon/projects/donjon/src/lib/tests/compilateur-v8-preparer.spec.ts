import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ExprReg } from "../../public-api";

describe('Compilateur V8 − Préparer code source', () => {

  it('[F022-T001] Préparer: 1 phrase simple', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante est un objet.'
    );
    expect(scenarioPrepare).toEqual("La plante est un objet.");
  });

  it('[F022-T002] Préparer: 1 phrase avec un texte', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La description de la plante est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La description de la plante est "Une plante".');
  });

  it('[F022-T003] Préparer: 2 phrases, chacune sur une ligne différente', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('[F022-T004] Préparer: 2 phrases, séparées par une ligne vide', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\n\nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('[F022-T005] Nettoyer: 2 phrases, séparées par une ligne vide, avec partie sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'Le titre du jeu est "Sauvons Noël !".\n\nPARTIE "Description du monde"'
    );
    expect(scenarioPrepare).toEqual('Le titre du jeu est "Sauvons Noël !".' + ExprReg.caractereRetourLigne + ExprReg.caractereRetourLigne + 'PARTIE "Description du monde".');
  });

  it('[F022-T006] Nettoyer: 2 phrases, séparées par une ligne avec des espaces', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'La plante set un objet.\n      \nSa description est "Une plante".'
    );
    expect(scenarioPrepare).toEqual('La plante set un objet.' + ExprReg.caractereRetourLigne + ' ' + ExprReg.caractereRetourLigne + 'Sa description est "Une plante".');
  });

  it('[F022-T007] Préparer: fi si sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'fin si'
    );
    expect(scenarioPrepare).toEqual("fin si.");
  });

  it('[F022-T008] Préparer: finsi sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'finsi'
    );
    expect(scenarioPrepare).toEqual('finsi.');
  });

  it('[F022-T009] Préparer: [finsi] sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      '[finsi]'
    );
    expect(scenarioPrepare).toEqual('[finsi]');
  });

  it('[F022-T010] Préparer: fi si|finsi sans point', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'fin si finsi'
    );
    expect(scenarioPrepare).toEqual('fin si. finsi.');
  });

  it('[F022-T011] Préparer: bloc si fi si sans point', () => {
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
      'dire "bla bla".' + ExprReg.caractereRetourLigne
    );
  });

  
  it('[F022-T012] Préparer: bloc choisir', () => {
    const scenarioPrepare = CompilateurV8Utils.preparerCodeSource(
      'dire "Boire ou conduire, il faut choisir !"\n' +
      'choisir\n' +
      '  choix "boire":\n' +
      '    dire "Vous ne conduirez donc pas !"\n'+
      '  choix "conduire":\n' +
      '    dire "Vous ne boirez donc pas !"\n' +
      'fin choisir'
    );
    expect(scenarioPrepare).toEqual(
      'dire "Boire ou conduire, il faut choisir !".' + ExprReg.caractereRetourLigne +
      'choisir' + ExprReg.caractereDeuxPointsDouble + ExprReg.caractereRetourLigne +
      ' choix "boire"' + ExprReg.caractereDeuxPointsDouble + ExprReg.caractereRetourLigne +
      ' dire "Vous ne conduirez donc pas !".' + ExprReg.caractereRetourLigne +
      ' choix "conduire"' + ExprReg.caractereDeuxPointsDouble + ExprReg.caractereRetourLigne +
      ' dire "Vous ne boirez donc pas !".' + ExprReg.caractereRetourLigne +
      'fin choisir.'
    );
  });

  

});