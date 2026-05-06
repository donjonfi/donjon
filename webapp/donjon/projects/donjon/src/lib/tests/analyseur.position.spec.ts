import {
  AnalyseurElementPosition,
  AnalyseurUtils,
  AnalyseurV8Definitions,
  CompilateurV8Utils,
  EClasseRacine,
  ElementGenerique,
  Genre,
  Nombre,
  PositionSujetString
} from "../../public-api";

import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Epressions régulières − Définition position d’un élément', () => {

  it('[F007-T001] def position : « Le chat se trouve sur le divan »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Le chat se trouve sur le divan');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le chat"); // élément
    expect(result[2]).toEqual("sur le divan"); // position
  });

  it('[F007-T002] def position : « Les haricots sauvages se trouvent ici »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Les haricots sauvages se trouvent ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Les haricots sauvages"); // élément
    expect(result[2]).toEqual("ici"); // position
  });

  it('[F007-T003] def position : « Bob se trouve à l’intérieur de la cabane hurlante »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Bob se trouve à l’intérieur de la cabane hurlante');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Bob"); // élément
    expect(result[2]).toEqual("à l’intérieur de la cabane hurlante"); // position
  });

  it('[F007-T004] def position : « La forêt se trouve au nord du chemin et au sud de l’abri »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('La forêt se trouve au nord du chemin et au sud de l’abri');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La forêt"); // élément
    expect(result[2]).toEqual("au nord du chemin et au sud de l’abri"); // position
  });

  it('[F007-T005] def position : « Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Par rapport à la cabane, la forêt"); // élément
    expect(result[2]).toEqual("au nord, au sud et à l’ouest"); // position
  });

  it('[F007-T006] def position : « Il se trouve ici »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Il se trouve ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Il"); // élément
    expect(result[2]).toEqual("ici"); // position
  });


});

