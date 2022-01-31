import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { Phrase } from "../../../models/compilateur/phrase";
import { TexteUtils } from "../../commun/texte-utils";

export class AnalyseurUtils {

  /**
   * Ajouter la description éventuelle au dernier élément générique trouvé.
   * @param phrase 
   * @param ctx 
   */
  public static ajouterDescriptionDernierElement(phrase: Phrase, ctx: ContexteAnalyse) {
    // si phrase en plusieurs morceaux, ajouter commentaire qui suit.
    if (phrase.phrase.length > 1) {
      // reconstituer la description et enlever les caractèrs spéciaux
      let description = "";
      for (let index = 1; index < phrase.phrase.length; index++) {
        description += TexteUtils.retrouverTexteOriginal(phrase.phrase[index]);
      }
      // enlever les guillemets autours de la valeur
      description = description.trim().replace(/^\"|\"$/g, '');
      ctx.dernierElementGenerique.description = description;
    }
  }

  /** Ajouter une nouvelle erreur. */
  public static ajouterErreur(ctx: ContexteAnalyse, ligne: number, erreur: string) {
    let index: number;
    if (ligne) {
      index = ctx.erreurs.push(("0000" + ligne).slice(-5) + " : " + erreur);
    } else {
      index = ctx.erreurs.push(erreur);
    }
    console.error(ctx.erreurs[index - 1]);
  }

}