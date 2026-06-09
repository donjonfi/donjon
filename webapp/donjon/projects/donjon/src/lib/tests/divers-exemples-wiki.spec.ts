import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

/**
 * Exemples wiki du thème « Divers & configuration » (LOT 7 de l'audit de couverture).
 * Le contenu des scénarios doit rester identique aux fichiers :
 *   ressources/scenarios/exemples/wiki/divers/jeu_custom.djn
 *   ressources/scenarios/exemples/wiki/divers/liquides.djn
 *   ressources/scenarios/exemples/wiki/divers/commencer.djn
 *
 * On compile AVEC les commandes de base (`analyserScenarioEtActions(..., actions, ...)`) afin de
 * pouvoir tester la directive « Désactiver les commandes de base. » (détectée sur le scénario brut,
 * cf. compilateur-v8.ts:34) — TestUtils.genererEtCommencerLeJeu n'inclut pas les commandes de base.
 */

function compiler(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  return new ContextePartie(jeu);
}

// ---- Contenu identique aux fichiers .djn -----------------------------------

const SCN_CUSTOM = `Désactiver les commandes de base.

Le donjon est un lieu.

action commencer le jeu:
  dire "Bienvenue ! Ici, seules vos commandes existent. Tapez « psalmodier ».".
fin action

action psalmodier:
  dire "Vous récitez une incantation mystérieuse.".
fin action
`;

// Variante interne (T002) : un jeu ordinaire (commandes de base actives) → « regarder » existe.
const SCN_CONTROLE = `Le donjon est un lieu.
`;

const SCN_LIQUIDES = `La buvette est un lieu.
La table est un support dans la buvette.

-- Deux nouveaux types : un liquide ne se prend pas en main, une boisson se boit.
Un liquide est un objet liquide et indénombrable.
Une boisson est un liquide buvable.

Le jus est une boisson vu sur la table.

règle avant boire le jus:
  si le jus n'est pas bu:
    dire "Glou glou glou… J'avais soif !".
    changer le jus est bu.
    stopper l'action.
  sinon
    dire "J'ai déjà tout bu.".
    stopper l'action.
  fin si
fin règle
`;

const SCN_COMMENCER = `Le hall est un lieu.

règle avant commencer le jeu:
  dire "Votre objectif : vous échapper de ce lieu !".
fin règle
`;

describe("Exemples wiki — Divers & configuration (LOT 7)", () => {

  it("[F069-T001] Désactiver les commandes de base : jeu 100 % custom", () => {
    const ctx = compiler(SCN_CUSTOM);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    // (1) l'action « commencer le jeu » définie par l'auteur existe et s'exécute au démarrage
    const commencerExiste = ctx.jeu.actions.some(x => x.infinitif == 'commencer' && x.ceci && !x.cela);
    expect(commencerExiste).toBeTrue();
    const boot = ctx.com.executerCommande("commencer le jeu", false).sortie;
    expect(boot).toContain("Bienvenue");

    // (2) l'action personnalisée fonctionne
    expect(ctx.com.executerCommande("psalmodier", false).sortie).toContain("incantation");

    // (3) une commande de base (regarder) n'est plus reconnue
    const regarder = ctx.com.executerCommande("regarder", false).sortie;
    expect(regarder).not.toContain("donjon");
  });

  it("[F069-T002] (contrôle) sans la directive, « regarder » fonctionne", () => {
    const ctx = compiler(SCN_CONTROLE);
    ctx.com.executerCommande("commencer le jeu", false);
    const regarder = ctx.com.executerCommande("regarder", false).sortie;
    expect(regarder).toContain("donjon");
  });

  it("[F069-T003] Liquides : boire le verre puis re-boire", () => {
    const ctx = compiler(SCN_LIQUIDES);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande("commencer le jeu", false);

    const premier = ctx.com.executerCommande("boire le jus", false).sortie;
    expect(premier).toContain("Glou glou");

    const second = ctx.com.executerCommande("boire le jus", false).sortie;
    expect(second).toContain("déjà tout bu");
  });

  it("[F069-T004] commencer le jeu : la règle « avant » fixe l'objectif", () => {
    const ctx = compiler(SCN_COMMENCER);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const boot = ctx.com.executerCommande("commencer le jeu", false).sortie;
    expect(boot).toContain("vous échapper");
  });
});
