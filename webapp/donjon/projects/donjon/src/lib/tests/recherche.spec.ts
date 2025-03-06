// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] RESSEMBLANCE ENTRE 2 MOTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

import { ERessemblance, RechercheUtils } from "../utils/commun/recherche-utils";

describe('Ressemblance entre 2 mots', () => {

  it('ressemblance: cuisine − cuisine (identiques)', () => {
    expect(RechercheUtils.ressemblanceMots("cuisine", 'cuisine')).toBe(ERessemblance.egaux);
  });

  it('ressemblance: Cuisine − cuisine (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('Cuisine', 'cuisine')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: portique − portiques (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('portique', 'portiques')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: portique − partique (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('portique', 'partique')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: vélo − velo (mot < 5 caractères)', () => {
    expect(RechercheUtils.ressemblanceMots('vélo', 'velo')).toBe(ERessemblance.differents);
  });

  it('ressemblance: vélos − velos (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('vélos', 'velos')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: tartiflette − tartiflete (1 lettre manquante)', () => {
    expect(RechercheUtils.ressemblanceMots('tartiflette', 'tartiflete')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: journée − jouréne (2 lettres interverties entre-elles consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('jouréne', 'journée')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: journée − jouréne (2 lettres interverties entre-elles consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('journée', 'jouréne')).toBe(ERessemblance.differents);
  });

  it('ressemblance: journée − jouréen (2 lettres interverties entre-elles non consécutives)', () => {
    expect(RechercheUtils.ressemblanceMots('journée', 'jouréen')).toBe(ERessemblance.differents);
  });

  it('ressemblance: empathie − ampathie (1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'ampathie')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: empathie − empatie (1 lettre manquante)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'empatie')).toBe(ERessemblance.ressemblants);
  });

  it('ressemblance: empathie − ampatie (1 lettre manquante + 1 lettre différente)', () => {
    expect(RechercheUtils.ressemblanceMots('empathie', 'ampatie')).toBe(ERessemblance.differents);
  });

});

describe('transformerCaracteresSpeciaux', () => {

  it('nettoyage: la super cuisine équipée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('la super cuisine équipée')).toBe('la super cuisine equipee');
  });

  it('nettoyage: œuf', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('œuf')).toBe('oeuf');
  });

  it('nettoyage: tronçonneuse à essence allumée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciaux('tronçonneuse à essence allumée')).toBe('tronconneuse a essence allumee');
  });

});

describe('transformerCaracteresSpeciauxEtMajuscules', () => {

  it('nettoyage: La SUPER cuisine Équipée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('La SUPER cuisine Équipée')).toBe('la super cuisine equipee');
  });

  it('nettoyage: Œuf', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('Œuf')).toBe('oeuf');
  });

  it('nettoyage: TRonçonneusE À essence aLLumée', () => {
    expect(RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('TRonçonneusE À essence aLLumée')).toBe('tronconneuse a essence allumee');
  });

});

describe('transformerCaracteresSpeciauxEtMajuscules', () => {

  it('nettoyage: La SUPER cuisine Équipée', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('La SUPER cuisine Équipée')).toEqual(['super', 'cuisine', 'equipee']);
  });

  it('nettoyage: Œuf', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('Œuf')).toEqual(['oeuf']);
  });

  it('nettoyage: TRonçonneusE À essence aLLumée sous la table', () => {
    expect(RechercheUtils.nettoyerEtTransformerEnMotsCles('TRonçonneusE À essence aLLumée sous la table')).toEqual(['tronconneuse', 'essence', 'allumee', 'table']);
  });

});