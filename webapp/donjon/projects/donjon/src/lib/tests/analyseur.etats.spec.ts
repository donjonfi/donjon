import {
  AnalyseurV8Definitions,
  CompilateurV8Utils,
  EClasseRacine,
  ElementGenerique
} from "../../public-api";

import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − États (attributs) d’un élément jeu', () => {

  it('[F004-T001] Attribut ele : « Le bateau est vieux et troué » ', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('Le bateau est vieux et troué');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('Le '); // déterminant
    expect(result[2]).toEqual('bateau'); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined; // (féminin, autre forme)
    expect(result[5]).toEqual('vieux et troué'); // attributs
  });

  it('[F004-T002] Attribut ele : « Julien est grand » ', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('Julien est grand');
    expect(result).not.toBeNull();
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual('Julien'); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined; // (féminin, autre forme)
    expect(result[5]).toEqual('grand'); // attributs
  });

  it('[F004-T003] Attribut ele : « L’aliance du lac rouge (f) est petite, fragile, vieille et dorée » ', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('L’aliance du lac rouge (f, aliances du lac) est petite, fragile, vieille et dorée');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('L’'); // déterminant
    expect(result[2]).toEqual('aliance du lac'); // nom
    expect(result[3]).toEqual('rouge'); // épithète
    expect(result[4]).toEqual('(f, aliances du lac)'); // (féminin, autre forme)
    expect(result[5]).toEqual('petite, fragile, vieille et dorée'); // attributs
  });

  it('[F004-T004] Attribut ele : « Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides » ', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('Les '); // déterminant
    expect(result[2]).toEqual('pommes de terre'); // nom
    expect(result[3]).toEqual('pourries'); // épithète
    expect(result[4]).toEqual('(f, pomme de terre)'); // (féminin, autre forme)
    expect(result[5]).toEqual('mauves, odorantes et humides'); // attributs
  });

  it('[F004-T005] Attribut élé : « La baguette est un objet maudit, rouge et magique ici » (💥)', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('La baguette est un objet maudit, rouge et magique ici"');
    expect(result).toEqual(null);
  });

  it('[F004-T006] Attribut élé : « La table est un support grand et opaque dans la salle » (💥)', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('La table est un support grand et opaque dans la salle"');
    expect(result).toEqual(null);
  });

  it('[F004-T007] Attribut élé : « Sa réaction est "Bonjour !" » (💥)', () => {
    const result = ExprReg.xElementSimpleAttributs.exec('Sa réaction est "Bonjour !"');
    expect(result).toEqual(null);
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] ANALYSE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − États (attributs) d’un élément jeu', () => {

  it('[F004-T008] Attribut ele : « Le bateau est vieux et troué » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le bateau est vieux et troué. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(2);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("vieux");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("troué");
  });

  it('[F004-T009] Analyse : « Le bateau est vieux, et troué » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le bateau est vieux, et troué. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(2);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("vieux");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("troué");
  });

  it('[F004-T010] Analyse : « Le bateau est vieux, troué » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le bateau est vieux, troué. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("bateau");
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(2);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("vieux");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("troué");
  });

  it('[F004-T011] Analyse : « Julien est grand » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Julien est grand. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("Julien");
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(1);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("grand");
  });

  it('[F004-T012] Analyse : « Le bateau est vieux et troué » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le bateau est vieux, et troué. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(2);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("vieux");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("troué");
  });


  it('[F004-T013] Analyse : « Le bateau est vieux,et troué » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le bateau est vieux, et troué. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.attributs).toHaveSize(2);
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("vieux");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("troué");
  });

  it('[F004-T014] Analyse : « L’aliance du lac rouge (f) est petite, fragile, vieille et dorée. » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "L’aliance du lac rouge (f) est petite, fragile, vieille et dorée. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("aliance du lac");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toEqual("rouge");
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("petite");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("fragile");
    expect(ctxAnalyse.dernierElementGenerique.attributs[2]).toEqual("vieille");
    expect(ctxAnalyse.dernierElementGenerique.attributs[3]).toEqual("dorée");
  });


  it('[F004-T015] Analyse : « L’aliance du lac rouge (f) est petite, fragile, vieille, et dorée. » ', () => {

    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "L’aliance du lac rouge (f) est petite, fragile, vieille, et dorée. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // pas d’erreur
    // tester l’élément généré et ses attributs
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique);
    expect(ctxAnalyse.dernierElementGenerique.classeIntitule).toEqual(EClasseRacine.objet);
    expect(ctxAnalyse.dernierElementGenerique.nom).toEqual("aliance du lac");
    expect(ctxAnalyse.dernierElementGenerique.epithete).toEqual("rouge");
    expect(ctxAnalyse.dernierElementGenerique.attributs[0]).toEqual("petite");
    expect(ctxAnalyse.dernierElementGenerique.attributs[1]).toEqual("fragile");
    expect(ctxAnalyse.dernierElementGenerique.attributs[2]).toEqual("vieille");
    expect(ctxAnalyse.dernierElementGenerique.attributs[3]).toEqual("dorée");
  });

});
