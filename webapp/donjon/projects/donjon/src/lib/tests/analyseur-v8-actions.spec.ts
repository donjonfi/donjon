import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('définition action: compléments ceci/cela: type et états − Epressions régulières', () => {

  it('[F011-T001] Ceci est un objet possédé', () => {
    const result = ExprReg.rDefinitionComplementActionTypeEtat.exec('Ceci est un objet possédé');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Ceci'); // ceci/cela
    expect(result[2]).toEqual('un'); // un/une
    expect(result[3]).toEqual('objet'); // type
    expect(result[4]).toEqual('possédé'); // états requis
    expect(result[5]).toBeFalsy(); // états prioritaires
  });

  it('[F011-T002] ceci est un objet possédé ou disponible prioritairement visible', () => {
    const result = ExprReg.rDefinitionComplementActionTypeEtat.exec('ceci est un objet possédé ou disponible prioritairement visible');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('ceci'); // ceci/cela
    expect(result[2]).toEqual('un'); // un/une
    expect(result[3]).toEqual('objet'); // type
    expect(result[4]).toEqual('possédé ou disponible'); // états requis
    expect(result[5]).toEqual('visible'); // états prioritaires
  });

  it('[F011-T003] 💥 cela est de l’eau', () => {
    const result = ExprReg.rDefinitionComplementActionTypeEtat.exec('cela est de l’eau');
    expect(result).toBeFalsy();
  });

  it('[F011-T004] cela est un lieu', () => {
    const result = ExprReg.rDefinitionComplementActionTypeEtat.exec('cela est un lieu');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('cela'); // ceci/cela
    expect(result[2]).toEqual('un'); // un/une
    expect(result[3]).toEqual('lieu'); // type
    expect(result[4]).toBeFalsy(); // états requis
    expect(result[5]).toBeFalsy(); // états prioritaires
  });

  it('[F011-T005] Cela est une licorne petite et mignone prioritairement gentille ou amicale', () => {
    const result = ExprReg.rDefinitionComplementActionTypeEtat.exec('Cela est une licorne petite et mignone prioritairement gentille ou amicale');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela'); // ceci/cela
    expect(result[2]).toEqual('une'); // un/une
    expect(result[3]).toEqual('licorne'); // type
    expect(result[4]).toEqual('petite et mignone'); // états requis
    expect(result[5]).toEqual('gentille ou amicale'); // états prioritaires
  });

});


describe('définition action: compléments ceci/cela: états prioritaires − Epressions régulières', () => {

  it('[F011-T006] ceci est prioritairement déplacé ou fixé', () => {
    const result = ExprReg.rDefinitionComplementActionEtatPrioritaire.exec('ceci est prioritairement déplacé ou fixé');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('ceci'); // ceci/cela
    expect(result[2]).toEqual('déplacé ou fixé'); // états prioritaires
  });

  it('[F011-T007] Cela est prioritairement disponible', () => {
    const result = ExprReg.rDefinitionComplementActionEtatPrioritaire.exec('Cela est prioritairement disponible');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela'); // ceci/cela
    expect(result[2]).toEqual('disponible'); // états prioritaires
  });

  it('[F011-T008] 💥 ceci est ouvert', () => {
    const result = ExprReg.rDefinitionComplementActionEtatPrioritaire.exec('ceci est ouvert');
    expect(result).toBeFalsy();
  });

});

