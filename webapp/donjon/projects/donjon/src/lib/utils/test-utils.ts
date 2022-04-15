import { Compilateur } from "./compilation/compilateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "./compilation/generateur";

export class TestUtils {

  /**
   * Compiler le scénario, générer le jeu et commencer la partie.
   * @param scenario 
   * @returns 
   */
  public static genererEtCommencerLeJeu(scenario: string, verbeux: boolean = false): ContextePartie
  {
    const rc = Compilateur.analyserScenarioSansChargerCommandes(scenario, verbeux);

    if(rc.erreurs.length > 0){
      throw new Error("genererEtCommencerLeJeu: il y a une erreur dans le scénario.");
    }

    const jeu = Generateur.genererJeu(rc);
    let ctxPartie = new ContextePartie(jeu);

    // définir visibilité des objets initiale
    ctxPartie.eju.majPresenceDesObjets();
    // définir adjacence des lieux initiale
    ctxPartie.eju.majAdjacenceLieux();

    ctxPartie.jeu.commence = true;
    
    return ctxPartie;
  }

}