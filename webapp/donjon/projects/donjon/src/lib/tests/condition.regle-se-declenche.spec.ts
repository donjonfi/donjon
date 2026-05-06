import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Tests pour les conditions « si la règle se déclenche … ».
 *
 * Couvre :
 *   - le chemin nominal (1ère / 2ème / 3ème fois et déclenchements suivants),
 *   - le verbe inconnu (typo) et le verbe inadapté (« vaut »),
 *   - le complément non supporté (« quatrième fois »).
 *
 * Régression : depuis le refactoring qui sort la règle de la branche compteur
 * du dispatch, le message d'erreur doit mentionner « la règle » et plus
 * jamais « un compteur ».
 */

const scenarioAvecRegle = (corpsRegle: string) => `
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".
  La machine est un objet dans le salon.
  Sa description est "Une machine.".

  règle après examiner la machine:
${corpsRegle}
  fin règle
`;

function preparerJeu(scenario: string) {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
  const jeu = Generateur.genererJeu(rc);
  const ctxPartie = new ContextePartie(jeu);
  ctxPartie.com.executerCommande("commencer le jeu", true);
  return ctxPartie;
}

describe("Conditions sur la règle « se déclenche »", () => {

  it("dispatch correct selon le nombre de déclenchements (1ère / 2ème / 3ème / suivantes)", () => {
    const scenario = scenarioAvecRegle(`
      si la règle se déclenche pour la première fois:
        dire "PREMIER".
      sinonsi la règle se déclenche pour la deuxième fois:
        dire "DEUXIEME".
      sinonsi la règle se déclenche pour la troisième fois:
        dire "TROISIEME".
      sinon
        dire "SUIVANT".
      fin si
    `);
    const ctx = preparerJeu(scenario);

    let sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("PREMIER");
    expect(sortie).not.toContain("DEUXIEME");
    expect(sortie).not.toContain("TROISIEME");
    expect(sortie).not.toContain("SUIVANT");

    sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("DEUXIEME");
    expect(sortie).not.toContain("PREMIER");
    expect(sortie).not.toContain("TROISIEME");
    expect(sortie).not.toContain("SUIVANT");

    sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("TROISIEME");
    expect(sortie).not.toContain("PREMIER");
    expect(sortie).not.toContain("DEUXIEME");
    expect(sortie).not.toContain("SUIVANT");

    sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("SUIVANT");
    expect(sortie).not.toContain("PREMIER");
    expect(sortie).not.toContain("DEUXIEME");
    expect(sortie).not.toContain("TROISIEME");

    sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(sortie).toContain("SUIVANT");
  });

  it("compteur de déclenchements correctement incrémenté sur l'auditeur", () => {
    const scenario = scenarioAvecRegle(`
      si la règle se déclenche pour la première fois:
        dire "OK".
      fin si
    `);
    const ctx = preparerJeu(scenario);

    const auditeur = ctx.jeu.auditeurs.find(a =>
      a.evenements?.[0]?.infinitif === 'examiner' && a.evenements?.[0]?.ceci === 'machine'
    );
    expect(auditeur).toBeDefined();
    expect(auditeur!.declenchements).toEqual(0);

    ctx.com.executerCommande("examiner machine", false);
    expect(auditeur!.declenchements).toEqual(1);

    ctx.com.executerCommande("examiner machine", false);
    expect(auditeur!.declenchements).toEqual(2);

    ctx.com.executerCommande("examiner machine", false);
    expect(auditeur!.declenchements).toEqual(3);
  });

  it("verbe inconnu (typo « se déiclenche ») → erreur runtime mentionnant la règle, pas un compteur", () => {
    const scenario = scenarioAvecRegle(`
      si la règle se déiclenche pour la première fois:
        dire "BRANCHE-KO".
      fin si
    `);
    const ctx = preparerJeu(scenario);
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;

    expect(sortie).toContain("Condition sur la règle");
    expect(sortie).toContain("verbe pas supporté");
    expect(sortie).toContain("se déiclenche");
    // Régression : le message ne doit plus passer par la branche compteur.
    expect(sortie).not.toContain("Condition sur un compteur");
    // La condition étant en erreur, la branche ne doit pas être prise.
    expect(sortie).not.toContain("BRANCHE-KO");
  });

  it("le message d'erreur inclut la condition complète et le numéro de ligne", () => {
    const scenario = scenarioAvecRegle(`
      si la règle se déiclenche pour la première fois:
        dire "BRANCHE-KO".
      fin si
    `);
    const ligneAttendue = scenario.split('\n').findIndex(l => l.includes('si la règle se déiclenche')) + 1;
    expect(ligneAttendue).toBeGreaterThan(0);

    const ctx = preparerJeu(scenario);
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;

    // La condition complète est citée dans le message (entre « si … »).
    expect(sortie).toContain("« si la règle se déiclenche pour la première fois »");
    // Le numéro de ligne du scénario apparaît au format `l.<n>`.
    expect(sortie).toContain("l." + ligneAttendue);
  });

  it("verbe inadapté (« vaut ») → erreur runtime mentionnant la règle", () => {
    const scenario = scenarioAvecRegle(`
      si la règle vaut 1:
        dire "BRANCHE-KO".
      fin si
    `);
    const ctx = preparerJeu(scenario);
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;

    expect(sortie).toContain("Condition sur la règle");
    expect(sortie).toContain("verbe pas supporté");
    expect(sortie).toContain("vaut");
    expect(sortie).not.toContain("Condition sur un compteur");
    expect(sortie).not.toContain("BRANCHE-KO");
  });

  it("complément non supporté (« quatrième fois ») → erreur runtime explicite", () => {
    const scenario = scenarioAvecRegle(`
      si la règle se déclenche pour la quatrième fois:
        dire "BRANCHE-KO".
      fin si
    `);
    const ctx = preparerJeu(scenario);
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;

    expect(sortie).toContain("Condition sur la règle");
    expect(sortie).toContain("complément non supporté");
    expect(sortie).not.toContain("BRANCHE-KO");
  });

});
