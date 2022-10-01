import { BalisesHtml } from "./balises-html";
import { CompilateurV8Utils } from "../compilation/compilateur-v8-utils";
import { ContextePartie } from "../../models/jouer/contexte-partie";
import { ExprReg } from "../compilation/expr-reg";
import { Statistiques } from "../../models/jeu/statistiques";
import { TexteUtils } from "../commun/texte-utils";

export class Statisticien {


  /** Éviter de perdre des statistiques si l’écran (sortie joueur) est effacé. */
  public static sauverStatistiquesAvantEffacerSortie(ctx: ContextePartie, sortieJoueur: string) {
    if (sortieJoueur) {
      const sortieNettoyee = Statisticien.nettoyerTexteSortie(sortieJoueur);
      ctx.jeu.statistiques.nbCaracteresAffichesAvantEffacement += sortieNettoyee.length;
      const nbMotsAffiches = Statisticien.compterMotsTexte(sortieNettoyee);
      ctx.jeu.statistiques.nbMotsAffichesAvantEffacement += nbMotsAffiches;
    }
  }

  /** Afficher lest statistiques du nombre de mots du scénario et de la partie. */
  public static afficherStatistiques(ctx: ContextePartie, sortieJoueur: string): string {
    let sortie: string = '';

    // nombre de caractères du scénario
    sortie += "{p}{_Estimation du nombre de mots_}"
      + "{n}Scénario du jeu :{n}"
      + "{t}- " + ctx.jeu.statistiques.nbCaracteresScenarioSansCommentaires + " caractères au total (" + ctx.jeu.statistiques.nbCaracteresScenario + " en incluant les commentaires.){n}"
      + "{t}- " + ctx.jeu.statistiques.nbCaracteresAffichables + " caractères affichables{n}"
      + "{t}- {+" + ctx.jeu.statistiques.nbMotsAffichables + " mots affichables+}{n}";

    // nombre de caractères dans la sortie + ce qu’on a retenu avant effacement écran éventuel
    const sortieNettoyee = Statisticien.nettoyerTexteSortie(sortieJoueur);
    const nbCaracteresAffiches = sortieNettoyee.length + ctx.jeu.statistiques.nbCaracteresAffichesAvantEffacement;
    const nbMotsAffiches = Statisticien.compterMotsTexte(sortieNettoyee) + ctx.jeu.statistiques.nbMotsAffichesAvantEffacement;
    sortie += "Sortie partie :{n}"
      + "{t}- " + (nbCaracteresAffiches - ctx.jeu.statistiques.nbCaracteresCommandesAffichees) + " caractères affichés (" + nbCaracteresAffiches + " en incluant les commandes et erreurs){n}"
      + "{t}- {+" + (nbMotsAffiches - ctx.jeu.statistiques.nbMotsCommandesAffichees) + " mots affichés+} (" + nbMotsAffiches + " en incluant les commandes et erreurs){n}";
    return sortie;
  }

  public static calculerStatistiquesScenario(scenario: string): Statistiques {
    let statistiques = new Statistiques();

    // scénario
    // - avec les commentaires
    statistiques.nbCaracteresScenario = scenario.length;
    // - sans les commentaires
    statistiques.nbCaracteresScenarioSansCommentaires = scenario.replace(/^((?: *)--(?:.*))$/gm, "").length;

    // caractères affichés durant le jeu (textes dynamiques nettoyés)
    Statisticien.definirNombreMotsEtCaracteresAffichables(scenario, statistiques);

    return statistiques;
  }

  public static definirNombreMotsEtCaracteresAffichables(scenario: string, statistiques: Statistiques): void {
    let nbMots = 0;
    let nbCaracteres = 0;

    let textesNettoyes = this.extraireTextesAffichablesAuJoueurNettoyes(scenario);

    textesNettoyes.forEach(texteNettoye => {
      nbMots += this.compterMotsTexte(texteNettoye);
      nbCaracteres += texteNettoye.length;
    });

    statistiques.nbMotsAffichables = nbMots;
    statistiques.nbCaracteresAffichables = nbCaracteres;

  }

