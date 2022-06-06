import { CompilateurBeta } from "./compilation/compilateur-beta";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "./compilation/generateur";
import { Jeu } from "../../public-api";

export class TestUtils {

  /**
   * Compiler le scénario, générer le jeu et commencer la partie.
   * @param scenario 
   * @returns 
   */

  public static genererEtCommencerLeJeu(scenario: string, verbeux: boolean = false): ContextePartie {
    // 1) générer le jeu
    const jeu = this.genererLeJeu(scenario, verbeux);
    // 2) démarrer la partie
    let ctxPartie = new ContextePartie(jeu);
    // --> définir visibilité des objets initiale
    ctxPartie.eju.majPresenceDesObjets();
    // --> définir adjacence des lieux initiale
    ctxPartie.eju.majAdjacenceLieux();
    ctxPartie.jeu.commence = true;

    return ctxPartie;
  }

  /**
 * Compiler le scénario, générer le jeu et commencer la partie.
 * @param scenario 
 * @returns 
 */
  public static genererLeJeu(scenario: string, verbeux: boolean = false): Jeu {
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, verbeux);

    if (rc.erreurs.length > 0) {
      throw new Error("genererEtCommencerLeJeu: il y a une erreur dans le scénario.");
    }

    const jeu = Generateur.genererJeu(rc);

    return jeu;
  }

}