describe('définition action: compléments ceci/cela: élément jeu − Epressions régulières', () => {

  it('[F011-T009] Ceci est Jonathan', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('Ceci est Jonathan');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Ceci'); // ceci/cela
    expect(result[2]).toEqual('Jonathan'); // élément du jeu
  });

  it('[F011-T010] Cela sont les étoiles', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('Cela sont les étoiles');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela'); // ceci/cela
    expect(result[2]).toEqual('étoiles'); // élément du jeu
  });

  it('[F011-T011] ceci est Elrik', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('ceci est Elrik');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('ceci'); // ceci/cela
    expect(result[2]).toEqual('Elrik'); // élément du jeu
  });

  it('[F011-T012] cela est le capitaine', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('cela est le capitaine');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('cela'); // ceci/cela
    expect(result[2]).toEqual('capitaine'); // élément du jeu
  });

  it('[F011-T013] Ceci est le comte du bois dormant', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('Ceci est le comte du bois dormant');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Ceci'); // ceci/cela
    expect(result[2]).toEqual('comte du bois dormant'); // élément du jeu
  });

  it('[F011-T014] Cela est Petit Nez', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('Cela est Petit Nez');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela'); // ceci/cela
    expect(result[2]).toEqual('Petit Nez'); // élément du jeu
  });

  it('[F011-T015] cela est de l\'eau', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('cela est de l\'eau');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('cela'); // ceci/cela
    expect(result[2]).toEqual('eau'); // élément du jeu
  });

  it('[F011-T016] cela est un contenant', () => {
    const result = ExprReg.rDefinitionComplementActionElementJeu.exec('cela est un contenant');
    expect(result).toBeFalsy();
  });

});

describe('Complément action EstSoitNiPas − Epressions régulières', () => {

  it('[F011-T017] Ceci est un lieu', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('Ceci est un lieu');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Ceci '); // ceci/cela
    expect(result[2]).toBeFalsy(); // soit|ni|pas
    expect(result[3]).toEqual('un lieu'); // suite
  });

  it('[F011-T018] Cela est un objet visible et accessible', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('Cela est un objet visible et accessible');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('Cela '); // ceci/cela
    expect(result[2]).toBeFalsy(); // soit|ni|pas
    expect(result[3]).toEqual('un objet visible et accessible'); // suite
  });

  it('[F011-T019] est soit un lieu soit un objet visible et accessible', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('est soit un lieu soit un objet visible et accessible');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('soit'); // soit|ni|pas
    expect(result[3]).toEqual('un lieu soit un objet visible et accessible'); // suite
  });

  it('[F011-T020] n’est ni un bijou ni buvable', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('n’est ni un bijou ni buvable');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('ni'); // soit|ni|pas
    expect(result[3]).toEqual('un bijou ni buvable'); // suite
  });

  it('[F011-T021] n’est pas Jean-Louis', () => {
    const result = ExprReg.rComplementActionEstSoitNiPas.exec('n’est pas Jean-Louis');
    expect(result).toBeTruthy();
    expect(result[1]).toBeFalsy(); // ceci/cela
    expect(result[2]).toEqual('pas'); // soit|ni|pas
    expect(result[3]).toEqual('Jean-Louis'); // suite
  });

});

describe('définition action: déplacement joueur − Expressions régulières', () => {

  it('[F011-T022] L’action déplace le joueur vers ceci', () => {
    const result = ExprReg.rDefinitionActionDeplacementJoueur.exec('L’action déplace le joueur vers ceci');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('ceci'); // ceci/cela
  });

  it('[F011-T023] Le joueur est déplacé vers cela', () => {
    const result = ExprReg.rDefinitionActionDeplacementJoueur.exec('Le joueur est déplacé vers cela');
    expect(result).toBeTruthy();
    expect(result[1]).toEqual('cela'); // ceci/cela
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] DÉFINITION DES COMPLÉMENTS DE L’ACTION
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Traiter les compléments d’une action', () => {

  it('[F011-T024] action sauter (sans complément)', function () {
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

  it('[F011-T025] action manger ceci (objet visible et accessible prioritairement mangeable)', function () {
    let scenario =
      'action manger ceci:\n' +
      '  définitions:\n' +
      '    Ceci est un objet visible et accessible prioritairement mangeable.\n' +
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

  it('[F011-T026] action déverrouiller ceci avec cela (clé possédée et objet déverrouillable, ouvrable et verrouillé prioritairement fermé)', function () {
    let scenario =
      'action déverrouiller ceci avec cela:\n' +
      '  définitions:\n' +
      '    Ceci est une clée possédée.\n' +
      '    cela est un objet déverrouillable, ouvrable et verrouillé prioritairement fermé.\n' +
      '  phase exécution:\n' +
      '    dire "C’est déverrouillé!"\n' +
      '    changer ceci est déverrouillé.\n' +
      'fin action\n' +
      '\n' +
      '';

    const res = CompilateurV8.analyserScenarioSeul(scenario);
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