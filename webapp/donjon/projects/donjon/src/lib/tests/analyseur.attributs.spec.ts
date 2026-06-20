import { AnalyseurAttributs } from "../utils/compilation/analyseur/analyseur.attributs";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ElementGenerique } from "../models/compilateur/element-generique";
import { ERoutine } from "../models/compilateur/routine";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";
import { Phrase } from "../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F114] ANALYSEUR — ATTRIBUTS (pronom démonstratif / pronom personnel)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//
// On teste directement AnalyseurAttributs.testerPronomDemonstratifTypeAttributs et
// testerPronomPersonnelAttributs. Ces deux fonctions complètent le « dernier élément générique »
// (ctxAnalyse.dernierElementGenerique) du contexte d'analyse :
//  - « C’est un <type> <attributs> » → définit la classe (classeIntitule) + ajoute des attributs ;
//  - « Il/Elle est <attributs> »     → ajoute des attributs + déduit le genre du pronom.
//
// On prépare donc un élément générique « précédent » (un objet sans type, sans attribut, de genre
// neutre), on lui applique une phrase, et on vérifie la sémantique de la mutation + la valeur de
// retour (ResultatAnalysePhrase).
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

/** Fabrique un « dernier élément générique » vierge : objet sans type/attribut, genre neutre. */
function elementVierge(nom: string): ElementGenerique {
  return new ElementGenerique(
    'le ',          // determinant
    nom,            // nom
    undefined,      // epithete
    null,           // classeIntitule (pas encore de type)
    null,           // classe
    [],             // _positionString
    Genre.n,        // genre neutre au départ → permet de prouver la déduction de genre
    Nombre.s,       // nombre
    1,              // quantite
    [],             // attributs : aucun au départ
  );
}

/** Fabrique une Phrase mono-morceau à partir d'un texte brut (sans point final). */
function phrase(texte: string): Phrase {
  return new Phrase([texte], false, null, 0, 0, true, ERoutine.aucun);
}

describe('Analyseur − Attributs via pronom démonstratif (« C’est un <type> <attributs> »)', () => {

  it('[F114-T001] « C’est un outil lourd et solide » : type=outil + attributs ⊇ [lourd, solide]', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('marteau');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(
      phrase('C’est un outil lourd et solide'), ctx,
    );

    // valeur de retour
    expect(resultat).toBe(ResultatAnalysePhrase.pronomDemontratifTypeAttribut);
    // type (classe) défini sur l'élément précédent
    expect(el.classeIntitule).toEqual('outil');
    // attributs ajoutés (reliés par « et »)
    expect(el.attributs).toContain('lourd');
    expect(el.attributs).toContain('solide');
    expect(el.attributs).toHaveSize(2);
  });

  it('[F114-T002] « C’est une porte verrouillée » (féminin singulier) : type=porte + attribut ⊇ [verrouillée]', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('entrée');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(
      phrase('C’est une porte verrouillée'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomDemontratifTypeAttribut);
    expect(el.classeIntitule).toEqual('porte');
    expect(el.attributs).toContain('verrouillée');
    expect(el.attributs).toHaveSize(1);
  });

  it('[F114-T003] « C’est un outil » (type seul, sans attribut) : type=outil, aucun attribut ajouté', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('marteau');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(
      phrase('C’est un outil'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomDemontratifTypeAttribut);
    expect(el.classeIntitule).toEqual('outil');
    // le groupe attributs est optionnel → reste vide
    expect(el.attributs).toHaveSize(0);
  });

  it('[F114-T004] « Ce sont des fruits mûrs » (pluriel) : type=fruits + attribut ⊇ [mûrs]', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('panier');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(
      phrase('Ce sont des fruits mûrs'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomDemontratifTypeAttribut);
    expect(el.classeIntitule).toEqual('fruits');
    expect(el.attributs).toContain('mûrs');
    expect(el.attributs).toHaveSize(1);
  });

  it('[F114-T005] branche FAUX : « Il est rouge » ne matche PAS le pronom démonstratif → aucun', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('ballon');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomDemonstratifTypeAttributs(
      phrase('Il est rouge'), ctx,
    );

    // pas un pronom démonstratif → aucun, et l'élément n'est pas modifié
    expect(resultat).toBe(ResultatAnalysePhrase.aucun);
    expect(el.classeIntitule).toBeNull();
    expect(el.attributs).toHaveSize(0);
  });

});

