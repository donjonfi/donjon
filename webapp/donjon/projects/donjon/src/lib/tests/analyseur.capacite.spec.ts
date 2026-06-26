import { AnalyseurCapacite } from "../utils/compilation/analyseur/analyseur.capacite";
import { AnalyseurElementSimple } from "../utils/compilation/analyseur/analyseur.element.simple";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../utils/compilation/expr-reg";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    F115 — ANALYSEUR : CAPACITÉ (« Il permet de <verbe> <complément> »)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//
// Cible : AnalyseurCapacite.testerPourCapacite (couverture branches 0 %).
//   const result = ExprReg.xCapacite.exec(phrase.morceaux[0]);
//   if (result) {
//     const capacite = new Capacite(result[1], (result[2] ? result[2].trim() : null));
//     ctxAnalyse.dernierElementGenerique.capacites.push(capacite);
//     elementTrouve = ResultatAnalysePhrase.capacite;
//   }
//   return elementTrouve;
//
// Regex (expr-reg.ts §xCapacite) :
//   /^(?:(?:(?:il|elle) permet)|(?:(?:ils|elles) permettent)) (?:de |d(?:'|’))(se \S+|\S+)( .+|)/i
//     - groupe 1 (verbe)      : "se \S+"  ou  "\S+"
//     - groupe 2 (complément) : " .+"     ou  "" (chaîne vide)
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

// Helper : construit un contexte d’analyse avec un dernier élément générique réel
// (un objet « couteau »), prêt à recevoir des capacités.
function contexteAvecDernierElement(): ContexteAnalyseV8 {
  const ctx = new ContexteAnalyseV8();
  const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
    `Le couteau est un objet.`
  );
  const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctx);
  expect(el).not.toBeNull(); // pré-condition : élément créé
  ctx.dernierElementGenerique = el;
  return ctx;
}

