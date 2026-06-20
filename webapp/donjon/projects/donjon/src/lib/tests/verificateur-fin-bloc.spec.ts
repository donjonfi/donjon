import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ERoutine } from "../models/compilateur/routine";
import { Verificateur } from "../utils/compilation/verificateur";

/**
 * F118 — Vérificateur : fermeture de bloc (routine/règle/action/réaction) et
 * détection de mismatch « Le fin <X> n’est pas attendu ici. ».
 *
 * Cible : `Verificateur.estFinRoutine` et le garde-fou de bloc resté ouvert
 * (`verifierRoutines` → `forcerFermetureRoutine`).
 *
 * Wording RÉEL (verificateur.ts:95) :
 *   "Le fin " + Routine.TypeToNom(typeRoutine) + " n’est pas attendu ici."   (apostrophe U+2019)
 *   TypeToNom: action→"action", règle→"règle", réaction→"réaction", routine→"routine simple".
 *
 * Les erreurs atterrissent dans `ctx.erreurs` (string[]), préfixées
 * "NNNNN : " par `ajouterErreur` → on assert via `.some(e => e.includes(...))`.
 */

/** Vrai si une des erreurs contient le fragment donné. */
function aErreurContenant(ctx: ContexteAnalyseV8, fragment: string): boolean {
  return ctx.erreurs.some(e => e.includes(fragment));
}

