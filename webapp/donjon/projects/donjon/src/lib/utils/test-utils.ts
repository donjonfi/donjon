import { CompilateurV8, Jeu } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "./compilation/generateur";
import { HorlogeUtils } from "./jeu/horloge-utils";

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
    // Repartir d'une horloge déterministe propre (parité avec la graine ; évite qu'un rejeu
    // laissé actif par un test magnéto antérieur ne fuite dans ce jeu).
    HorlogeUtils.reinitialiser();
    ctxPartie.nouvelleGraineAleatoire();
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
        messages += "\n" +  message.numeroLigne + ": " + message.titre;
      });

      throw new Error("genererEtCommencerLeJeu: il y a un message suite à l’analyse du scénario:" + messages);
    }

    const jeu = Generateur.genererJeu(rc);

    return jeu;
  }

}