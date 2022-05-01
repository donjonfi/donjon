import { Analyseur } from "./analyseur/analyseur";
import { CompilateurCommunUtils } from "./compilateur-commun-utils";
import { CompilateurV8Utils } from "./compilateur-v8-utils";
import { ContexteAnalyse } from "../../models/compilateur/contexte-analyse";
import { ContexteCompilation } from "../../models/compilateur/contexte-compilation";
import { ResultatCompilation } from "../../models/compilateur/resultat-compilation";

/**
 * Il s’agit du deuxième compilateur Donjon FI.
 * Il est utilisé depuis la version 1.0 de Donjon FI.
 */
export class CompilateurV8 {

  /**
    * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
    * Cette variante de l’analyse n’inclut pas les commandes de base ce qui lui permet d’être synchrone.
    * Si le scénario spécifie de ne pas inclure les commandes de base, les commandes fournies ne seront
    * pas prises en compte.
   * @param scenario scénario de l’auteur
   * @param actions actions (de base) fournies avec Donjon FI.
   * @param verbeux  la sortie avec les remarques doit-elle être plus détaillée ?
   */
  public static analyserScenarioEtActions(scenario: string, actions: string, verbeux: boolean): ResultatCompilation {

    // création d’un nouveau contexte pour la compilation
    let ctx = new ContexteCompilation(verbeux);

    // ajout des éléments spéciaux (joueur, inventaire, jeu, …)
    CompilateurCommunUtils.ajouterElementsSpeciaux(ctx.analyse);

    // inclure les commandes de base, sauf si on les a désactivées
    if (!/d(é|e)sactiver les (commandes|actions) de base(\.|;)/i.test(scenario)) {
      if (actions) {
        try {
          CompilateurV8.analyserCodeSource(actions, ctx.analyse);
        } catch (error) {
          console.error("Une erreur s’est produite lors de l’analyse des commandes de base :", error);
        }
      } else {
        ctx.analyse.ajouterErreur(0, "(Pas d'actions fournies en plus du scénario)");
      }
    }

    // Interpréter le scénario
    CompilateurV8.analyserCodeSource(scenario, ctx.analyse);

    // peupler le monde
    CompilateurCommunUtils.peuplerLeMonde(ctx);

    return ctx.resultat;

  }

  /**
   * Interpréter le code source fourni et ajouter le résultat à l’analyse fournie.
   * @param source Instructions à interpréter.
   * @param contexteAnalyse Analyse existante à compléter.
   */
  public static analyserCodeSource(source: string, contexteAnalyse: ContexteAnalyse): void {

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(source);

    // ********************************
    // ANALYSER LES PHRASES
    // ********************************
    Analyseur.analyserPhrases(phrases, contexteAnalyse);

  }


}