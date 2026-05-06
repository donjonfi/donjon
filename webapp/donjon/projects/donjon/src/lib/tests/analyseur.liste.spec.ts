import {
  AnalyseurV8Definitions,
  CompilateurV8Utils,
  EClasseRacine,
  Genre,
  Nombre
} from "../../public-api";

import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Définition d’une liste', () => {

  it('[F006-T001] Def. liste : « Les nombres gagnants sont une liste »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec('Les nombres gagnants sont une liste');
    expect(result[1]).toEqual("Les "); // déterminant
    expect(result[2]).toEqual("nombres"); // nom
    expect(result[3]).toEqual("gagnants"); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("liste"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  });

  it('[F006-T002] Def. liste : « Les vainqueurs sont une liste »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec('Les vainqueurs sont une liste');
    expect(result[1]).toEqual("Les "); // déterminant
    expect(result[2]).toEqual("vainqueurs"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("liste"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  });

  it('[F006-T003] Def. liste : « Bruxelles est une liste »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec('Bruxelles est une liste');
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("Bruxelles"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("liste"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  });

  it('[F006-T004] Def. liste : « X est une liste »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec('X est une liste');
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("X"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("liste"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  });

});

describe('Epressions régulières − Contenu d’une liste', () => {

  it('[F006-T005] Cont. liste : « Elle contient 200 »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle contient 200');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("200") // élément jeu
  });

  it('[F006-T006] Cont. liste : « Ils incluent 7 »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Ils incluent 7');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("7") // élément jeu
  });

  it('[F006-T007] Cont. liste : « Elle inclut 7, 21 et 9 »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle inclut 7, 21 et 9');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("7, 21 et 9") // élément jeu
  });

  it('[F006-T008] Cont. liste : « Elle contient la cuisine et le salon »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle contient la cuisine et le salon');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la cuisine et le salon") // élément jeu
  });

  it('[F006-T009] Cont. liste : « Ils contiennent "Alice", "Bob", "Carole" et "David" »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Ils contiennent "Alice", "Bob", "Carole" et "David"');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('"Alice", "Bob", "Carole" et "David"') // élément jeu
  });

  it('[F006-T010] Cont. liste : « Bob contient 200 » (💥)', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Bob contient 200');
    expect(result).toEqual(null);
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] ANALYSEUR
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Analyseur − Définition d’une liste et de ses valeurs', () => {

  it('[F006-T011] Élément sans pos: « Les nombres gagnants sont une liste. Elle contient 7, 21 et 9. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Les nombres gagnants sont une liste. Elle contient 7, 21 et 9.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
    expect(phrases[1].morceaux).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.pronomPersonnelContenuListe);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur
    // contrôler dernier élément générique trouvé
    expect(ctxAnalyse.dernierElementGenerique).not.toBeNull();
    expect(ctxAnalyse.dernierElementGenerique.determinant).toEqual("les ");
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("nombres");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toEqual("gagnants");
    expect(ctxAnalyse.dernierElementGenerique.genre).toEqual(Genre.m); // genre
    expect(ctxAnalyse.dernierElementGenerique.nombre).toEqual(Nombre.p); // nombre
    expect(ctxAnalyse.dernierElementGenerique.description).toBeNull(); // description pas définie
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.liste); // intitulé classe
    expect(ctxAnalyse.dernierElementGenerique.valeursNombre).toHaveSize(3); //doit contenir des nombres
    expect(ctxAnalyse.dernierElementGenerique.valeursTexte).toHaveSize(0); // ne doit pas contenir de texte
    expect(ctxAnalyse.dernierElementGenerique.valeursIntitule).toHaveSize(0); // ne doit pas contenir d’intitulé
  });

  it('[F006-T012] Élément sans pos: « Les suspects sont une liste. Ils incluent "Alice" et "Bob". »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Les suspects sont une liste. Ils incluent "Alice" et "Bob".'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
    expect(phrases[1].morceaux).toHaveSize(4); // 4 morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.pronomPersonnelContenuListe);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur
    // contrôler dernier élément générique trouvé
    expect(ctxAnalyse.dernierElementGenerique).not.toBeNull();
    expect(ctxAnalyse.dernierElementGenerique.determinant).toEqual("les ");
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("suspects");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toBeUndefined();
    expect(ctxAnalyse.dernierElementGenerique.genre).toEqual(Genre.m); // genre
    expect(ctxAnalyse.dernierElementGenerique.nombre).toEqual(Nombre.p); // nombre
    expect(ctxAnalyse.dernierElementGenerique.description).toBeNull(); // description pas définie
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.liste); // intitulé classe
    expect(ctxAnalyse.dernierElementGenerique.valeursNombre).toHaveSize(0); //ne doit pas contenir de nombre
    expect(ctxAnalyse.dernierElementGenerique.valeursTexte).toHaveSize(2); // doit contenir des textes
    expect(ctxAnalyse.dernierElementGenerique.valeursIntitule).toHaveSize(0); // ne doit pas contenir d’intitulé
  });

  it('[F006-T013] Élément sans pos: « Les pièces de la maison sont une liste. Elles contiennent la cuisine et le salon. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'Les pièces de la maison sont une liste. Elles contiennent la cuisine et le salon.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
    expect(phrases[1].morceaux).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.pronomPersonnelContenuListe);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur
    // contrôler dernier élément générique trouvé
    expect(ctxAnalyse.dernierElementGenerique).not.toBeNull();
    expect(ctxAnalyse.dernierElementGenerique.determinant).toEqual("les ");
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("pièces de la maison");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toBeUndefined();
    expect(ctxAnalyse.dernierElementGenerique.genre).toEqual(Genre.m); // genre
    expect(ctxAnalyse.dernierElementGenerique.nombre).toEqual(Nombre.p); // nombre
    expect(ctxAnalyse.dernierElementGenerique.description).toBeNull(); // description pas définie
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.liste); // intitulé classe
    expect(ctxAnalyse.dernierElementGenerique.valeursNombre).toHaveSize(0); //ne doit pas contenir de nombre
    expect(ctxAnalyse.dernierElementGenerique.valeursTexte).toHaveSize(0); // ne doit pas contenir de texte
    expect(ctxAnalyse.dernierElementGenerique.valeursIntitule).toHaveSize(2); // doit contenir des intitulés
  });

  it('[F006-T014] Élément sans pos: « X est une liste. Il inclut 1. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'X est une liste. Il inclut 1.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
    expect(phrases[1].morceaux).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.pronomPersonnelContenuListe);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur
    // contrôler dernier élément générique trouvé
    expect(ctxAnalyse.dernierElementGenerique).not.toBeNull();
    expect(ctxAnalyse.dernierElementGenerique.determinant).toBeNull();
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("X");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toBeUndefined();
    expect(ctxAnalyse.dernierElementGenerique.genre).toEqual(Genre.m); // genre
    expect(ctxAnalyse.dernierElementGenerique.nombre).toEqual(Nombre.s); // nombre
    expect(ctxAnalyse.dernierElementGenerique.description).toBeNull(); // description pas définie
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.liste); // intitulé classe
    expect(ctxAnalyse.dernierElementGenerique.valeursNombre).toHaveSize(1); // doit pas contenir 1 nombre
    expect(ctxAnalyse.dernierElementGenerique.valeursTexte).toHaveSize(0); // ne doit pas contenir de texte
    expect(ctxAnalyse.dernierElementGenerique.valeursIntitule).toHaveSize(0); // ne doit pas contenir d’intitulé
  });

});
