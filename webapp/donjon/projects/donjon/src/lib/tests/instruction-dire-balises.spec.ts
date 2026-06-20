// [F106] dire + balises dynamiques — cadres au hasard / en boucle / initialement,
// erreurs de cohérence des mots-clés conditionnels, et retour à la ligne automatique ({N}).
//
// Cible : les branches NON déjà couvertes par les specs dire existants
// (instruction.dire.conditions-imbriquees = si/sinon/sinonsi/fois,
//  instruction.dire.erreurs-crochets = si invalide / sujet introuvable,
//  validateur-textes-dynamiques = validation STATIQUE seulement).
//
// Harness : on passe par `analyserScenarioEtActions` (et NON TestUtils.genererEtCommencerLeJeu
// qui lève une exception au moindre message du validateur) pour atteindre le RUNTIME des
// mots-clés hors-cadre. Le texte dynamique vit dans « Sa description est "…" » et est rendu
// via « examiner machine » (nbAffichage progresse à chaque examen — cf. F031-T007/T008).

import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const baseScenario = (descriptionMachine: string, etats: string = "") => `
  Le joueur se trouve dans le salon.
  Le salon est un lieu.
  Sa description est "Vous êtes dans un salon.".

  La machine est un objet dans le salon.
  ${etats}
  Sa description est "${descriptionMachine}".
`;

function preparerJeu(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
  const jeu = Generateur.genererJeu(rc);
  const ctxPartie = new ContextePartie(jeu);
  // initialiser le PRNG (requis par le cadre [au hasard])
  ctxPartie.nouvelleGraineAleatoire();
  ctxPartie.com.executerCommande("commencer le jeu", true);
  return ctxPartie;
}

describe("[F106] dire — cadre [au hasard] / [en boucle] / [initialement]", () => {

  it("[F106-T001] [au hasard] rend exactement une branche, sans marqueur d'erreur", () => {
    const desc = "Bruit : [au hasard]ALPHA[ou]BETA[ou]GAMMA[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    // non déterministe : ne pas asserter QUELLE branche, mais qu'une seule sort.
    const nb = [/ALPHA/, /BETA/, /GAMMA/].filter(re => re.test(sortie)).length;
    expect(nb).withContext(sortie).toBe(1);
    // pas de marqueur d'erreur inline, pas de crochet résiduel
    expect(sortie).not.toContain("{+{/");
    expect(sortie).not.toContain("[");
  });

  it("[F106-T002] [en boucle]…[puis]…[fin] cycle d'un affichage à l'autre", () => {
    const desc = "[en boucle]PREMIER[puis]SECOND[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const s1 = ctx.com.executerCommande("examiner machine", false).sortie;
    const s2 = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(s1).withContext(s1).toContain("PREMIER");
    expect(s1).withContext(s1).not.toContain("SECOND");
    expect(s2).withContext(s2).toContain("SECOND");
    expect(s2).withContext(s2).not.toContain("PREMIER");
  });

  it("[F106-T003] [en boucle] revient à la première branche après un cycle complet", () => {
    const desc = "[en boucle]PREMIER[puis]SECOND[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    ctx.com.executerCommande("examiner machine", false); // PREMIER
    ctx.com.executerCommande("examiner machine", false); // SECOND
    const s3 = ctx.com.executerCommande("examiner machine", false).sortie; // retour PREMIER
    expect(s3).withContext(s3).toContain("PREMIER");
    expect(s3).withContext(s3).not.toContain("SECOND");
  });

  it("[F106-T004] [initialement]…[puis]…[fin] : 1er affichage vs suivants", () => {
    const desc = "[initialement]NEUF[puis]USE[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const s1 = ctx.com.executerCommande("examiner machine", false).sortie;
    const s2 = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(s1).withContext(s1).toContain("NEUF");
    expect(s1).withContext(s1).not.toContain("USE");
    expect(s2).withContext(s2).toContain("USE");
    expect(s2).withContext(s2).not.toContain("NEUF");
  });

});

describe("[F106] dire — mots-clés conditionnels hors cadre (erreurs runtime)", () => {

  it("[F106-T010] [ou] hors [au hasard] → marqueur inline + tamponErreurs", () => {
    const desc = "Machine [ou]X[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    // [ou] sans cadre ouvert est une continuation hors cadre.
    expect(ctx.jeu.tamponErreurs.length).withContext(sortie).toBeGreaterThan(erreursAvant);
    expect(sortie).withContext(sortie).toContain("{+{/");
  });

  it("[F106-T011] [puis] hors cadre cyclique → marqueur inline + tamponErreurs", () => {
    // [puis] dans un cadre [si] (au lieu de fois/boucle/initialement) → branche d'erreur.
    const desc = "M [si la machine est visible]A[puis]B[fin si].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(ctx.jeu.tamponErreurs.length).withContext(sortie).toBeGreaterThan(erreursAvant);
    expect(sortie).withContext(sortie).toContain("{+{/");
  });

  it("[F106-T012] [sinon] dans un cadre [au hasard] → marqueur inline + tamponErreurs", () => {
    const desc = "M [au hasard]A[sinon]B[fin].";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(ctx.jeu.tamponErreurs.length).withContext(sortie).toBeGreaterThan(erreursAvant);
    expect(sortie).withContext(sortie).toContain("{+{/");
  });

  it("[F106-T013] [fin] manquant → tamponErreurs alimenté + marqueur de fin manquante", () => {
    const desc = "M [si la machine est visible]A.";
    const ctx = preparerJeu(baseScenario(desc));
    const erreursAvant = ctx.jeu.tamponErreurs.length;
    const sortie = ctx.com.executerCommande("examiner machine", false).sortie;
    expect(ctx.jeu.tamponErreurs.length).withContext(sortie).toBeGreaterThan(erreursAvant);
    expect(sortie).withContext(sortie).toContain("fin manquant");
  });

});

describe("[F106] dire — retour à la ligne automatique ({N})", () => {

  it("[F106-T020] un texte terminé par un point reçoit un {N} final automatique", () => {
    // L'action one-shot suffit ici : pas de mot-clé hors cadre, pas de message validateur.
    // (observé : la sortie se termine par {N} ajouté automatiquement après le point final.)
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
action tester:
  dire "Bonjour le monde.".
fin action`;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", true);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).withContext(sortie).toContain("Bonjour le monde.");
    expect(sortie).withContext(sortie).toContain("{N}");
  });

  it("[F106-T021] un texte sans ponctuation finale ne reçoit pas de {N} automatique", () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
action tester:
  dire "fragment sans point".
fin action`;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", true);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).withContext(sortie).toContain("fragment sans point");
    expect(sortie).withContext(sortie).not.toContain("{N}");
  });

});