describe('Epressions régulières − Définition position d’un élément', () => {

  it('[F007-T007] def position : « sur le divan »', () => {
    const result = ExprReg.xPositionRelative.exec('sur le divan');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("sur le "); // position suivie
    expect(result[2]).toEqual("divan"); // autre élément
    expect(result[3]).toBeFalsy(); // position solo
  });

  it('[F007-T008] def position : « ici »', () => {
    const result = ExprReg.xPositionRelative.exec('ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("ici"); // position solo
  });

  it('[F007-T009] def position : « dessus »', () => {
    const result = ExprReg.xPositionRelative.exec('dessus');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("dessus"); // position solo
  });

  it('[F007-T010] def position : « à l’intérieur »', () => {
    const result = ExprReg.xPositionRelative.exec('à l’intérieur');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("à l’intérieur"); // position solo
  });

  it('[F007-T011] def position : « à l’intérieur de la cabane hurlante »', () => {
    const result = ExprReg.xPositionRelative.exec('à l’intérieur de la cabane hurlante');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("à l’intérieur de la "); // position suivie
    expect(result[2]).toEqual("cabane hurlante"); // autre élément
    expect(result[3]).toBeFalsy(); // position solo
  });

  it('[F007-T012] def position : « au nord du chemin et au sud de l’abri » (💥)', () => {
    const result = ExprReg.xPositionRelative.exec('La forêt se trouve au nord du chemin et au sud de l’abri');
    expect(result).toEqual(null);
  });

  it('[F007-T013] def position : « au nord, au sud et à l’ouest » (💥)', () => {
    const result = ExprReg.xPositionRelative.exec('Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest');
    expect(result).toEqual(null);
  });

});


describe('Analyseur: objets positionnés', () => {

  it('[F007-T014] Élément pos: « Le cadenas bleu est un objet dans le labo. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le cadenas bleu est un objet dans le labo."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    // tester l’analyse spécifique
    const el = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toEqual('le '); // déterminant
    expect(el.nom).toEqual('cadenas'); // nom de l’élément
    expect(el.epithete).toEqual('bleu'); // épithète pas défini
    expect(el.genre).toEqual(Genre.m); // genre
    expect(el.nombre).toEqual(Nombre.s); // nombre
    expect(el.quantite).toEqual(1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.objet); // intitulé classe
    expect(el.positionString).toHaveSize(1); // position définie
    expect(el.positionString[0]).toEqual(new PositionSujetString('cadenas bleu', 'labo', 'dans le ')); // position
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBeNull(); // description pas définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(0); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('[F007-T015] Élément pos: « Le cadenas bleu est un objet. Il se trouve dans le labo. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le cadenas bleu est un objet. " +
      "Il se trouve dans le labo. " +
      ""
    );
    expect(phrases).toHaveSize(2); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[1].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    expect(ctxAnalyse.elementsGeneriques).toHaveSize(1); // nombre d’éléments génériques
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique); // dernier élément
    expect(ctxAnalyse.dernierElementGenerique.elIntitule).toBe('cadenas bleu'); // intitulé du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString).toHaveSize(1); // nombre de positions du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].sujet).toEqual('cadenas bleu');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].position).toEqual('dans le ');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].complement).toEqual('labo');
    expect(ctxAnalyse.dernierLieu).toBeFalsy(); // dernier lieu

  });

  it('[F007-T016] Élément pos: « Le labo est un lieu. Le cadenas bleu est un objet. Il se trouve ici. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le labo est un lieu. " +
      "Le cadenas bleu est un objet. " +
      "Il se trouve ici. " +
      ""
    );
    expect(phrases).toHaveSize(3); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[1].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[2].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[2], ctxAnalyse)).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    expect(ctxAnalyse.elementsGeneriques).toHaveSize(2); // nombre d’éléments génériques
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique); // dernier élément
    expect(ctxAnalyse.dernierElementGenerique.elIntitule).toBe('cadenas bleu'); // intitulé du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString).toHaveSize(1); // nombre de positions du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].sujet).toEqual('cadenas bleu');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].position).toEqual('dans');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].complement).toEqual('labo');
    expect(ctxAnalyse.dernierLieu).toBeInstanceOf(ElementGenerique); // dernier lieu
    expect(ctxAnalyse.dernierLieu.positionString).toHaveSize(0); // nombre de positions du dernier élément

  });


  it('[F007-T017] Élément pos: « La table est un support. Le cadenas bleu est un objet. Il se trouve sur la table. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "La table est un support. \n" +
      "Le cadenas bleu est un objet. \n" +
      "Il se trouve sur la table. \n" +
      ""
    );
    expect(phrases).toHaveSize(3); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[1].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[2].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[2], ctxAnalyse)).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    expect(ctxAnalyse.elementsGeneriques).toHaveSize(2); // nombre d’éléments génériques
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique); // dernier élément
    expect(ctxAnalyse.dernierElementGenerique.elIntitule).toBe('cadenas bleu'); // intitulé du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString).toHaveSize(1); // nombre de positions du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].sujet).toEqual('cadenas bleu');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].position).toEqual('sur la ');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].complement).toEqual('table');
    expect(ctxAnalyse.dernierLieu).toBeFalsy(); // dernier lieu

  });


  it('[F007-T018] Élément pos: « La grotte est un lieu. Le coffre est un contenant ici. L’or est un objet dedans. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "La grotte est un lieu. \n" +
      "Le coffre est un contenant ici. \n" +
      "L’or est dedans. \n" +
      ""
    );
    expect(phrases).toHaveSize(3); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[1].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[2].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[2], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    expect(ctxAnalyse.elementsGeneriques).toHaveSize(3); // nombre d’éléments génériques
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique); // dernier élément
    expect(ctxAnalyse.dernierElementGenerique.elIntitule).toBe('or'); // intitulé du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString).toHaveSize(1); // nombre de positions du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].sujet).toEqual('or');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].position).toEqual('dans');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].complement).toEqual('coffre');
    expect(ctxAnalyse.dernierLieu).toBeInstanceOf(ElementGenerique); // dernier lieu
    expect(ctxAnalyse.dernierLieu.elIntitule).toBe('grotte'); // dernier lieu

  });

  it('[F007-T019] Élément pos: « La grotte est un lieu. Le coffre est un contenant ici. L’or est un objet dedans. »', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "La grotte est un lieu. \n" +
      "Le coffre est un contenant ici. \n" +
      "L’or est un objet. \n" +
      "L’or se trouve dans le coffre. \n" +
      ""
    );
    expect(phrases).toHaveSize(4); // nombre de phrases
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[2], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[3], ctxAnalyse)).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    expect(ctxAnalyse.elementsGeneriques).toHaveSize(3); // nombre d’éléments génériques
    expect(ctxAnalyse.dernierElementGenerique).toBeInstanceOf(ElementGenerique); // dernier élément
    expect(ctxAnalyse.dernierElementGenerique.elIntitule).toBe('or'); // intitulé du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString).toHaveSize(1); // nombre de positions du dernier élément
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].sujet).toEqual('or');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].position).toEqual('dans le ');
    expect(ctxAnalyse.dernierElementGenerique.positionString[0].complement).toEqual('coffre');
    expect(ctxAnalyse.dernierLieu).toBeInstanceOf(ElementGenerique); // dernier lieu
    expect(ctxAnalyse.dernierLieu.elIntitule).toBe('grotte'); // dernier lieu

  });

  it('[F007-T020] Élément pos: « Le coffre est un contenant ici. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le coffre est un contenant ici. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(1); // erreur car aucun lieu n’est encore défini.

  });


  it('[F007-T021] Élément pos: « Le coffre est dedans. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le coffre est dedans. \n" +
      ""
    );
    expect(phrases).toHaveSize(1); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    expect(ctxAnalyse.erreurs).toHaveSize(1); // erreur car aucun lieu n’est encore défini.

  });

  it('[F007-T022] Élément pos: « a table est un support. Le cadenas bleu est un objet. Il se trouve dessus. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "La table est un support. \n" +
      "Le cadenas bleu est un objet. \n" +
      "Il se trouve dessus. \n" +
      ""
    );
    expect(phrases).toHaveSize(3); // nombre de phrases
    expect(phrases[0].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[1].morceaux).toHaveSize(1); // nombre de morceaux
    expect(phrases[2].morceaux).toHaveSize(1); // nombre de morceaux
    // tester l’analyse complète
    expect(AnalyseurV8Definitions.testerDefinition(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    expect(AnalyseurV8Definitions.testerDefinition(phrases[2], ctxAnalyse)).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctxAnalyse.erreurs).toHaveSize(1); // erreur car le cadenas se référence lui-même.

  });

});