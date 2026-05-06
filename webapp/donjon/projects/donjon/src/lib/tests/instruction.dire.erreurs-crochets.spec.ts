import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Tests pour le reporting d’erreurs au RUNTIME lors de l’interprétation des
 * crochets de conditions dans un texte dynamique. Les erreurs structurelles
 * sont normalement attrapées à la compilation ; il reste les erreurs sémantiques
 * (condition non comprise) qui doivent être visibles pour l’auteur.
 */

const baseScenario = (descriptionMachine: string) => `
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  La machine est un objet dans le salon.
  Sa description est "${descriptionMachine}".
`;

function preparerJeu(scenario: string) {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
  const jeu = Generateur.genererJeu(rc);
  const ctxPartie = new ContextePartie(jeu);
  ctxPartie.com.executerCommande("commencer le jeu", true);
  return ctxPartie;
}

describe("Erreurs runtime des crochets de conditions", () => {

  it("condition non comprise → tamponErreurs alimenté + marqueur inline", () => {
    // syntaxe clairement invalide : `getConditionMulti` ne pourra pas la parser.
    const desc = "Machine [si === ===]A[sinon]B[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(erreursAvant);
    // Le marqueur inline rouge gras `{+{/…/}+}` est présent dans la sortie.
    expect(sortie).toContain("{+{/[si === === ?]/}+}");
  });

  it("condition simple valide → aucune erreur runtime", () => {
    const desc = "Machine [si la machine est visible]ok[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    ctx.com.executerCommande("examiner machine", false);
    expect(ctx.jeu.tamponErreurs.length).toBe(erreursAvant);
  });

  it("sujet introuvable dans condition → tamponErreurs alimenté + pas de plantage", () => {
    // « pommet » n'existe pas dans le scénario ; la condition doit être
    // signalée dans le tampon d’erreurs mais le rendu doit continuer.
    const desc = "Machine [si pommet est disponible]A[sinon]B[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(erreursAvant);
    // le sujet introuvable doit être nommé dans une des erreurs remontées
    const erreursAjoutees = ctx.jeu.tamponErreurs.slice(erreursAvant).join("\n");
    expect(erreursAjoutees).toContain("pommet");
    // la branche [sinon] doit avoir été rendue (siVrai = false)
    expect(sortie).toContain("B");
    expect(sortie).not.toContain("Machine A");
  });

  it("sujet introuvable dans condition → message d'erreur nomme bien le sujet", () => {
    const desc = "Machine [si licorne est visible]X[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    ctx.com.executerCommande("examiner machine", false);
    const erreursAjoutees = ctx.jeu.tamponErreurs.slice(erreursAvant).join("\n");
    // l'erreur doit mentionner que le sujet n'a pas été trouvé
    expect(erreursAjoutees).toMatch(/pas trouv|pas compris|pas évalu/i);
    expect(erreursAjoutees).toContain("licorne");
  });

});
