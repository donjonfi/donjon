import {
  AnalyseurV8Definitions,
  CompilateurV8,
  CompilateurV8Utils,
  EClasseRacine,
  ElementGenerique,
  Generateur,
  TypeDeclarationEtat,
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

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [3] DÉCLARATIONS D’ÉTATS PERSONNALISÉS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Déclarations d’états personnalisés − regex', () => {

  it('[F004-T100] xEtatSimple : « troué est un état » ', () => {
    const r = ExprReg.xEtatSimple.exec('troué est un état');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('troué');
  });

  it('[F004-T101] xEtatBascule : « sec et mouillé forment une bascule » ', () => {
    const r = ExprReg.xEtatBascule.exec('sec et mouillé forment une bascule');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('sec');
    expect(r[2]).toEqual('mouillé');
  });

  it('[F004-T102] xEtatGroupe : « solide, liquide et gazeux se contredisent » ', () => {
    const r = ExprReg.xEtatGroupe.exec('solide, liquide et gazeux se contredisent');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('solide, liquide et gazeux');
  });

  it('[F004-T103] xEtatGroupe : « fissuré et intact se contredisent » (2 états) ', () => {
    const r = ExprReg.xEtatGroupe.exec('fissuré et intact se contredisent');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('fissuré et intact');
  });

  it('[F004-T104] xEtatImplique : « vu implique mentionné » ', () => {
    const r = ExprReg.xEtatImplique.exec('vu implique mentionné');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('vu');
    expect(r[2]).toEqual('mentionné');
  });

  it('[F004-T105] xEtatImplique : « secret implique caché et invisible » (liste 2) ', () => {
    const r = ExprReg.xEtatImplique.exec('secret implique caché et invisible');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('secret');
    expect(r[2]).toEqual('caché et invisible');
  });

  it('[F004-T106] xEtatImplique : « secret implique caché, invisible et discret » (liste 3) ', () => {
    const r = ExprReg.xEtatImplique.exec('secret implique caché, invisible et discret');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('secret');
    expect(r[2]).toEqual('caché, invisible et discret');
  });

  it('[F004-T107] xEtatExclut : « déplacé exclut intact » ', () => {
    const r = ExprReg.xEtatExclut.exec('déplacé exclut intact');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('déplacé');
    expect(r[2]).toEqual('intact');
  });

  it('[F004-T108] xEtatExclut : « intact exclut déplacé et modifié » (liste 2) ', () => {
    const r = ExprReg.xEtatExclut.exec('intact exclut déplacé et modifié');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('intact');
    expect(r[2]).toEqual('déplacé et modifié');
  });

  it('[F004-T109] xEtatExclut : « intact exclut déplacé, modifié et fendu » (liste 3) ', () => {
    const r = ExprReg.xEtatExclut.exec('intact exclut déplacé, modifié et fendu');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('intact');
    expect(r[2]).toEqual('déplacé, modifié et fendu');
  });

});

describe('Déclarations d’états personnalisés − analyse', () => {

  it('[F004-T120] État simple : « troué est un état. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('troué est un état.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.simple);
    expect(ctx.declarationsEtats[0].etats).toEqual(['troué']);
  });

  it('[F004-T121] Bascule : « sec et mouillé forment une bascule. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('sec et mouillé forment une bascule.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.bascule);
    expect(ctx.declarationsEtats[0].etats).toEqual(['sec', 'mouillé']);
  });

  it('[F004-T122] Groupe (3) : « solide, liquide et gazeux se contredisent. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('solide, liquide et gazeux se contredisent.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.groupe);
    expect(ctx.declarationsEtats[0].etats).toEqual(['solide', 'liquide', 'gazeux']);
  });

  it('[F004-T123] Groupe (2) : « fissuré et intact se contredisent. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('fissuré et intact se contredisent.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.groupe);
    expect(ctx.declarationsEtats[0].etats).toEqual(['fissuré', 'intact']);
  });

  it('[F004-T124] Implication : « vu implique mentionné. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('vu implique mentionné.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.implication);
    expect(ctx.declarationsEtats[0].sujet).toEqual('vu');
    expect(ctx.declarationsEtats[0].cibles).toEqual(['mentionné']);
  });

  it('[F004-T125] Implication liste (3) : « secret implique caché, invisible et discret. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('secret implique caché, invisible et discret.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].sujet).toEqual('secret');
    expect(ctx.declarationsEtats[0].cibles).toEqual(['caché', 'invisible', 'discret']);
  });

  it('[F004-T126] Exclusion : « déplacé exclut intact. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('déplacé exclut intact.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].type).toBe(TypeDeclarationEtat.exclusion);
    expect(ctx.declarationsEtats[0].sujet).toEqual('déplacé');
    expect(ctx.declarationsEtats[0].cibles).toEqual(['intact']);
  });

  it('[F004-T127] Exclusion liste (2) : « intact exclut déplacé et modifié. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('intact exclut déplacé et modifié.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].sujet).toEqual('intact');
    expect(ctx.declarationsEtats[0].cibles).toEqual(['déplacé', 'modifié']);
  });

  it('[F004-T128] Exclusion liste (3) : « intact exclut déplacé, modifié et fendu. » ', () => {
    let ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('intact exclut déplacé, modifié et fendu.');
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctx)).toBe(ResultatAnalysePhrase.declarationEtat);
    expect(ctx.declarationsEtats).toHaveSize(1);
    expect(ctx.declarationsEtats[0].sujet).toEqual('intact');
    expect(ctx.declarationsEtats[0].cibles).toEqual(['déplacé', 'modifié', 'fendu']);
  });

});

