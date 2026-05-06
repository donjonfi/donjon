import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Tests pour les conditions [] imbriquées dans les textes dynamiques.
 *
 * Ces tests vérifient que `[si A]…[si B]…[fin]…[fin]`, `[si A]…[au hasard]…[fin]…[fin]`,
 * etc. se comportent correctement (le mot-clé `[fin]` interne ne doit fermer que
 * le bloc le plus interne, sans affecter le bloc externe).
 */

const baseScenario = (descriptionMachine: string, etats: string) => `
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  La machine est un objet dans le salon.
  ${etats}
  Sa description est "${descriptionMachine}".
`;

function preparerJeu(scenario: string) {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
  const jeu = Generateur.genererJeu(rc);
  const ctxPartie = new ContextePartie(jeu);
  ctxPartie.com.executerCommande("commencer le jeu", true);
  return ctxPartie;
}

describe("Conditions imbriquées dans les textes dynamiques", () => {

  it("[F031-T001] si imbriqué dans si — branche externe vraie + branche interne vraie", () => {
    const desc = "Une machine [si la machine est allumée]allumée[si la machine est ouverte] et ouverte[sinon] mais fermée[fin][sinon]éteinte[fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est allumée et ouverte."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("allumée");
    expect(sortie).toContain("et ouverte");
    expect(sortie).not.toContain("éteinte");
    expect(sortie).not.toContain("fermée");
  });

  it("[F031-T002] si imbriqué dans si — branche externe vraie + branche interne fausse", () => {
    const desc = "Une machine [si la machine est allumée]allumée[si la machine est ouverte] et ouverte[sinon] mais fermée[fin][sinon]éteinte[fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est allumée et fermée."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("allumée");
    expect(sortie).toContain("mais fermée");
    expect(sortie).not.toContain("éteinte");
    expect(sortie).not.toContain("et ouverte");
  });

  it("[F031-T003] si imbriqué dans si — branche externe fausse (le si interne ne doit pas être affiché)", () => {
    const desc = "Une machine [si la machine est allumée]allumée[si la machine est ouverte] et ouverte[sinon] mais fermée[fin][sinon]éteinte[fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est éteinte et ouverte."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("éteinte");
    expect(sortie).not.toContain("allumée");
    expect(sortie).not.toContain("et ouverte");
    expect(sortie).not.toContain("mais fermée");
  });

  it("[F031-T004] si imbriqué dans le sinon d’un autre si", () => {
    const desc = "Une machine [si la machine est allumée]allumée[sinon][si la machine est ouverte]éteinte mais ouverte[sinon]éteinte et fermée[fin][fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est éteinte et ouverte."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("éteinte mais ouverte");
    expect(sortie).not.toContain("allumée");
    expect(sortie).not.toContain("éteinte et fermée");
  });

  it("[F031-T005] trois niveaux d’imbrication", () => {
    const desc = "Machine [si la machine est allumée]A[si la machine est ouverte]B[si la machine est cassée]C[fin][fin][fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est allumée, ouverte et cassée."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("A");
    expect(sortie).toContain("B");
    expect(sortie).toContain("C");
  });

  it("[F031-T006] sinonsi à un niveau imbriqué — le sinonsi ne ferme pas le si externe", () => {
    const desc = "M [si la machine est allumée]EXT[si la machine est ouverte]inner-O[sinonsi la machine est cassée]inner-V[sinon]inner-X[fin] suite-EXT[sinon]NON-EXT[fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est allumée. La machine est fermée. La machine est cassée."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("EXT");
    expect(sortie).toContain("inner-V");
    expect(sortie).toContain("suite-EXT");
    expect(sortie).not.toContain("NON-EXT");
    expect(sortie).not.toContain("inner-O");
    expect(sortie).not.toContain("inner-X");
  });

  it("[F031-T007] régression — Xe fois séquentiels au même niveau (pas une imbrication)", () => {
    // [1ere fois]…[2eme fois]…[puis]…[fin] doit afficher un, puis deux, puis plus.
    const desc = "[1ere fois]un[2eme fois]deux[puis]plus[fin].";
    const ctx = preparerJeu(baseScenario(desc, ""));
    expect(ctx.com.executerCommande("examiner machine", false).sortie).toContain("un");
    expect(ctx.com.executerCommande("examiner machine", false).sortie).toContain("deux");
    expect(ctx.com.executerCommande("examiner machine", false).sortie).toContain("plus");
  });

  it("[F031-T008] régression — [1ere fois]A[puis]B[fin] (raccourci à deux branches)", () => {
    const desc = "[1ere fois]A[puis]B[fin].";
    const ctx = preparerJeu(baseScenario(desc, ""));
    const s1 = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(s1).toContain("A");
    expect(s1).not.toContain("B");
    const s2 = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(s2).toContain("B");
    expect(s2).not.toContain("A");
  });

  it("[F031-T009] régression — condition simple à un seul niveau", () => {
    const desc = "Une machine [si la machine est allumée]allumée[sinon]éteinte[fin].";
    const ctx = preparerJeu(baseScenario(desc, "La machine est allumée."));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("allumée");
    expect(sortie).not.toContain("éteinte");
  });

});
