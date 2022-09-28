import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Complément action TypeEtats − Epressions régulières', () => {

  it('C’est un objet possédé', () => {
    const result = ExprReg.rComplementActionTypeEtats.exec('C’est un objet possédé');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('un'); // un/une
    expect(result[2]).toEqual('objet'); // type
    expect(result[3]).toEqual('possédé'); // états requis
    expect(result[4]).toBeFalsy(); // états prioritaires
  });

  it('C’est un objet possédé ou disponible prioritairement visible', () => {
    const result = ExprReg.rComplementActionTypeEtats.exec('C’est un objet possédé ou disponible prioritairement visible');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('un'); // un/une
    expect(result[2]).toEqual('objet'); // type
    expect(result[3]).toEqual('possédé ou disponible'); // états requis
    expect(result[4]).toEqual('visible'); // états prioritaires
  });

  it('Il s’agit d’un lieu', () => {
    const result = ExprReg.rComplementActionTypeEtats.exec('Il s’agit d’un lieu');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('un'); // un/une
    expect(result[2]).toEqual('lieu'); // type
    expect(result[3]).toBeFalsy(); // états requis
    expect(result[4]).toBeFalsy(); // états prioritaires
  });

  it('Il s’agit d’une licorne petite et mignone prioritairement gentille ou amicale', () => {
    const result = ExprReg.rComplementActionTypeEtats.exec('Il s’agit d’une licorne petite et mignone prioritairement gentille ou amicale');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('une'); // un/une
    expect(result[2]).toEqual('licorne'); // type
    expect(result[3]).toEqual('petite et mignone'); // états requis
    expect(result[4]).toEqual('gentille ou amicale'); // états prioritaires
  });

});

describe('Complément action EstSoitNiPas − Epressions régulières', () => {

  it('Ceci est un lieu', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('Ceci est un lieu');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Ceci '); // ceci/cela
    expect(result[2]).toBeFalsy(); // soit|ni|pas
    expect(result[3]).toEqual('un lieu'); // suite
  });

  it('Cela est un objet visible et accessible', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('Cela est un objet visible et accessible');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela '); // ceci/cela
    expect(result[2]).toBeFalsy(); // soit|ni|pas
    expect(result[3]).toEqual('un objet visible et accessible'); // suite
  });

  it('est soit un lieu soit un objet visible et accessible', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('est soit un lieu soit un objet visible et accessible');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('soit'); // soit|ni|pas
    expect(result[3]).toEqual('un lieu soit un objet visible et accessible'); // suite
  });

  it('n’est ni un bijou ni buvable', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('n’est ni un bijou ni buvable');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('ni'); // soit|ni|pas
    expect(result[3]).toEqual('un bijou ni buvable'); // suite
  });

  it('n’est pas Jean-Louis', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('n’est pas Jean-Louis');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('pas'); // soit|ni|pas
    expect(result[3]).toEqual('Jean-Louis'); // suite
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] DÉFINITION DES COMPLÉMENTS DE L’ACTION
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Traiter les compléments d’une action', () => {

  it('action sauter (sans complément)', function () {
    let scenario =
      'action sauter:\n' +
      '    dire "Vous sautez."\n' +
      'fin action\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // vérifier si on a bien créé l’action
    expect(res.messages).toHaveSize(0);
    expect(res.actions).toHaveSize(1);
    const monAction = res.actions[0];
    expect(monAction.infinitif).toEqual('sauter');
    expect(monAction.phaseExecution).toHaveSize(1);
    // pas de complément
    expect(monAction.ceci).toBeFalse();
    expect(monAction.cela).toBeFalse();
  });

  it('action manger ceci (objet visible et accessible prioritairement mangeable)', function () {
    let scenario =
      'action manger ceci:\n' +
      '  définition ceci:\n' +
      '    C’est un objet visible et accessible prioritairement mangeable.\n' +
      '  phase exécution:\n' +
      '    dire "Vous l’avez mangé!".\n' +
      'fin action\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
    // vérifier si on a bien créé l’action
    expect(res.messages).toHaveSize(0);
    expect(res.actions).toHaveSize(1);
    const monAction = res.actions[0];
    expect(monAction.infinitif).toEqual('manger');
    expect(monAction.phaseExecution).toHaveSize(1);
    // complément ceci
    expect(monAction.ceci).toBeTrue();
    expect(monAction.cibleCeci).toBeTruthy();
    expect(monAction.cibleCeci.nomEpithete).toBe('objet visible et accessible');
    expect(monAction.cibleCeci.determinant).toBe('un');
    expect(monAction.cibleCeci.nom).toBe('objet');
    expect(monAction.cibleCeci.epithete).toBe('visible et accessible');
    expect(monAction.cibleCeci.priorite).toBe('mangeable');
    // complément cela
    expect(monAction.cela).toBeFalse();
    expect(monAction.cibleCela).toBeFalsy();
  });

  it('action manger ceci (objet visible et accessible prioritairement mangeable)', function () {
    let scenario =
      'action déverrouiller ceci avec cela:\n' +
      '  définition ceci:\n' +
      '    C’est une clée possédée.\n' +
      '  définition cela:\n' +
      '    C’est un objet déverrouillable, ouvrable et verrouillé prioritairement fermé.\n' +
      '  phase exécution:\n' +
      '    dire "C’est déverrouillé!"\n' +
      '    changer ceci est déverrouillé.\n' +
      'fin action\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario, true);
    // vérifier si on a bien créé l’action
    expect(res.messages).toHaveSize(0);
    expect(res.actions).toHaveSize(1);
    const monAction = res.actions[0];
    expect(monAction.infinitif).toEqual('déverrouiller');
    expect(monAction.phaseExecution).toHaveSize(2);
    // complément ceci
    expect(monAction.ceci).toBeTrue();
    expect(monAction.cibleCeci).toBeTruthy();
    expect(monAction.cibleCeci.nomEpithete).toBe('clée possédée');
    expect(monAction.cibleCeci.determinant).toBe('une');
    expect(monAction.cibleCeci.nom).toBe('clée');
    expect(monAction.cibleCeci.epithete).toBe('possédée');
    expect(monAction.cibleCeci.priorite).toBeFalsy();
    // complément cela
    expect(monAction.cela).toBeTrue();
    expect(monAction.cibleCela).toBeTruthy();
    expect(monAction.cibleCela.nomEpithete).toBe('objet déverrouillable, ouvrable et verrouillé');
    expect(monAction.cibleCela.determinant).toBe('un');
    expect(monAction.cibleCela.nom).toBe('objet');
    expect(monAction.cibleCela.epithete).toBe('déverrouillable, ouvrable et verrouillé');
    expect(monAction.cibleCela.priorite).toBe('fermé');

  });

});