import { CompilateurV8, Jeu } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "./compilation/generateur";

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
    const rc = CompilateurV8.analyserScenarioSeul(scenario, verbeux);

    if (rc.erreurs.length > 0) {
      throw new Error("genererEtCommencerLeJeu: il y a une erreur dans le scénario:" + rc.erreurs);
    }
    if (rc.messages.length > 0) {
      let messages = "";
      rc.messages.forEach(message => {
        messages += message.titre;
      });

      throw new Error("genererEtCommencerLeJeu: il y a un message suite à l’analyse du scénario:" + messages);
    }

    const jeu = Generateur.genererJeu(rc);

    return jeu;
  }

}