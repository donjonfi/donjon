import { Analyseur, Compilateur, EClasseRacine, Genre, Nombre } from "../../public-api";

import { AnalyseurElementSimple } from "../utils/compilation/analyseur/analyseur.element.simple";
import { AnalyseurUtils } from "../utils/compilation/analyseur/analyseur.utils";
import { ContexteAnalyse } from "../models/compilateur/contexte-analyse";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Définition d’une liste', () => {

  it('Def. liste : « Les nombres gagnants sont une liste »', () => {
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

  it('Def. liste : « Les vainqueurs sont une liste »', () => {
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

  it('Def. liste : « Bruxelles est une liste »', () => {
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

});

describe('Epressions régulières − Contenu d’une liste', () => {

  it('Cont. liste : « Elle contient 200 »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle contient 200');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("200") // élément jeu
  });

  it('Cont. liste : « Elle inclut 7, 21 et 9 »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle contient 7, 21 et 9');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("7, 21 et 9") // élément jeu
  });

  it('Cont. liste : « Elle contient la cuisine et le salon »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Elle contient la cuisine et le salon');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la cuisine et le salon") // élément jeu
  });

  it('Cont. liste : « Ils contiennent "Alice", "Bob", "Carole" et "David" »', () => {
    const result = ExprReg.xPronomPersonnelContenu.exec('Ils contiennent "Alice", "Bob", "Carole" et "David"');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('"Alice", "Bob", "Carole" et "David"') // élément jeu
  });

  it('Cont. liste : « Bob contient 200 » (💥)', () => {
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

  // =========================================================
  // ÉLÉMENTS SANS POSITION
  // =========================================================

  it('Élément sans pos: « Les nombres gagnants sont une liste. Elle contient 7, 21 et 9. »', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'Les nombres gagnants sont une liste. Elle contient 7, 21 et 9.'
    );
    expect(phrases).toHaveSize(2); // 2 phrases
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    expect(phrases[1].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(Analyseur.analyserPhrase(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.pronomPersonnelContenuListe);
    // tester l’analyse spécifique
    const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toEqual('les '); // déterminant
    expect(el.nom).toEqual('nombres'); // nom
    expect(el.epithete).toEqual('gagnants'); // épithète pas défini
    expect(el.genre).toEqual(Genre.m); // genre
    expect(el.nombre).toEqual(Nombre.p); // nombre
    expect(el.quantite).toEqual(-1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.liste); // intitulé classe
    expect(el.positionString).toBeNull(); // position pas définie
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBeNull(); // desrcription pas définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(0); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

});