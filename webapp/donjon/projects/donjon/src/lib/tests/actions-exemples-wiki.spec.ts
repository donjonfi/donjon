import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Exemples wiki du thème « Actions prédéfinies » (LOT 8 de l'audit de couverture).
 * Le contenu du scénario doit rester identique au fichier :
 *   ressources/scenarios/exemples/wiki/actions/conversation.djn
 *
 * On compile AVEC les commandes de base (`analyserScenarioEtActions(..., actions, ...)`) : les
 * actions testées (parler / demander / interroger / montrer / donner) sont définies dans
 * actions.djn, PAS dans le scénario — TestUtils.genererEtCommencerLeJeu (analyserScenarioSeul)
 * ne les inclut pas. Cf. divers-exemples-wiki.spec.ts (LOT 7).
 */

function compiler(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  return new ContextePartie(jeu);
}

const SCN_CONVERSATION = `La boutique est un lieu.
  "Une échoppe encombrée de babioles poussiéreuses."

La vendeuse est une personne dans la boutique.

L'amulette est un objet vu et possédé.
La fiole est un objet vu dans la boutique.

réactions de la vendeuse:
  basique:
    dire "Bienvenue ! Que puis-je pour vous ?".
  concernant l'amulette:
    dire "Cette amulette… elle vaut une fortune !".
  concernant la fiole:
    dire "Une potion de soin. Prenez-en soin.".
  concernant un sujet inconnu:
    dire "Je ne connais rien à ce sujet.".
fin réactions

règle avant commencer le jeu:
  dire "Essayez : parler avec la vendeuse / interroger la vendeuse concernant l'amulette / montrer l'amulette à la vendeuse / donner l'amulette à la vendeuse.".
fin règle
`;

describe("Exemples wiki — Actions prédéfinies (LOT 8)", () => {

  it("[F070-T000] le scénario compile sans erreur", () => {
    const ctx = compiler(SCN_CONVERSATION);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  // ---- formes certaines (issues des signatures d'action) -------------------

  it("[F070-T001] parler avec <personne> → réaction basique", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("parler avec la vendeuse", false).sortie;
    expect(s).toContain("Bienvenue");
  });

  it("[F070-T002] parler avec <personne> concernant <sujet> → réaction par sujet", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("parler avec la vendeuse concernant l'amulette", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T003] interroger <personne> concernant <sujet>", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("interroger la vendeuse concernant l'amulette", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T004] montrer <objet> à <personne> → réaction concernant l'objet", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("montrer l'amulette à la vendeuse", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T005] demander <sujet> à <personne> → réaction concernant le sujet", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("demander l'amulette à la vendeuse", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T006] donner <objet> à <personne> → la personne le possède", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("donner l'amulette à la vendeuse", false).sortie;
    expect(s).toContain("reçu");
  });

  it("[F070-T007] sujet inconnu → réaction « sujet inconnu »", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("interroger la vendeuse concernant la lune", false).sortie;
    expect(s).toContain("ne connais rien");
  });

  // ---- variantes de préposition (vérifiées : toutes acceptées par le moteur) -

  it("[F070-T008] parler de <sujet> avec <personne>", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("parler de l'amulette avec la vendeuse", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T009] interroger <personne> sur <sujet>", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("interroger la vendeuse sur l'amulette", false).sortie;
    expect(s).toContain("fortune");
  });

  it("[F070-T010] interroger <personne> à propos de <sujet>", () => {
    const ctx = compiler(SCN_CONVERSATION);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("interroger la vendeuse à propos de l'amulette", false).sortie;
    expect(s).toContain("fortune");
  });

  // Déclenchement manuel d'une réaction depuis une action/règle.
  // Forme robuste vérifiée : « exécuter réaction de <vivant> » (SANS article) → réaction basique.
  // Quirks moteur (cf. docs/TODO.md) : l'article « la » casse la résolution, et
  // « concernant <sujet> » est ignoré (retombe sur la réaction basique).
  it("[F070-T011] exécuter réaction de ceci → réaction basique", () => {
    const scn = SCN_CONVERSATION + `
action saluer ceci:
  définitions:
    ceci est un vivant vu et visible.
  phase épilogue:
    exécuter réaction de ceci.
fin action
`;
    const ctx = compiler(scn);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("saluer la vendeuse", false).sortie;
    expect(s).toContain("Bienvenue");
  });
});
