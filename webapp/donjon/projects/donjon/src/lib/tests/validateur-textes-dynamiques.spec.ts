import { CategorieMessage, CodeMessage, EMessageAnalyse } from "../models/compilateur/message-analyse";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ERoutine } from "../models/compilateur/routine";
import { Phrase } from "../models/compilateur/phrase";
import { ValidateurTextesDynamiques } from "../utils/compilation/validateur-textes-dynamiques";

/**
 * Tests unitaires du validateur de structure des crochets dans les textes
 * dynamiques (passe de compilation).
 */

function fakePhrase(ligne = 42): Phrase {
  return new Phrase([], false, undefined, 0, ligne, true, ERoutine.aucun);
}

function valider(texte: string): ContexteAnalyseV8 {
  const ctx = new ContexteAnalyseV8(false);
  ValidateurTextesDynamiques.validerTexte(texte, fakePhrase(), ctx);
  return ctx;
}

function codes(ctx: ContexteAnalyseV8): CodeMessage[] {
  return ctx.messages.map(m => m.code);
}

describe("Validateur des textes dynamiques", () => {

  // ───────── cas valides : aucun message attendu ─────────

  it("texte sans crochets → aucun message", () => {
    expect(valider("Bonjour le monde.").messages.length).toBe(0);
  });

  it("[si …]…[sinon]…[fin] équilibré → aucun message", () => {
    expect(valider("[si X est Y]A[sinon]B[fin]").messages.length).toBe(0);
  });

  it("imbrication [si]…[si]…[fin]…[fin] → aucun message", () => {
    expect(valider("[si A]ext[si B]int[fin]suite[fin]").messages.length).toBe(0);
  });

  it("[au hasard]…[ou]…[fin] → aucun message", () => {
    expect(valider("[au hasard]A[ou]B[ou]C[fin]").messages.length).toBe(0);
  });

  it("[1ere fois]…[puis]…[fin] → aucun message", () => {
    expect(valider("[1ere fois]un[puis]plus[fin]").messages.length).toBe(0);
  });

  it("balise propriété [nom de X] → ignorée (mot-clé inconnu)", () => {
    expect(valider("Voici [nom de truc].").messages.length).toBe(0);
  });

  it("crochets littéraux échappés \\[…\\] → aucun message", () => {
    expect(valider("Voir \\[exemple\\] pour plus.").messages.length).toBe(0);
  });

  // ───────── cas d'erreur ─────────

  it("crochet ouvrant non fermé → crochetOuvrantNonFerme", () => {
    expect(codes(valider("hello [si A est B"))).toContain(CodeMessage.crochetOuvrantNonFerme);
  });

  it("crochet fermant orphelin → crochetFermantOrphelin", () => {
    expect(codes(valider("hello]suite"))).toContain(CodeMessage.crochetFermantOrphelin);
  });

  it("[fin] sans cadre ouvert → finBlocSansOuverture", () => {
    expect(codes(valider("hello[fin]"))).toContain(CodeMessage.finBlocSansOuverture);
  });

  it("[sinon] sans [si] → motCleHorsCadre", () => {
    expect(codes(valider("hello[sinon]bye"))).toContain(CodeMessage.motCleHorsCadre);
  });

  it("[sinon] dans [au hasard] → motCleHorsCadre", () => {
    expect(codes(valider("[au hasard]A[sinon]B[fin]"))).toContain(CodeMessage.motCleHorsCadre);
  });

  it("[ou] hors [au hasard] → motCleHorsCadre", () => {
    expect(codes(valider("[si A est B]hello[ou]bye[fin]"))).toContain(CodeMessage.motCleHorsCadre);
  });

  it("[sinon] après un autre [sinon] → sinonApresSinon", () => {
    expect(codes(valider("[si A]X[sinon]Y[sinon]Z[fin]"))).toContain(CodeMessage.sinonApresSinon);
  });

  it("[sinonsi …] après un [sinon] → sinonApresSinon", () => {
    expect(codes(valider("[si A]X[sinon]Y[sinonsi B]Z[fin]"))).toContain(CodeMessage.sinonApresSinon);
  });

  it("cadre ouvert non fermé → cadreNonFerme", () => {
    expect(codes(valider("[si A est B]hello"))).toContain(CodeMessage.cadreNonFerme);
  });

  it("messages sont rattachés au numéro de ligne de la phrase source", () => {
    const ctx = new ContexteAnalyseV8(false);
    ValidateurTextesDynamiques.validerTexte("[si A est B]hello", fakePhrase(123), ctx);
    expect(ctx.messages.length).toBeGreaterThan(0);
    expect(ctx.messages[0].numeroLigne).toBe(123);
    expect(ctx.messages[0].categorie).toBe(CategorieMessage.syntaxeDynamique);
    expect(ctx.messages[0].type).toBe(EMessageAnalyse.probleme);
  });

});