describe('Déclarations d’états personnalisés − génération', () => {

  it('[F004-T140] Bascule : appliquer A retire B, retirer A ré-introduit B ', () => {
    const scenario = `
sec et mouillé forment une bascule.
La serviette est un objet sec ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const sec = jeu.etats.trouverEtatSilencieux('sec');
    const mouille = jeu.etats.trouverEtatSilencieux('mouillé');
    expect(sec).not.toBeNull();
    expect(mouille).not.toBeNull();
    expect(sec.bascule).toBe(mouille.id);
    expect(mouille.bascule).toBe(sec.id);
  });

  it('[F004-T141] Groupe (3) : même groupe partagé, pas de bascule ', () => {
    const scenario = `
roche, sable et boue se contredisent.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const roche = jeu.etats.trouverEtatSilencieux('roche');
    const sable = jeu.etats.trouverEtatSilencieux('sable');
    const boue = jeu.etats.trouverEtatSilencieux('boue');
    expect(roche).not.toBeNull();
    expect(sable).not.toBeNull();
    expect(boue).not.toBeNull();
    expect(roche.groupe).not.toBeNull();
    expect(sable.groupe).toBe(roche.groupe);
    expect(boue.groupe).toBe(roche.groupe);
    expect(roche.bascule).toBeNull();
  });

  it('[F004-T142] Implication : impliquant porte la cible dans implications[] ', () => {
    const scenario = `
brillant est un état.
poli est un état.
brillant implique poli.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const brillant = jeu.etats.trouverEtatSilencieux('brillant');
    const poli = jeu.etats.trouverEtatSilencieux('poli');
    expect(brillant).not.toBeNull();
    expect(poli).not.toBeNull();
    expect(brillant.implications).toContain(poli.id);
  });

  it('[F004-T143] Implication liste (3) : 3 cibles enregistrées ', () => {
    const scenario = `
brillant est un état.
poli est un état.
propre est un état.
neuf2 est un état.
brillant implique poli, propre et neuf2.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const brillant = jeu.etats.trouverEtatSilencieux('brillant');
    const poli = jeu.etats.trouverEtatSilencieux('poli');
    const propre = jeu.etats.trouverEtatSilencieux('propre');
    const neuf2 = jeu.etats.trouverEtatSilencieux('neuf2');
    expect(brillant.implications).toContain(poli.id);
    expect(brillant.implications).toContain(propre.id);
    expect(brillant.implications).toContain(neuf2.id);
  });

  it('[F004-T144] Exclusion : contradiction bilatérale enregistrée ', () => {
    const scenario = `
parfait est un état.
abimé est un état.
parfait exclut abimé.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const parfait = jeu.etats.trouverEtatSilencieux('parfait');
    const abime = jeu.etats.trouverEtatSilencieux('abimé');
    expect(parfait.contradictions).toContain(abime.id);
    expect(abime.contradictions).toContain(parfait.id);
  });

  it('[F004-T145] Exclusion liste (2) : non-clique entre cibles ', () => {
    const scenario = `
parfait est un état.
brise est un état.
brule est un état.
parfait exclut brise et brule.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const parfait = jeu.etats.trouverEtatSilencieux('parfait');
    const brise = jeu.etats.trouverEtatSilencieux('brise');
    const brule = jeu.etats.trouverEtatSilencieux('brule');
    expect(parfait.contradictions).toContain(brise.id);
    expect(parfait.contradictions).toContain(brule.id);
    expect(brise.contradictions).toContain(parfait.id);
    expect(brule.contradictions).toContain(parfait.id);
    // brise et brule ne se contredisent PAS entre eux (différence clé avec un groupe)
    const briseContredit = brise.contradictions || [];
    const bruleContredit = brule.contradictions || [];
    expect(briseContredit.includes(brule.id)).toBe(false);
    expect(bruleContredit.includes(brise.id)).toBe(false);
  });

  it('[F004-T146] Statu quo : état inconnu utilisé sans déclaration est créé en simple ', () => {
    const scenario = `
Le bateau est un objet truqué ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const truque = jeu.etats.trouverEtatSilencieux('truqué');
    expect(truque).not.toBeNull();
    expect(truque.bascule).toBeNull();
    expect(truque.groupe).toBeNull();
  });

});

describe('Négation dans les définitions d’éléments', () => {

  it('[F004-T160] Négation inline (constructeur) : « La pierre est un objet non lisible » ', () => {
    const scenario = `
La pierre est un objet non lisible ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const pierre = jeu.objets.find(o => o.nom === 'pierre');
    expect(pierre).toBeDefined();
    const lisible = jeu.etats.trouverEtatSilencieux('lisible');
    expect(lisible).not.toBeNull();
    expect(pierre.etats).not.toContain(lisible.id);
  });

  it('[F004-T161] Négation verbale : « La pierre n’est pas lisible » ', () => {
    const scenario = `
La pierre est un objet lisible ici.
La pierre n’est pas lisible.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const pierre = jeu.objets.find(o => o.nom === 'pierre');
    expect(pierre).toBeDefined();
    const lisible = jeu.etats.trouverEtatSilencieux('lisible');
    expect(pierre.etats).not.toContain(lisible.id);
  });

  it('[F004-T162] Conseil bascule personnalisée : suggère l’opposé positif ', () => {
    const scenario = `
sec et mouillé forment une bascule.
La pierre est un objet mouillé ici.
La pierre n’est pas mouillée.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    // mouillé/sec est une bascule personnalisée → conseil émis
    expect(jeu.tamponConseils.some(c => /non mouillé/.test(c) && /sec/.test(c))).toBeTrue();
  });

  it('[F004-T163] Pas de conseil hors bascule : « non lisible » (état simple) ', () => {
    const scenario = `
La pierre est un objet non lisible ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    // lisible n’est PAS une bascule → aucun conseil bascule
    expect(jeu.tamponConseils.some(c => /non lisible/.test(c))).toBeFalse();
  });

  it('[F004-T164] Bascule personnalisée + négation : retrait + ré-introduction + conseil ', () => {
    const scenario = `
fissuré et entier forment une bascule.
La poterie est un objet entier ici.
La poterie n’est pas entière.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const poterie = jeu.objets.find(o => o.nom === 'poterie');
    const entier = jeu.etats.trouverEtatSilencieux('entier');
    const fissure = jeu.etats.trouverEtatSilencieux('fissuré');
    expect(poterie).toBeDefined();
    expect(entier).not.toBeNull();
    expect(fissure).not.toBeNull();
    expect(poterie.etats).not.toContain(entier.id);
    // bascule → réintroduction automatique de l'opposé
    expect(poterie.etats).toContain(fissure.id);
    // conseil émis
    expect(jeu.tamponConseils.some(c => /non entier/.test(c) && /fissuré/.test(c))).toBeTrue();
  });

  it('[F004-T165] xElementSimpleNegation : matche « La porte nord n’est pas ouvrable » ', () => {
    const r = ExprReg.xElementSimpleNegation.exec('La porte nord n’est pas ouvrable');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('La porte nord');
    expect(r[2]).toEqual('ouvrable');
  });

  it('[F004-T166] xElementSimpleNegation : matche « Les portes ne sont pas ouvertes » ', () => {
    const r = ExprReg.xElementSimpleNegation.exec('Les portes ne sont pas ouvertes');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('Les portes');
    expect(r[2]).toEqual('ouvertes');
  });

  it('[F004-T167] xElementSimpleNegation : matche liste « n’est pas ouvrable et verrouillable » ', () => {
    const r = ExprReg.xElementSimpleNegation.exec('La porte nord n’est pas ouvrable et verrouillable');
    expect(r).not.toBeNull();
    expect(r[1]).toEqual('La porte nord');
    expect(r[2]).toEqual('ouvrable et verrouillable');
  });

});