  /**
   * Compter le nombre de mots dans le texte.
   * Prérequis:
   *  - les balises de style et conditionnelles ont déjà été retirées (texte dynamique).
   *  - les balises HTML ont déjà été retirées (sortie joueur).
   * @param texteNettoye 
   */
  public static compterMotsTexte(texte: string): number {
    // remplacer les apostrophes par des espaces
    let texteNettoye = texte
      .replace(/'|’|\n|&nbsp;|&gt;|&lt;/g, ' ')
      // supprimer les ponctuations
      .replace(/[.|…|,|;|:|!|?|<|>|(|)|$|€|\-|−]/g, "");
    // remplacer espaces insécables par des espaces classiques
    texteNettoye = TexteUtils.remplacerEspacesInsecables(texteNettoye)
      // enlever les espaces multiples
      .replace(/ ( +)/g, " ")
      // enlever espaces en début/fin de chaîne
      .trim();
    // séparer les mots sur les espaces
    const mots = texteNettoye.split(' ');

    return mots.length;
  }

  /**
   * Extraire du scénario les textes dynamiques après les avoirs nettoyés de leurs balises de style, conditions et guillemets.
   */
  public static extraireTextesAffichablesAuJoueurNettoyes(scenario): string[] {

    let textes: string[] = []

    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
    phrases.forEach(phrase => {

      let texteCommence: string | undefined;

      phrase.morceaux.forEach(morceau => {
        // s’il s’agit d’un texte complet, l’ajouter
        if (morceau.startsWith(ExprReg.caractereDebutTexte) && morceau.endsWith(ExprReg.caractereFinTexte)) {
          textes.push(Statisticien.nettoyerTexteAffichable(morceau));
          // s’il s’agit d’un début de texte incomplet
        } else if (!texteCommence && morceau.startsWith(ExprReg.caractereDebutTexte)) {
          texteCommence = morceau;
          // s’il s’agit d’une suite de texte incomplet
        } else if (texteCommence) {
          texteCommence += morceau;
          // si c’est le dernier morceau du texte incomplet
          if (morceau.endsWith(ExprReg.caractereFinTexte)) {
            textes.push(Statisticien.nettoyerTexteAffichable(texteCommence));
            texteCommence = undefined;
          }
        }
      });
    });

    return textes;
  }

  /**
   * Nettoyer le texte dynamique affichable au joueur:
   * - Retrait balises de style
   * - Retrait conditions
   * - Retrait guillemets
   * - Remplacement des espaces insécables
   */
  public static nettoyerTexteAffichable(texte: string): string {
    // enlever les balises conditionnelles
    let texteNettoye = TexteUtils.enleverBalisesConditionnelles(texte);
    // TODO: remplacer les {n}, {N}, {p}, {u} et {U}  par un espace ?
    // enlever les balises de style
    texteNettoye = TexteUtils.enleverBalisesStyleDonjon(texteNettoye);
    // enlever les guillemets
    texteNettoye = TexteUtils.enleverGuillemets(texteNettoye, true);
    // remplacer espaces insécables par des espaces classiques
    texteNettoye = TexteUtils.remplacerEspacesInsecables(texteNettoye);

    return texteNettoye;
  }

  /**
   * Nettoyer le texte de la sortie du jeu (à utiliser avant calcul du nombre de mots et/ou de caractères).
   * Actions réalisées:
   * - Retrait des balises HTML
   */
  public static nettoyerTexteSortie(texte: string): string {
    // remplacer les <br> et les </p> par un espace
    let texteNettoye = texte.replace(/(<br>|<p>)/g, '\n')
    return BalisesHtml.retirerBalisesHtml(texteNettoye);
  }

}