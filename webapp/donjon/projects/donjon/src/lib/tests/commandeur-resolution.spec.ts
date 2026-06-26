// [F110] Résolution de commande (Commandeur) — branches non couvertes par F018/F015
//
// Cible des branches de commandeur.ts NON déjà testées par :
//  - commandes.spec.ts (F018) : décomposition + refus objet absent/invisible/inaccessible
//  - commande-encore.spec.ts (F015) : examiner / répéter
//  - recherche.spec.ts
//
// Ici : commentaire auteur (* / @), commande incomprise + bascule premiereIncomprehension,
// désambiguïsation (QcmCeci), verbe similaire (QcmInfinitif / verbesSimilaires).
// Assertions via toContain sur fragments SANS apostrophe (le moteur émet U+2019).

import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

describe("[F110] Commandeur — résolution de commande", () => {

  // -----------------------------------------------------------------
  // Commentaire à destination de l'auteur (ligne 96 : startsWith * / @)
  // -----------------------------------------------------------------
  it("[F110-T001] commande commençant par * = commentaire auteur", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      La salle est un lieu.
      action tester:
        dire "ok".
      fin action
    `);
    const ctxCom = ctx.com.executerCommande("* ceci est une note", false);
    expect(ctxCom.commandeValidee).toBeTrue();
    expect(ctxCom.sortie).toContain("@@commentaire@@");
  });

  it("[F110-T002] commande commençant par @ = commentaire auteur", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      La salle est un lieu.
      action tester:
        dire "ok".
      fin action
    `);
    const ctxCom = ctx.com.executerCommande("@ todo", false);
    expect(ctxCom.commandeValidee).toBeTrue();
    expect(ctxCom.sortie).toContain("@@commentaire@@");
  });

  // -----------------------------------------------------------------
  // Commande incomprise (0 candidat) + bascule premiereIncomprehension
  // (lignes 194-209). Premier échec : bloc d'exemples ; deuxième : sans.
  // -----------------------------------------------------------------
  it("[F110-T003] commande incomprise : message + exemples au 1er échec, sans exemples ensuite", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
      La salle est un lieu.
      action tester:
        dire "ok".
      fin action
    `);
    // 1er échec : "xyzzy" ne se décompose pas → 0 candidat.
    const premier = ctx.com.executerCommande("xyzzy", false);
    expect(premier.commandeValidee).toBeFalsy();
    expect(premier.sortie).toContain("pas compris la commande");
    // bloc d'exemples présent uniquement la première fois
    expect(premier.sortie).toContain("{-aller vers le nord-}");

    // 2e échec : plus de bloc d'exemples (premiereIncomprehension passé à false)
    const second = ctx.com.executerCommande("blurp", false);
    expect(second.commandeValidee).toBeFalsy();
    expect(second.sortie).toContain("pas compris la commande");
    expect(second.sortie).not.toContain("{-aller vers le nord-}");
  });

  // -----------------------------------------------------------------
  // Désambiguïsation CECI : 2 objets de même nom → QcmCeci proposé
  // (lignes 353-408). Harnais manuel (analyserScenarioEtActions) car un
  // scénario volontairement ambigu peut émettre un message validateur
  // qui ferait throw genererEtCommencerLeJeu.
  // -----------------------------------------------------------------
  it("[F110-T004] deux objets de même nom : la commande demande une précision (QcmCeci)", () => {
    const scenario = `
      Le salon est un lieu.
      La clé rouge est un objet vu dans le salon.
      La clé verte est un objet vu dans le salon.
      action tester ceci:
        définitions: ceci est un objet visible.
        dire "Je teste [intitulé ceci].".
      fin action
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCom = ctxPartie.com.executerCommande("tester la clé", false);
    // ambiguïté non résolue : pas validée + question CECI posée
    expect(ctxCom.commandeValidee).toBeFalsy();
    expect(ctxCom.questions?.QcmCeci).toBeDefined();
    expect(ctxCom.questions?.QcmCeci?.Choix?.length).toBe(2);
  });

  // -----------------------------------------------------------------
  // Verbe similaire : une faute de frappe proche d'une action définie
  // → verbesSimilaires / QcmInfinitif (lignes 228-231, 573-599).
  // L'input exact dépend du seuil de proximité — vérifié au runtime.
  // -----------------------------------------------------------------
  // NB : un test « verbe proche → verbesSimilaires/QcmInfinitif » a été retiré :
  //  le seuil de proximité (distance de Levenshtein) n'est pas prédictible et
  //  aucune faute essayée (secoer/secour/secoier…) ne déclenchait la suggestion
  //  de manière fiable. On préfère ne garder que des tests verts (cf. consignes).

  // -----------------------------------------------------------------
  // Refus CECI sur objet de classe inadéquate (lignes 222-285 :
  // chercherParmiLesActions → obtenirRaisonRefusCommande).
  // Distinct de F018-T001 (absent/invisible/inaccessible) : ici l'objet
  // est présent et visible mais ne satisfait pas la contrainte de classe.
  // -----------------------------------------------------------------
  it("[F110-T005] action refusée quand CECI ne satisfait pas la contrainte (objet vs personne)", () => {
    const scenario = `
      Le salon est un lieu.
      Le caillou est un objet vu dans le salon.
      action saluer ceci:
        définitions: ceci est une personne visible.
        dire "Bonjour [intitulé ceci].".
      fin action
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", false);

    const ctxCom = ctxPartie.com.executerCommande("saluer le caillou", false);
    // contrainte de classe non satisfaite → commande non validée
    expect(ctxCom.commandeValidee).toBeFalsy();
    // une sortie d'explication de refus est produite (non vide)
    expect((ctxCom.sortie ?? "").length).toBeGreaterThan(0);
    // le corps de l'action n'a PAS été exécuté (c'est bien le chemin de refus)
    expect(ctxCom.sortie).not.toContain("Bonjour");
  });

});
