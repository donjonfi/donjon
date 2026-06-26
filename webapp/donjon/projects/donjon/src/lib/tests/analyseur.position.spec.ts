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

import { CodeMessage } from "../models/compilateur/message-analyse";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";
import { CodeMessage } from "../models/compilateur/message-analyse";
import { AnalyseurPosition } from "../utils/compilation/analyseur/analyseur.position";

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
    expect(ctxAnalyse.messages).toHaveSize(1);
    expect(ctxAnalyse.messages[0].code).toBe(CodeMessage.lieuPrealableIntrouvable);

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
    expect(ctxAnalyse.messages).toHaveSize(1);
    expect(ctxAnalyse.messages[0].code).toBe(CodeMessage.elementPrealableIntrouvable);

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


// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F119] AnalyseurPosition — multi-positions, « par rapport à », élément introuvable, « il y a <non-ressource> »
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('[F119] AnalyseurPosition — couverture branches', () => {

  /** Pré-définit des lieux dans le contexte (chaque phrase passée à testerDefinition). */
  function definir(ctx: ContexteAnalyseV8, source: string): void {
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(source);
    phrases.forEach(p => AnalyseurV8Definitions.testerDefinition(p, ctx));
  }

  it('[F119-T001] Multi-positions reliées : « La forêt se trouve au nord du chemin et au sud de l’abri. »', () => {
    const ctx = new ContexteAnalyseV8();
    // L’élément concerné (forêt) doit déjà exister : testerPositionRelative résout
    // l’élément via trouverCorrespondance, sinon les positions ne sont pas attachées.
    definir(ctx, "Le chemin est un lieu. L’abri est un lieu. La forêt est un lieu.");

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "La forêt se trouve au nord du chemin et au sud de l’abri."
    );
    expect(phrases).toHaveSize(1);

    const res = AnalyseurV8Definitions.testerDefinition(phrases[0], ctx);
    expect(res).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctx.erreurs).toHaveSize(0); // aucune erreur
    expect(ctx.messages).toHaveSize(0); // aucun problème signalé

    const foret = ctx.elementsGeneriques.find(e => e.nom === 'forêt' || e.nom === 'foret');
    expect(foret).toBeTruthy();
    // La liste « … et … » est scindée en 2 positions distinctes (branche non-« par rapport »).
    expect(foret.positionString).toHaveSize(2);
    // 1ʳᵉ position : au nord du chemin
    expect(foret.positionString[0].complement).toEqual('chemin');
    expect(foret.positionString[0].position).toEqual('au nord du ');
    // 2ᵉ position : au sud de l’abri
    expect(foret.positionString[1].complement).toEqual('abri');
    expect(foret.positionString[1].position).toEqual('au sud de l’');
  });

  // FINDING (bug moteur) : branche « par rapport à X, Y se trouve au nord … » de
  // AnalyseurPosition.testerPositionElement (analyseur.position.ts:32-48).
  // « Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest. »
  // signifie sémantiquement que LA FORÊT est au nord/sud/ouest DE LA CABANE.
  // Or separerListeIntitulesEt("la cabane, la forêt") renvoie ["la cabane", "la forêt"]
  // et le code prend [0] (cabane) comme élément CONCERNÉ et [1] (forêt) comme COMPLÉMENT.
  // Résultat observé : 3 positions attachées à « cabane » avec complement « forêt »
  // (« la cabane se trouve au nord/sud/ouest de la forêt ») — sujet et complément INVERSÉS.
  // Le test ci-dessous encode la sémantique CORRECTE attendue (3 positions sur « forêt »,
  // complément « cabane ») ; il échoue tant que le bug n’est pas corrigé → xit.
  xit('[F119-T002] (💥 bug) « Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest. » → 3 positions sur la forêt', () => {
    const ctx = new ContexteAnalyseV8();
    definir(ctx, "La cabane est un lieu. La forêt est un lieu.");

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest."
    );
    expect(phrases).toHaveSize(1);

    const res = AnalyseurV8Definitions.testerDefinition(phrases[0], ctx);
    expect(res).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctx.erreurs).toHaveSize(0);

    // Sémantique attendue : la FORÊT est positionnée relativement à la CABANE.
    const foret = ctx.elementsGeneriques.find(e => e.nom === 'forêt' || e.nom === 'foret');
    expect(foret).toBeTruthy();
    expect(foret.positionString).toHaveSize(3); // nord, sud, ouest
    foret.positionString.forEach(p => {
      expect(p.complement).toEqual('cabane'); // toutes relatives à la cabane
    });
  });

  it('[F119-T002b] (état actuel) « Par rapport à la cabane, … » : 3 positions, branche /par rapport/ atteinte', () => {
    // Caractérise le comportement ACTUEL (cf. FINDING T002) : 3 positions créées,
    // analyse sans erreur. Verrouille le passage dans la branche « par rapport » et
    // le découpage en 3 (nord/sud/ouest) ; sujet/complément inversés (documenté en T002).
    const ctx = new ContexteAnalyseV8();
    definir(ctx, "La cabane est un lieu. La forêt est un lieu.");

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest."
    );
    const res = AnalyseurV8Definitions.testerDefinition(phrases[0], ctx);
    expect(res).toBe(ResultatAnalysePhrase.positionElement);
    expect(ctx.erreurs).toHaveSize(0);

    // Les 3 positions sont (à ce jour) attachées à « cabane » (sujet/complément inversés).
    const cabane = ctx.elementsGeneriques.find(e => e.nom === 'cabane');
    expect(cabane).toBeTruthy();
    expect(cabane.positionString).toHaveSize(3); // nord + sud + ouest
    cabane.positionString.forEach(p => {
      expect(p.complement).toEqual('forêt'); // état courant : complément = forêt (cf. FINDING T002)
    });
  });

  it('[F119-T003] Élément concerné introuvable : « Le phare se trouve au nord de la cabane. » (phare jamais défini)', () => {
    const ctx = new ContexteAnalyseV8();
    definir(ctx, "La cabane est un lieu."); // « phare » n’est jamais défini

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Le phare se trouve au nord de la cabane."
    );
    expect(phrases).toHaveSize(1);

    // Appel DIRECT de la branche sous test (analyseur.position.ts) : « phare » n’étant pas
    // défini, trouverCorrespondance renvoie undefined → branche « élément concerné pas trouvé ».
    // (Via testerDefinition complet, un repli testerElementAvecPosition créerait « phare » en
    //  tant que NOUVEL élément — ce n’est pas la branche que l’on couvre ici.)
    const res = AnalyseurPosition.testerPositionElement(phrases[0], ctx);

    // Aucune position n’a pu être attachée → aucun résultat.
    expect(res).toBe(ResultatAnalysePhrase.aucun);
    // L’élément concerné introuvable est signalé via ctx.probleme (canal « messages »),
    // pas via ctx.erreurs : code nomElementCiblePasSupporte.
    expect(ctx.messages.length).toBeGreaterThan(0);
    expect(ctx.messages.some(m => m.code === CodeMessage.nomElementCiblePasSupporte)).toBeTrue();
    // Aucun élément « phare » n’est créé par cette branche.
    expect(ctx.elementsGeneriques.some(e => e.nom === 'phare')).toBeFalse();
  });

  it('[F119-T004] « Il y a des cailloux dans le coffre. » (cailloux non-ressource) → placementNonRessource', () => {
    // « Il y a … » est réservé aux ressources déjà définies. « cailloux » n’en est pas une :
    // testerElementAvecPosition pose ctx.placementNonRessource et ne crée AUCUN objet.
    const ctx = new ContexteAnalyseV8();
    definir(ctx, "La salle est un lieu. Le coffre est un contenant ici.");

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Il y a des cailloux dans le coffre."
    );
    expect(phrases).toHaveSize(1);

    // Appel DIRECT (testerDefinition consommerait et remettrait placementNonRessource à null).
    const el = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctx);
    expect(el).toBeNull(); // aucun élément retourné
    expect(ctx.placementNonRessource).toEqual('cailloux'); // nom non-ressource mémorisé
    expect(ctx.elementsGeneriques.some(e => e.nom === 'cailloux')).toBeFalse(); // aucun objet créé
  });

  it('[F119-T005] « Il y a des cailloux dans le coffre. » via testerDefinition → message « Ressource attendue »', () => {
    // Au niveau testerDefinition, placementNonRessource est converti en UN message bien
    // formaté (nomElementCiblePasSupporte) puis remis à null ; la phrase est considérée traitée.
    const ctx = new ContexteAnalyseV8();
    definir(ctx, "La salle est un lieu. Le coffre est un contenant ici.");

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      "Il y a des cailloux dans le coffre."
    );
    const res = AnalyseurV8Definitions.testerDefinition(phrases[0], ctx);
    expect(res).toBe(ResultatAnalysePhrase.elementAvecPosition); // phrase considérée traitée
    expect(ctx.placementNonRessource).toBeNull(); // consommé par testerDefinition
    expect(ctx.messages.some(m => m.code === CodeMessage.nomElementCiblePasSupporte)).toBeTrue();
    expect(ctx.elementsGeneriques.some(e => e.nom === 'cailloux')).toBeFalse();
  });

});