describe('F118 — Vérificateur : fin de bloc (estFinRoutine, mismatch)', () => {

  // -----------------------------------------------------------------------
  // estFinRoutine appelé directement : une seule branche, une seule erreur.
  // On pré-amorce le ctx en appelant estNouvelleRoutine sur le MÊME ctx pour
  // ouvrir une routine, puis on présente un « fin <X> » (mis)matché.
  // -----------------------------------------------------------------------

  it('[F118-T001] action ouverte fermée par « fin règle » → mismatch « Le fin règle n’est pas attendu ici. »', () => {
    const ctx = new ContexteAnalyseV8();
    const phrasesOuverture = CompilateurV8Utils.convertirCodeSourceEnPhrases('action nager:');
    const phrasesFin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin règle');

    // ouvre l’action sur ce ctx
    expect(Verificateur.estNouvelleRoutine(phrasesOuverture[0], ctx)).toBeTrue();
    expect(ctx.derniereRoutine?.type).toBe(ERoutine.action);
    expect(ctx.derniereRoutine?.ouvert).toBeTrue();

    // « fin règle » : c’est bien une fin de routine reconnue (return true)…
    expect(Verificateur.estFinRoutine(phrasesFin[0], ctx)).toBeTrue();
    // …mais elle ne correspond pas au type ouvert → erreur de mismatch
    expect(ctx.erreurs).toHaveSize(1);
    expect(aErreurContenant(ctx, 'Le fin règle n’est pas attendu ici.')).toBeTrue();
    // un mismatch NE ferme PAS le bloc : il reste ouvert
    expect(ctx.derniereRoutine?.ouvert).toBeTrue();
    expect(ctx.derniereRoutine?.correctementFini).toBeFalse();
  });

  it('[F118-T002] règle ouverte fermée par « fin action » → « Le fin action n’est pas attendu ici. »', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('règle avant manger ceci:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin action');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(ctx.derniereRoutine?.type).toBe(ERoutine.regle);

    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(1);
    expect(aErreurContenant(ctx, 'Le fin action n’est pas attendu ici.')).toBeTrue();
    expect(ctx.derniereRoutine?.ouvert).toBeTrue();
  });

  it('[F118-T003] routine simple ouverte fermée par « fin règle » → « Le fin règle n’est pas attendu ici. »', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('routine afficher score:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin règle');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(ctx.derniereRoutine?.type).toBe(ERoutine.simple);

    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(1);
    expect(aErreurContenant(ctx, 'Le fin règle n’est pas attendu ici.')).toBeTrue();
  });

  it('[F118-T004] « fin routine » mismatché → wording « Le fin routine simple n’est pas attendu ici. »', () => {
    // ParseType("routine") → ERoutine.simple ; TypeToNom(simple) → "routine simple".
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('action nager:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin routine');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(1);
    // le wording reflète « routine simple », pas « routine »
    expect(aErreurContenant(ctx, 'Le fin routine simple n’est pas attendu ici.')).toBeTrue();
  });

  it('[F118-T005] « fin réaction » mismatché → « Le fin réaction n’est pas attendu ici. »', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('action nager:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin réaction');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(1);
    expect(aErreurContenant(ctx, 'Le fin réaction n’est pas attendu ici.')).toBeTrue();
  });

  it('[F118-T006] « fin règle » sur pile vide (aucune routine ouverte) → mismatch, aucun plantage', () => {
    // derniereRoutine === undefined → ferme = false → erreur « pas attendu ici ».
    const ctx = new ContexteAnalyseV8();
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin règle');

    expect(ctx.derniereRoutine).toBeUndefined();
    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(1);
    expect(aErreurContenant(ctx, 'Le fin règle n’est pas attendu ici.')).toBeTrue();
    // aucune routine créée
    expect(ctx.routines).toHaveSize(0);
  });

  // -----------------------------------------------------------------------
  // Contrôles négatifs : fermeture correcte → estFinRoutine true, AUCUNE erreur.
  // -----------------------------------------------------------------------

  it('[F118-T007] action ouverte fermée par « fin action » → aucune erreur, bloc clôturé', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('action nager:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin action');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(0);
    expect(ctx.derniereRoutine?.ouvert).toBeFalse();
    expect(ctx.derniereRoutine?.correctementFini).toBeTrue();
  });

  it('[F118-T008] règle ouverte fermée par « fin règle » → aucune erreur', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('règle avant manger ceci:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin règle');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(0);
    expect(ctx.derniereRoutine?.correctementFini).toBeTrue();
  });

  it('[F118-T009] « La plante est un objet. » n’est pas une fin de routine', () => {
    // branche fermetureRoutine === null → estFinRoutine renvoie false.
    const ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases('La plante est un objet.');
    expect(Verificateur.estFinRoutine(phrases[0], ctx)).toBeFalse();
    expect(ctx.erreurs).toHaveSize(0);
  });

  // -----------------------------------------------------------------------
  // Cas spécial « règle remplacer <verbe> » : bloc interne de type action,
  // mais qui accepte AUSSI « fin règle » (2e terme du OR `ferme`).
  // -----------------------------------------------------------------------

  it('[F118-T010] « règle remplacer nager » fermée par « fin règle » → aucune erreur (viaRegleRemplacer)', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('règle remplacer nager:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin règle');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    // type interne = action, mais ouvert via règle remplacer
    expect(ctx.derniereRoutine?.type).toBe(ERoutine.action);
    expect(ctx.derniereRoutine?.viaRegleRemplacer).toBeTrue();

    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(0);
    expect(ctx.derniereRoutine?.correctementFini).toBeTrue();
  });

  it('[F118-T011] « règle remplacer nager » fermée par « fin action » → aussi accepté, aucune erreur', () => {
    const ctx = new ContexteAnalyseV8();
    const ouv = CompilateurV8Utils.convertirCodeSourceEnPhrases('règle remplacer nager:');
    const fin = CompilateurV8Utils.convertirCodeSourceEnPhrases('fin action');

    expect(Verificateur.estNouvelleRoutine(ouv[0], ctx)).toBeTrue();
    expect(ctx.derniereRoutine?.type).toBe(ERoutine.action);

    expect(Verificateur.estFinRoutine(fin[0], ctx)).toBeTrue();
    expect(ctx.erreurs).toHaveSize(0);
    expect(ctx.derniereRoutine?.correctementFini).toBeTrue();
  });

  // -----------------------------------------------------------------------
  // Intégration via verifierRoutines : un mismatch produit DEUX erreurs
  // (1 mismatch + 1 « fin <X> manquant » car le bloc reste ouvert puis est
  // forcé-fermé en fin de parcours). Comportement légitime à garder sous garde.
  // -----------------------------------------------------------------------

  it('[F118-T012] verifierRoutines: action fermée par « fin règle » → 2 erreurs (mismatch + manquant)', () => {
    const ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `action nager:
  dire "Vous nagez".
fin règle`
    );

    Verificateur.verifierRoutines(phrases, ctx);

    // mismatch sur le « fin règle » + bloc action resté ouvert puis forcé-fermé
    expect(ctx.erreurs).toHaveSize(2);
    expect(aErreurContenant(ctx, 'Le fin règle n’est pas attendu ici.')).toBeTrue();
    expect(aErreurContenant(ctx, '« fin action » manquant')).toBeTrue();

    // la routine action existe, restée non correctement finie
    expect(ctx.routines).toHaveSize(1);
    expect(ctx.routines[0].type).toBe(ERoutine.action);
    expect(ctx.routines[0].ouvert).toBeFalse();
    expect(ctx.routines[0].correctementFini).toBeFalse();
  });

  it('[F118-T013] verifierRoutines: règle remplacer fermée par « fin règle » → aucune erreur', () => {
    const ctx = new ContexteAnalyseV8();
    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      `règle remplacer nager:
  dire "Plouf".
fin règle`
    );

    Verificateur.verifierRoutines(phrases, ctx);

    expect(ctx.erreurs).toHaveSize(0);
    expect(ctx.routines).toHaveSize(1);
    expect(ctx.routines[0].type).toBe(ERoutine.action);
    expect(ctx.routines[0].viaRegleRemplacer).toBeTrue();
    expect(ctx.routines[0].correctementFini).toBeTrue();
  });

});
