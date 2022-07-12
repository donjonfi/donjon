import { AnalyseurV8 } from "./analyseur/analyseur-v8";
import { CompilateurCommunUtils } from "./compilateur-commun-utils";
import { CompilateurV8Utils } from "./compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { ContexteCompilationV8 } from "../../models/compilateur/contexte-compilation-v8";
import { ResultatCompilation } from "../../models/compilateur/resultat-compilation";
import { Statisticien } from "../jeu/statisticien";
import { Verificateur } from "./verificateur";

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
    let ctx = new ContexteCompilationV8(verbeux);

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
    CompilateurV8.analyserCodeSource((scenario + CompilateurCommunUtils.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    CompilateurCommunUtils.peuplerLeMonde(ctx);
    
    // calculer les stats
    ctx.resultat.statistiques = Statisticien.calculerStatistiquesScenario(scenario);

    return ctx.resultat;
  }

  /**
  * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
  * Les commandes de base ne sont pas ajoutées au scénario.
  * @param scenario scénario de l’auteur
  * @param verbeux  la sortie avec les remarques doit-elle être plus détaillée ?
  */
  public static analyserScenarioSeul(scenario: string, verbeux: boolean): ResultatCompilation {

    // création d’un nouveau contexte pour la compilation
    let ctx = new ContexteCompilationV8(verbeux);

    // ajout des éléments spéciaux (joueur, inventaire, jeu, …)
    CompilateurCommunUtils.ajouterElementsSpeciaux(ctx.analyse);

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
  public static analyserCodeSource(source: string, contexteAnalyse: ContexteAnalyseV8): void {

    const phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(source);

    // Verificateur.verifierBlocs(phrases, contexteAnalyse);

    // ********************************
    // ANALYSER LES PHRASES
    // ********************************
    AnalyseurV8.analyserPhrases(phrases, contexteAnalyse);

  }

}