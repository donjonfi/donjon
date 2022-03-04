import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
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

  /**
   * Chercher un élément correspondant au groupe nominal.
   * @param groupeNominal 
   * @param ctx 
   * @returns l'élément trouvé le plus récent ou undefined si pas trouvé.
   */
  public static trouverCorrespondanceAvecXGroupeNominal(groupeNominal: RegExpExecArray, ctx: ContexteAnalyse): ElementGenerique | undefined{
    // Déterminant(1), Nom(2), Épithète(3)
    const elementConcerneNom = groupeNominal[2].toLowerCase();
    const elementConcerneEpithete = groupeNominal[3] ? groupeNominal[3].toLowerCase() : null;

    return AnalyseurUtils.trouverCorrespondance(elementConcerneNom, elementConcerneEpithete, ctx);
  }

  /**
   * Chercher un élément correspondant à l'intitulé.
   * @param elementConcerneNom 
   * @param elementConcerneEpithete 
   * @param ctx 
   * @returns l'élément trouvé le plus récent ou undefined si pas trouvé.
   */
  public static trouverCorrespondance(elementConcerneNom: string, elementConcerneEpithete: string, ctx: ContexteAnalyse): ElementGenerique | undefined {
    // retrouver l’élément générique concerné
    const elementsTrouves = ctx.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom && x.epithete?.toLowerCase() == elementConcerneEpithete);

    if (elementsTrouves.length == 1) {
      return elementsTrouves[0];
    } else if (elementsTrouves.length == 0) {
      return undefined;
    } else {
      // on retourne l'élément le plus récent
      return elementsTrouves.pop();
    }
  }

  
  // public static trouverCorrespondanceOuRenvoyerNouvelElement(){

  // }

}