import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Routines paramétrées + surcharge.
 *
 * Couvre :
 *  - forme courte (rétrocompat, sans étiquette) ;
 *  - paramètres typés `nombre`, `texte`, `compteur` (classe), `élément` (classe),
 *    classes user-defined ;
 *  - erreurs de compilation (cela sans ceci, type inconnu, bloc définitions vide,
 *    article « des » refusé, doublon strict de signature) ;
 *  - erreurs runtime (mauvais type, args manquants, args sur routine sans contrat,
 *    appel différé + args en phase 1, appel différé sans args = OK) ;
 *  - surcharge par arité / type / classe (la plus spécifique gagne, kind beats
 *    depth, ambiguïté, aucun match).
 */

interface PrepResult {
  ctx: ContextePartie;
  /** Sortie cumulée du « commencer le jeu » initial — capture les déclenchements
   *  via « règle après commencer le jeu ». */
  sortie: string;
}

function preparer(scenario: string): PrepResult {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  const sortie = ctx.com.executerCommande("commencer le jeu", false).sortie;
  return { ctx, sortie };
}

describe("Routines paramétrées + surcharge", () => {

  // ============================================================
  //  BASIQUES
  // ============================================================

  it("[F056-T001] forme courte sans paramètres (rétrocompat)", () => {
    const scenario = `
      Le salon est un lieu.
      routine sonner:
        dire "DING".
      fin routine
      règle après commencer le jeu:
        exécuter routine sonner.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toContain("DING");
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F056-T002] ceci=nombre, appel avec littéral", () => {
    const scenario = `
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "v=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine afficher avec 42.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toContain("v=42");
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F056-T003] ceci=nombre, appel avec compteur → valeur figée", () => {
    const scenario = `
      Le salon est un lieu.
      Le score est un compteur initialisé à 7.
      routine snapshot:
        définitions:
          ceci est un nombre.
        exécution:
          dire "snap=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine snapshot avec le score.
        changer le score augmente de 100.
        dire " puis score=[c score]".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toContain("snap=7");
    expect(s).toContain("puis score=107");
  });

  it("[F056-T004] ceci=compteur, modifié dans la routine + lecture live", () => {
    const scenario = `
      Le salon est un lieu.
      Le score est un compteur initialisé à 0.
      routine bumper:
        définitions:
          ceci est un compteur.
        exécution:
          dire "avant=[c ceci]".
          changer ceci augmente de 5.
          dire " milieu=[c ceci]".
          changer ceci augmente de 5.
          dire " apres=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine bumper avec le score.
        dire " score=[c score]".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toContain("avant=0");
    expect(s).toContain("milieu=5");
    expect(s).toContain("apres=10");
    expect(s).toContain("score=10");
  });

  it("[F056-T005] ceci=texte, appel avec littéral", () => {
    const scenario = `
      Le salon est un lieu.
      routine notifier:
        définitions:
          ceci est un texte.
        exécution:
          dire "msg=[ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine notifier avec "Bienvenue".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toContain("msg=Bienvenue");
  });

  it("[F056-T006] ceci=texte, appel avec intitulé d’un élément", () => {
    const scenario = `
      Le salon est un lieu.
      La pomme est un objet dans le salon.
      routine notifier:
        définitions:
          ceci est un texte.
        exécution:
          dire "msg=[ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine notifier avec la pomme.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toMatch(/msg=.*pomme/);
  });

  it("[F056-T007] ceci=objet (classe), [intitulé ceci] s’affiche", () => {
    const scenario = `
      Le salon est un lieu.
      La potion est un objet dans le salon.
      routine lancer:
        définitions:
          ceci est un objet.
        exécution:
          dire "lance=[intitulé ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine lancer avec la potion.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toMatch(/lance=la potion/i);
  });

  it("[F056-T008] ceci=élément (catchall) — accepte un objet, un lieu", () => {
    // « élément » est la racine de objet/lieu/personne ; le compteur n’en hérite pas.
    const scenario = (arg: string) => `
      Le salon est un lieu.
      La pomme est un objet dans le salon.
      routine logger:
        définitions:
          ceci est un élément.
        exécution:
          dire "OK".
      fin routine
      règle après commencer le jeu:
        exécuter routine logger avec ${arg}.
      fin règle
    `;
    expect(preparer(scenario("la pomme")).sortie).toContain("OK");
    expect(preparer(scenario("le salon")).sortie).toContain("OK");
  });

  it("[F056-T009] ceci + cela (objet + nombre)", () => {
    const scenario = `
      Le salon est un lieu.
      La potion est un objet dans le salon.
      routine lancer:
        définitions:
          ceci est un objet.
          cela est un nombre.
        exécution:
          dire "lance=[intitulé ceci] force=[c cela]".
      fin routine
      règle après commencer le jeu:
        exécuter routine lancer avec la potion et 5.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toMatch(/lance=la potion/i);
    expect(s).toContain("force=5");
  });

  // ============================================================
  //  ERREURS DE COMPILATION
  // ============================================================

  it("[F056-T010] erreur: cela défini sans ceci", () => {
    const scenario = `
      Le salon est un lieu.
      routine bizarre:
        définitions:
          cela est un nombre.
        exécution:
          dire "x".
      fin routine
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const messages = rc.messages ?? [];
    expect(messages.some(m => /cela.*ceci/i.test(m.titre + ' ' + (m.corps ?? '')))).toBeTrue();
  });

  it("[F056-T011] erreur: type inconnu dans définitions (classe non résolue)", () => {
    const scenario = `
      Le salon est un lieu.
      routine douteuse:
        définitions:
          ceci est un xyzzyClasseInexistante.
        exécution:
          dire "x".
      fin routine
      règle après commencer le jeu:
        exécuter routine douteuse avec 1.
      fin règle
    `;
    // La routine est construite avec paramCeci.type='classe' et classeName="xyzzyclasseinexistante" ;
    // à l’exécution, ClasseUtils.trouverClasse ne la trouve pas → aucun candidat ne bind.
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
  });

  it("[F056-T012] erreur: doublon strict de signature (deux routines même nom + types)", () => {
    const scenario = `
      Le salon est un lieu.
      routine dupli:
        définitions:
          ceci est un nombre.
        exécution:
          dire "A".
      fin routine
      routine dupli:
        définitions:
          ceci est un nombre.
        exécution:
          dire "B".
      fin routine
      règle après commencer le jeu:
        exécuter routine dupli avec 1.
      fin règle
    `;
    // Phase 1 : le moteur n’interdit pas formellement le doublon à l’analyse,
    // mais à l’exécution la résolution remonte une ambiguïté (score identique).
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.some(e => /ambigu/i.test(e) || /plusieurs/i.test(e))).toBeTrue();
  });

  // ============================================================
  //  ERREURS RUNTIME
  // ============================================================

  it("[F056-T013] erreur: appel avec arg de mauvais type (texte sur un nombre)", () => {
    const scenario = `
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "v=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine afficher avec "hello".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
    expect(sortie).not.toContain("v=");
  });

  it("[F056-T014] erreur: appel sans args sur routine avec contrat", () => {
    const scenario = `
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "x".
      fin routine
      règle après commencer le jeu:
        exécuter routine afficher.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
  });

  it("[F056-T015] erreur: appel avec args sur routine sans définitions", () => {
    const scenario = `
      Le salon est un lieu.
      routine sonner:
        dire "DING".
      fin routine
      règle après commencer le jeu:
        exécuter routine sonner avec 42.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
  });

  it("[F056-T016] erreur: appel différé AVEC args (phase 1 refuse)", () => {
    const scenario = `
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "v=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine afficher avec 1 dans 1 seconde.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.some(e => /différ|phase/i.test(e))).toBeTrue();
  });

  it("[F056-T017] OK: appel différé SANS args (régression)", () => {
    const scenario = `
      Le salon est un lieu.
      routine sonner:
        dire "DING".
      fin routine
      règle après commencer le jeu:
        exécuter routine sonner dans 5 secondes.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    // La programmation différée doit avoir été enregistrée sans erreur
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.jeu.programmationsTemps.length).toBe(1);
    expect(ctx.jeu.programmationsTemps[0].routine).toBe("sonner");
  });

  // ============================================================
  //  SURCHARGE
  // ============================================================

  it("[F056-T018] surcharge par arité — bon dispatch (0 vs 1 vs 2)", () => {
    const scenario = `
      Le salon est un lieu.
      routine multi:
        dire "ZERO".
      fin routine
      routine multi:
        définitions:
          ceci est un nombre.
        exécution:
          dire "UN=[c ceci]".
      fin routine
      routine multi:
        définitions:
          ceci est un nombre.
          cela est un nombre.
        exécution:
          dire "DEUX=[c ceci]/[c cela]".
      fin routine
      règle après commencer le jeu:
        exécuter routine multi.
        exécuter routine multi avec 7.
        exécuter routine multi avec 7 et 9.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toContain("ZERO");
    expect(s).toContain("UN=7");
    expect(s).toContain("DEUX=7/9");
  });

  it("[F056-T019] surcharge par type — nombre vs texte", () => {
    const scenario = `
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "N=[c ceci]".
      fin routine
      routine afficher:
        définitions:
          ceci est un texte.
        exécution:
          dire "T=[ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter routine afficher avec 42.
        exécuter routine afficher avec "hello".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toContain("N=42");
    expect(s).toContain("T=hello");
  });

  it("[F056-T020] surcharge par classe — la plus spécifique gagne (vivant > objet)", () => {
    const scenario = `
      Le salon est un lieu.
      La pomme est un objet dans le salon.
      Le chien est un vivant dans le salon.
      routine logger:
        définitions:
          ceci est un objet.
        exécution:
          dire "OBJ".
      fin routine
      routine logger:
        définitions:
          ceci est un vivant.
        exécution:
          dire "VIV".
      fin routine
      règle après commencer le jeu:
        exécuter routine logger avec la pomme.
        exécuter routine logger avec le chien.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    // pomme : objet seul match → OBJ
    expect(s).toContain("OBJ");
    // chien : objet et vivant matchent, vivant plus spécifique → VIV
    expect(s).toContain("VIV");
  });

  it("[F056-T021] surcharge avec classe utilisateur — dragon > vivant", () => {
    const scenario = `
      Le salon est un lieu.
      Un dragon est un vivant.
      Drogon est un dragon dans le salon.
      Le chien est un vivant dans le salon.
      routine logger:
        définitions:
          ceci est un vivant.
        exécution:
          dire "VIV".
      fin routine
      routine logger:
        définitions:
          ceci est un dragon.
        exécution:
          dire "DRA".
      fin routine
      règle après commencer le jeu:
        exécuter routine logger avec Drogon.
        exécuter routine logger avec le chien.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    // Drogon est un dragon → DRA gagne
    expect(s).toContain("DRA");
    // chien est vivant non dragon → seule la variante vivant matche
    expect(s).toContain("VIV");
  });

  it("[F056-T022] kind beats depth — compteur (classe) bat nombre quand l’arg est un compteur", () => {
    const scenario = `
      Le salon est un lieu.
      Le score est un compteur initialisé à 5.
      routine traiter:
        définitions:
          ceci est un nombre.
        exécution:
          dire "NB".
      fin routine
      routine traiter:
        définitions:
          ceci est un compteur.
        exécution:
          dire "CO".
          changer ceci augmente de 100.
      fin routine
      règle après commencer le jeu:
        exécuter routine traiter avec le score.
        dire " s=[c score]".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    const s = sortie;
    expect(s).toContain("CO");          // variante compteur a gagné
    expect(s).not.toContain("NB");
    expect(s).toContain("s=105");       // mutation propagée
  });

  it("[F056-T023] filtrage par bind — la variante incompatible est silencieusement écartée", () => {
    // Surcharges nombre / texte ; arg=42 → seule la variante 'nombre' bind ;
    // arg="hi" → seule la variante 'texte' bind. Aucune ambiguïté : un seul
    // candidat survit au filtrage de type dans chaque cas. (Le vrai cas
    // d'ambiguïté — deux routines à signature identique — est couvert par T012.)
    const scenario = `
      Le salon est un lieu.
      routine traiter:
        définitions:
          ceci est un nombre.
        exécution:
          dire "A".
      fin routine
      routine traiter:
        définitions:
          ceci est un texte.
        exécution:
          dire "B".
      fin routine
      règle après commencer le jeu:
        exécuter routine traiter avec 42.
        exécuter routine traiter avec "hi".
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(sortie).toContain("A");
    expect(sortie).toContain("B");
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F056-T024] aucun candidat ne bind → erreur", () => {
    const scenario = `
      Le salon est un lieu.
      routine traiter:
        définitions:
          ceci est un objet.
        exécution:
          dire "OBJ".
      fin routine
      règle après commencer le jeu:
        exécuter routine traiter avec 42.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
  });

  it("[F056-T025] ceci=compteur refuse un objet", () => {
    const scenario = `
      Le salon est un lieu.
      La pomme est un objet dans le salon.
      routine ajuster:
        définitions:
          ceci est un compteur.
        exécution:
          changer ceci augmente de 1.
      fin routine
      règle après commencer le jeu:
        exécuter routine ajuster avec la pomme.
      fin règle
    `;
    const { ctx, sortie } = preparer(scenario);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
  });

  it("[F056-T026] erreur: bloc définitions vide", () => {
    const scenario = `
      Le salon est un lieu.
      routine douteuse:
        définitions:
        exécution:
          dire "x".
      fin routine
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const messages = rc.messages ?? [];
    expect(messages.some(m => /vide/i.test(m.titre + ' ' + (m.corps ?? '')))).toBeTrue();
  });

  it("[F056-T027] erreur: article « des » refusé dans définitions", () => {
    const scenario = `
      Le salon est un lieu.
      routine douteuse:
        définitions:
          ceci est des nombres.
        exécution:
          dire "x".
      fin routine
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const messages = rc.messages ?? [];
    expect(messages.some(m => /des/i.test(m.titre + ' ' + (m.corps ?? '')))).toBeTrue();
  });

});
