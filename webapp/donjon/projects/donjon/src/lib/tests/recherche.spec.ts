// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] RESSEMBLANCE ENTRE 2 MOTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

import { ERessemblance, RechercheUtils } from "../utils/commun/recherche-utils";

describe('Ressemblance entre 2 mots', () => {

  it('[F044-T001] ressemblance: cuisine − cuisine (identiques)', () => {
    expect(RechercheUtils.ressemblanceMots("cuisine", 'cuisine')).toBe(ERessemblance.egaux);
  });

  it('[F044-T002] ressemblance: Cuisine − cuisine (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('Cuisine', 'cuisine')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T003] ressemblance: portique − portiques (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('portique', 'portiques')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T004] ressemblance: portique − partique (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('portique', 'partique')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T005] ressemblance: vélo − velo (mot < 5 caractères)', () => {
    expect(RechercheUtils.ressemblanceMots('vélo', 'velo')).toBe(ERessemblance.differents);
  });

  it('[F044-T006] ressemblance: vélos − velos (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('vélos', 'velos')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T007] ressemblance: tartiflette − tartiflete (1 lettre manquante)', () => {
    expect(RechercheUtils.ressemblanceMots('tartiflette', 'tartiflete')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T008] ressemblance: journée − jouréne (2 lettres interverties entre-elles consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('jouréne', 'journée')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T009] ressemblance: journée − jouréne (2 lettres interverties entre-elles consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('journée', 'jouréne')).toBe(ERessemblance.differents);
  });

  it('[F044-T010] ressemblance: journée − jouréen (2 lettres interverties entre-elles non consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('journée', 'jouréen')).toBe(ERessemblance.differents);
  });

  it('[F044-T011] ressemblance: empathie − ampathie (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'ampathie')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T012] ressemblance: empathie − empatie (1 lettre manquante)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'empatie')).toBe(ERessemblance.ressemblants);
  });

  it('[F044-T013] ressemblance: empathie − ampatie (1 lettre manquante + 1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'ampatie')).toBe(ERessemblance.differents);
  });

});

describe('transformerCaracteresSpeciaux', () => {

  it('[F044-T014] nettoyage: la super cuisine équipée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('la super cuisine équipée')).toBe('la super cuisine equipee');
  });

  it('[F044-T015] nettoyage: œuf', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('œuf')).toBe('oeuf');
  });

  it('[F044-T016] nettoyage: tronçonneuse à essence allumée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('tronçonneuse à essence allumée')).toBe('tronconneuse a essence allumee');
  });

});

describe('transformerCaracteresSpeciauxEtMajuscules', () => {

  it('[F044-T017] nettoyage: La SUPER cuisine Équipée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('La SUPER cuisine Équipée')).toBe('la super cuisine equipee');
  });

  it('[F044-T018] nettoyage: Œuf', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('Œuf')).toBe('oeuf');
  });

  it('[F044-T019] nettoyage: TRonçonneusE À essence aLLumée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('TRonçonneusE À essence aLLumée')).toBe('tronconneuse a essence allumee');
  });

});

describe('transformerCaracteresSpeciauxEtMajuscules', () => {

  it('[F044-T020] nettoyage: La SUPER cuisine Équipée', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('La SUPER cuisine Équipée')).toEqual(['super', 'cuisine', 'equipee']);
  });

  it('[F044-T021] nettoyage: Œuf', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('Œuf')).toEqual(['oeuf']);
  });

  it('[F044-T022] nettoyage: TRonçonneusE À essence aLLumée sous la table', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('TRonçonneusE À essence aLLumée sous la table')).toEqual(['tronconneuse', 'essence', 'allumee', 'table']);
  });

});