describe('Analyseur − Attributs via pronom personnel (« Il/Elle est <attributs> »)', () => {

  it('[F114-T006] « Elle est rouillée et fragile » : attributs ⊇ [rouillée, fragile] + genre féminin', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('clé');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomPersonnelAttributs(
      phrase('Elle est rouillée et fragile'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomPersonnelAttribut);
    expect(el.attributs).toContain('rouillée');
    expect(el.attributs).toContain('fragile');
    expect(el.attributs).toHaveSize(2);
    // genre déduit du pronom « Elle » → féminin
    expect(el.genre).toEqual(Genre.f);
  });

  it('[F114-T007] « Il est lourd » : attribut ⊇ [lourd] + genre masculin', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('coffre');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomPersonnelAttributs(
      phrase('Il est lourd'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomPersonnelAttribut);
    expect(el.attributs).toContain('lourd');
    expect(el.attributs).toHaveSize(1);
    // genre déduit du pronom « Il » → masculin
    expect(el.genre).toEqual(Genre.m);
  });

  it('[F114-T008] « Elle est rouge, lisse et froide » (virgule + et) : attributs ⊇ [rouge, lisse, froide]', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('bille');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomPersonnelAttributs(
      phrase('Elle est rouge, lisse et froide'), ctx,
    );

    expect(resultat).toBe(ResultatAnalysePhrase.pronomPersonnelAttribut);
    expect(el.attributs).toContain('rouge');
    expect(el.attributs).toContain('lisse');
    expect(el.attributs).toContain('froide');
    expect(el.attributs).toHaveSize(3);
    expect(el.genre).toEqual(Genre.f);
  });

  it('[F114-T009] branche FAUX : « C’est un outil » ne matche PAS le pronom personnel → aucun', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('marteau');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomPersonnelAttributs(
      phrase('C’est un outil'), ctx,
    );

    // pas un pronom personnel → aucun, élément intact (genre neutre conservé)
    expect(resultat).toBe(ResultatAnalysePhrase.aucun);
    expect(el.attributs).toHaveSize(0);
    expect(el.genre).toEqual(Genre.n);
  });

  // FINDING (bug moteur suspecté) : « Il est un outil » devrait être interprété comme une DÉFINITION
  // de type (« <élément> est un outil »), PAS comme une liste d'attributs. La regex
  // ExprReg.xPronomPersonnelAttribut place sa garde négative (?!une |un |des ) AVANT l'espace capturé,
  // si bien qu'elle est évaluée à la position de l'espace (juste après « est ») et ne voit jamais le
  // « un » qui suit. La garde est donc inopérante : « Il est un outil » matche et « un outil » est
  // ajouté comme attribut (de même « Elle est une clé », « Il est des trucs », etc.).
  // Comportement INTENDU testé ici → la fonction ne devrait pas matcher (retour « aucun », aucun attribut).
  // Pour fonctionner, la garde devrait suivre l'espace : « ( (?!une |un |des )(?:.+...)) ».
  xit('[F114-T010] FINDING: « Il est un outil » ne devrait PAS être pris comme attributs (garde négative inopérante)', () => {
    const ctx = new ContexteAnalyseV8();
    const el = elementVierge('marteau');
    ctx.dernierElementGenerique = el;

    const resultat = AnalyseurAttributs.testerPronomPersonnelAttributs(
      phrase('Il est un outil'), ctx,
    );

    // INTENDU : « un outil » est un type, pas un attribut → la fonction ne devrait rien matcher.
    expect(resultat).toBe(ResultatAnalysePhrase.aucun);
    expect(el.attributs).toHaveSize(0);
  });

});
