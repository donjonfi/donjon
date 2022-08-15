import { AnalyseurV8Utils, ObligatoireFacultatif } from "../utils/compilation/analyseur/analyseur-v8.utils";

import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ERoutine } from "../models/compilateur/routine";
import { ExprReg } from "../utils/compilation/expr-reg";

describe('testerEtiquette', () => {

  it('sinon: La table est un support grand et opaque dans la salle.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La table est un support grand et opaque dans la salle.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeUndefined();
  });

  it('sinon facultatif: sinon', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon facultatif: sinon:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[0], ObligatoireFacultatif.facultatif);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon obligatoire: sinon', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon'
    );
    // (les « : » sont rajoutés automatiquements après le sinon lors de la conversion en phrases)
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[0], ObligatoireFacultatif.obligatoire);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('');
  });

  it('sinon obligatoire: sinon:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'sinon:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[0], ObligatoireFacultatif.obligatoire);
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
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinon'], phrases[2], ObligatoireFacultatif.facultatif);
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
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['routine'], phrases[0], ObligatoireFacultatif.obligatoire);
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
    const resultat1 = AnalyseurV8Utils.chercherEtiquetteEtReste(['choix'], phrases[1], ObligatoireFacultatif.obligatoire);
    expect(resultat1).toBeDefined();
    expect(resultat1).toEqual('"voiture"');
    // [3] choix "vélo" ou "moto":
    expect(phrases[3].morceaux[0]).toEqual('choix');
    expect(phrases[3].morceaux[1]).toEqual(`${ExprReg.caractereDebutTexte}vélo${ExprReg.caractereFinTexte}`);
    expect(phrases[3].morceaux[2]).toEqual(`ou`);
    expect(phrases[3].morceaux[3]).toEqual(`${ExprReg.caractereDebutTexte}moto${ExprReg.caractereFinTexte}`);
    const resultat3 = AnalyseurV8Utils.chercherEtiquetteEtReste(['choix'], phrases[3], ObligatoireFacultatif.obligatoire);
    expect(resultat3).toBeDefined();
    expect(resultat3).toEqual('"vélo" ou "moto"');
  });

  it('règle: règle après manger le poulet :', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle après manger le poulet :'
    );
    // (les « : » sont rajoutés automatiquements après le sinon lors de la conversion en phrases)
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherEtiquetteEtReste(['règle'], phrases[0], ObligatoireFacultatif.obligatoire);
    expect(resultat).toBeDefined();
    expect(resultat).toEqual('après manger le poulet');
  });

});

describe('contientExactement1Mot', () => {

  it('""', () => {
    expect(AnalyseurV8Utils.contientExactement1Mot('')).toBeFalse();
  });

  it('"le chat"', () => {
    expect(AnalyseurV8Utils.contientExactement1Mot('le chat')).toBeFalse();
  });

  it('"maison"', () => {
    expect(AnalyseurV8Utils.contientExactement1Mot('maison')).toBeTrue();
  });

  it('"arc-en-ciel"', () => {
    expect(AnalyseurV8Utils.contientExactement1Mot('arc-en-ciel')).toBeTrue();
  });

});

describe('estFinRoutine', () => {

  it('fin routine', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'fin routine'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherFinRoutine(phrases[0]);
    expect(resultat).toBe(ERoutine.simple);
  });

  it('fin action.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'fin action.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherFinRoutine(phrases[0]);
    expect(resultat).toBe(ERoutine.action);
  });

  it('réaction du pirate concernant le trésor: dire "Je le veux!". fin réaction', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'réaction du pirate concernant le trésor:\n' +
      'dire "Je le veux!".\n' +
      'fin réaction\n'
    );
    expect(phrases).toHaveSize(3);
    // [0] réaction du pirate concernant le trésor:
    const resultat0 = AnalyseurV8Utils.chercherFinRoutine(phrases[0]);
    expect(resultat0).toBeUndefined();
    // [2] fin réaction
    const resultat2 = AnalyseurV8Utils.chercherFinRoutine(phrases[2]);
    expect(resultat2).toBe(ERoutine.reaction);
  });

  it('règle avant aller dans un lieu: dire "Je vais me déplacer.". fin règle.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant aller dans un lieu: dire "Je vais me déplacer.". fin règle.\n'
    );
    expect(phrases).toHaveSize(3);
    // [1] dire je le veux
    const resultat1 = AnalyseurV8Utils.chercherFinRoutine(phrases[1]);
    expect(resultat1).toBeUndefined();
    // [2] fin règle.
    const resultat2 = AnalyseurV8Utils.chercherFinRoutine(phrases[2]);
    expect(resultat2).toBe(ERoutine.regle);
  });

});


describe('estDebutRoutine', () => {

  it('routine cloturerTransaction :', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'routine cloturerTransaction :'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherDebutRoutine(phrases[0]);
    expect(resultat).toBe(ERoutine.simple);
  });

  it('routine:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'routine:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherDebutRoutine(phrases[0]);
    expect(resultat).toBe(ERoutine.simple);
  });

  it('action sauter:', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action sauter:'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    const resultat = AnalyseurV8Utils.chercherDebutRoutine(phrases[0]);
    expect(resultat).toBe(ERoutine.action);
  });

  it('réaction du pirate concernant le trésor: dire "Je le veux!". fin réaction', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'réaction du pirate concernant le trésor:\n' +
      'dire "Je le veux!".\n' +
      'fin réaction\n'
    );
    expect(phrases).toHaveSize(3);
    // [0] réaction du pirate concernant le trésor:
    const resultat0 = AnalyseurV8Utils.chercherDebutRoutine(phrases[0]);
    expect(resultat0).toBe(ERoutine.reaction);
    // [1] dire "Je le veux!".
    const resultat1 = AnalyseurV8Utils.chercherDebutRoutine(phrases[1]);
    expect(resultat1).toBeUndefined();
    // [2] fin réaction
    const resultat2 = AnalyseurV8Utils.chercherDebutRoutine(phrases[2]);
    expect(resultat2).toBeUndefined();
  });

  it('règle avant aller dans un lieu: dire "Je vais me déplacer.". fin règle.', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant aller dans un lieu: dire "Je vais me déplacer.". fin règle.\n'
    );
    expect(phrases).toHaveSize(3);
    // [0] règle avant aller dans un lieu:
    const resultat0 = AnalyseurV8Utils.chercherDebutRoutine(phrases[0]);
    expect(resultat0).toBe(ERoutine.regle);
    // [1] dire je le veux
    const resultat1 = AnalyseurV8Utils.chercherDebutRoutine(phrases[1]);
    expect(resultat1).toBeUndefined();
    // [2] fin règle.
    const resultat2 = AnalyseurV8Utils.chercherDebutRoutine(phrases[2]);
    expect(resultat2).toBeUndefined();
  });

});