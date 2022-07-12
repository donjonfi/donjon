import { AnalyseurV8Utils, ObligatoireFacultatif } from "../utils/compilation/analyseur/analyseur-v8.utils";

import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ExprReg } from "../utils/compilation/expr-reg";

describe('testerEtiquette', () => {

  it('sinon: La table est un support grand et opaque dans la salle.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La table est un support grand et opaque dans la salle.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.testerEtiquette("sinon", phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeUndefined();
  });

  it('sinon facultatif: sinon', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.testerEtiquette('sinon', phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon facultatif: sinon:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.testerEtiquette('sinon', phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon obligatoire: sinon', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon'
    );
    // (les « : » sont rajoutés automatiquements après le sinon lors de la conversion en phrases)
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.testerEtiquette('sinon', phrases[0], ObligatoireFacultatif.obligatoire);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon obligatoire: sinon:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.testerEtiquette('sinon', phrases[0], ObligatoireFacultatif.obligatoire);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon: si le comte est présent: dire "ceci". sinon dire "cela".', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'si le comte est présent: dire "ceci". sinon dire "cela".'
    );
    expect(phrases).toHaveSize(4); // 4 phrases
    // [2] sinon => sinon: (les : sont ajoutés automatiquement par convertirCodeSourceEnPhrases)
    expect(phrases[2].morceaux[0]).toEqual('sinon:');
    const resultat = AnalyseurV8Utils.testerEtiquette('sinon', phrases[2], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('routine: Routine MaSuperRoutine: dire "Salut!".', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Routine MaSuperRoutine: dire "Salut!".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    // [0] Routine MaSuperRoutine:
    expect(phrases[0].morceaux[0]).toEqual('Routine MaSuperRoutine:');
    const resultat = AnalyseurV8Utils.testerEtiquette('routine', phrases[0], ObligatoireFacultatif.obligatoire);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('MaSuperRoutine');
  });

  it('choix: choisir: choix "voiture": dire "Voiture!". choix "vélo": dire "Vélo!". fin choisir Le vélo est un objet.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'choisir:\n' +
      '  choix "voiture":\n' +
      '    dire "Voiture!".\n' +
      '  choix "vélo" ou "moto":\n' +
      '    dire "Vélo ou moto!".\n' +
      'fin choisir\n' +
      'Le vélo est un objet.'
    );
    expect(phrases).toHaveSize(7); // 7 phrases
    // [1] choix "voiture":
    expect(phrases[1].morceaux[0]).toEqual('choix');
    expect(phrases[1].morceaux[1]).toEqual(`${ExprReg.caractereDebutTexte}voiture${ExprReg.caractereFinTexte}`);
    const resultat1 = AnalyseurV8Utils.testerEtiquette('choix', phrases[1], ObligatoireFacultatif.obligatoire);
    expect(resultat1).toBeDefined();
    expect(resultat1).toEqual('"voiture"');
    // [3] choix "vélo" ou "moto":
    expect(phrases[3].morceaux[0]).toEqual('choix');
    expect(phrases[3].morceaux[1]).toEqual(`${ExprReg.caractereDebutTexte}vélo${ExprReg.caractereFinTexte}`);
    expect(phrases[3].morceaux[2]).toEqual(`ou`);
    expect(phrases[3].morceaux[3]).toEqual(`${ExprReg.caractereDebutTexte}moto${ExprReg.caractereFinTexte}`);
    const resultat3 = AnalyseurV8Utils.testerEtiquette('choix', phrases[3], ObligatoireFacultatif.obligatoire);
    expect(resultat3).toBeDefined();
    expect(resultat3).toEqual('"vélo" ou "moto"');
  });

});