describe('Analyseur − Capacité (« Il permet de … »)', () => {

  // =========================================================
  // GROUPE 1 — BRANCHE « match » : verbe + complément
  // =========================================================

  it('[F115-T001] « Il permet de couper le pain. » → 1 capacité, verbe « couper »', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il permet de couper le pain.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite); // capacité reconnue
    expect(ctx.dernierElementGenerique.capacites).toHaveSize(1); // une capacité ajoutée
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('couper'); // \S+ s’arrête au 1er espace
    // complément = groupe 2 (« le pain… ») trimmé ; on vérifie sémantiquement
    // (le morceau peut conserver ou non le point final selon le découpage).
    expect(cap.complement).toContain('le pain');
    expect(cap.complement).toEqual(cap.complement.trim()); // .trim() appliqué (pas d’espace de tête/fin)
  });

  // =========================================================
  // GROUPE 2 — VERBE PRONOMINAL (alternative « se \S+ » du groupe 1)
  // =========================================================

  it('[F115-T002] « Il permet de se déplacer rapidement. » → verbe pronominal « se déplacer »', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il permet de se déplacer rapidement.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    expect(ctx.dernierElementGenerique.capacites).toHaveSize(1);
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('se déplacer'); // branche « se \S+ » du groupe 1
    expect(cap.complement).toContain('rapidement');
  });

  // =========================================================
  // GROUPE 3 — INFINITIFS 2e / 3e groupe
  // =========================================================

  it('[F115-T003] « Il permet de finir la tâche. » → infinitif 2e groupe « finir »', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il permet de finir la tâche.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('finir');
    expect(cap.complement).toContain('la tâche');
  });

  it('[F115-T004] « Il permet de prendre une décision. » → infinitif 3e groupe « prendre »', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il permet de prendre une décision.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('prendre');
    expect(cap.complement).toContain('une décision');
  });

  // =========================================================
  // GROUPE 4 — VERBE SEUL (groupe 2 = chaîne vide → complément null)
  // =========================================================

  it('[F115-T005] « Il permet de voler. » → verbe seul, complément null', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il permet de voler.`
    );
    // Le regex : groupe 1 = "voler." (\S+ avale le point, pas d’espace),
    // groupe 2 = "" (chaîne vide). Branche « result[2] ? … : null » → null.
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    expect(ctx.dernierElementGenerique.capacites).toHaveSize(1);
    const cap = ctx.dernierElementGenerique.capacites[0];
    // \S+ inclut le point final car il n’y a pas d’espace après le verbe.
    expect(cap.verbe).toContain('voler');
    expect(cap.complement).toBeNull(); // groupe 2 vide ⇒ null (branche else du ternaire)
  });

  // =========================================================
  // GROUPE 5 — ÉLISION « d’ » + variante « elle permet »
  // =========================================================

  it('[F115-T006] « Elle permet d’ouvrir la porte. » → élision + « elle permet »', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Elle permet d’ouvrir la porte.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('ouvrir'); // verbe après élision d’
    expect(cap.complement).toContain('la porte');
  });

  // =========================================================
  // GROUPE 6 — PLURIEL « ils/elles permettent »
  // =========================================================

  it('[F115-T007] « Ils permettent de monter au sommet. » → forme plurielle', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Ils permettent de monter au sommet.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.capacite);
    const cap = ctx.dernierElementGenerique.capacites[0];
    expect(cap.verbe).toEqual('monter');
    expect(cap.complement).toContain('au sommet');
  });

  // =========================================================
  // GROUPE 7 — ACCUMULATION : plusieurs capacités sur le même élément
  // =========================================================

  it('[F115-T008] Deux phrases « permet » successives → 2 capacités cumulées', () => {
    const ctx = contexteAvecDernierElement();

    const p1 = CompilateurV8Utils.convertirCodeSourceEnPhrases(`Il permet de couper le pain.`);
    AnalyseurCapacite.testerPourCapacite(p1[0], ctx);
    const p2 = CompilateurV8Utils.convertirCodeSourceEnPhrases(`Il permet de trancher la viande.`);
    AnalyseurCapacite.testerPourCapacite(p2[0], ctx);

    expect(ctx.dernierElementGenerique.capacites).toHaveSize(2); // push cumulatif
    expect(ctx.dernierElementGenerique.capacites[0].verbe).toEqual('couper');
    expect(ctx.dernierElementGenerique.capacites[1].verbe).toEqual('trancher');
  });

  // =========================================================
  // GROUPE 8 — BRANCHE « no match » : phrase non-capacité ⇒ aucun
  // =========================================================

  it('[F115-T009] « Il est rouge. » (pas une capacité) → ResultatAnalysePhrase.aucun', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Il est rouge.`
    );
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.aucun); // pas de match ⇒ branche else (aucun)
    expect(ctx.dernierElementGenerique.capacites).toHaveSize(0); // rien ajouté
  });

  it('[F115-T010] « Le couteau permet de couper. » (sujet nominal, pas il/elle) → aucun', () => {
    const ctx = contexteAvecDernierElement();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `Le couteau permet de couper.`
    );
    // Le regex est ancré sur il/elle/ils/elles ; un sujet nominal ne matche pas.
    const res = AnalyseurCapacite.testerPourCapacite(phrases[0], ctx);

    expect(res).toBe(ResultatAnalysePhrase.aucun);
    expect(ctx.dernierElementGenerique.capacites).toHaveSize(0);
  });

  // =========================================================
  // GROUPE 9 — VALIDATION DIRECTE DU REGEX (pin de la sémantique des groupes)
  // =========================================================

  it('[F115-T011] xCapacite.exec : groupes verbe / complément pour « il permet de couper le pain »', () => {
    const m = ExprReg.xCapacite.exec('il permet de couper le pain');
    expect(m).not.toBeNull();
    expect(m[1]).toEqual('couper'); // groupe 1 : verbe (\S+ borné à l’espace)
    expect(m[2]).toEqual(' le pain'); // groupe 2 : complément, espace de tête inclus (trimmé par l’analyseur)
  });

  it('[F115-T012] xCapacite.exec : verbe seul « il permet de voler » → groupe 2 vide', () => {
    const m = ExprReg.xCapacite.exec('il permet de voler');
    expect(m).not.toBeNull();
    expect(m[1]).toEqual('voler'); // pas d’espace ⇒ \S+ = tout le verbe
    expect(m[2]).toEqual(''); // groupe 2 = chaîne vide (alternative vide de « .+| »)
  });

});
