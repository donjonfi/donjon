import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PositionSujetString } from "../../../models/compilateur/position-sujet";
import { TexteUtils } from "../../commun/texte-utils";

export class AnalyseurUtils {

  /**
   * Ajouter la description éventuelle au dernier élément générique trouvé.
   * @param phrase 
   * @param ctx 
   */
  public static ajouterDescriptionDernierElement(phrase: Phrase, ctx: ContexteAnalyse) {
    // si phrase en plusieurs morceaux, ajouter commentaire qui suit.
    if (phrase.morceaux.length > 1) {
      // reconstituer la description et enlever les caractèrs spéciaux
      let description = "";
      for (let index = 1; index < phrase.morceaux.length; index++) {
        description += TexteUtils.retrouverTexteOriginal(phrase.morceaux[index]);
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
  public static trouverCorrespondanceAvecGroupeNominal(groupeNominal: RegExpExecArray, ctx: ContexteAnalyse): ElementGenerique | undefined {
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

      // si pas trouvé, vérifier s’il s’agit d’un pronom
      if (!elementConcerneEpithete) {
        switch (elementConcerneNom.toLocaleLowerCase()) {
          case 'il':
          case 'ils':
          case 'celui-ci':
          case 'ceux-ci':
          case 'elle':
          case 'elles':
          case 'celle-ci':
          case 'celles-ci':
            // genre de l'élément précédent
            ctx.dernierElementGenerique.genre = MotUtils.getGenre(elementConcerneNom, null);
            return ctx.dernierElementGenerique;

          default:
            return undefined;
        }
      } else {
        return undefined;
      }

    } else {
      // on retourne l'élément le plus récent
      return elementsTrouves.pop();
    }
  }

  /**
   * 
   * @param iciDedansDessusDessous ici, dedans, dessus, dessous, à l’intérieur, …
   * @param ctx 
   */
  public static trouverPositionIciDedansDessusDessous(elementConcerne: ElementGenerique, iciDedansDessusDessous: string, phrase: Phrase, ctx: ContexteAnalyse): PositionSujetString | undefined {

    let retVal: PositionSujetString | undefined;

    switch (iciDedansDessusDessous) {
      case 'ici':
        if (ctx.dernierLieu) {
          if (ctx.dernierLieu.nom !== elementConcerne.nom) {
            retVal = new PositionSujetString(
              // sujet
              elementConcerne.nom.toLowerCase() + (elementConcerne.epithete ? (' ' + elementConcerne.epithete.toLowerCase()) : ''),
              // complément
              ctx.dernierLieu.nom + (ctx.dernierLieu.epithete ? (' ' + ctx.dernierLieu.epithete) : ''),
              // position
              'dans'
            );
          } else {
            ctx.ajouterErreur(phrase.ligne, "Il/Elle se trouve ici : le dernier lieu créé porte le nom même nom que l'élément à ajouter (" + elementConcerne.elIntitule + ").")
          }
        } else {
          ctx.ajouterErreur(phrase.ligne, "Il/Elle se trouve ici : un « lieu » doit avoir été défini précédemment.")
        }
        break;

      case 'dedans':
      case 'dessus':
      case 'dessous':
      case 'à l’intérieur':
      case 'à l\'intérieur':
      case 'à l’extérieur':
      case 'à l\'extérieur':
        if (ctx.dernierElementGenerique) {
          if (ctx.dernierElementGenerique.nom !== elementConcerne.nom) {
            retVal = new PositionSujetString(
              // sujet
              elementConcerne.nom.toLowerCase() + (elementConcerne.epithete ? (' ' + elementConcerne.epithete.toLowerCase()) : ''),
              // complément
              ctx.dernierElementGenerique.nom + (ctx.dernierElementGenerique.epithete ? (' ' + ctx.dernierElementGenerique.epithete) : ''),
              // position
              PositionSujetString.getPosition(iciDedansDessusDessous)
            );
          } else {
            ctx.ajouterErreur(phrase.ligne, "Il/Elle se trouve dedans/dessus/dessous : le dernier élément créé porte le nom même nom que l'élément à ajouter (" + elementConcerne.elIntitule + ").")
          }
        } else {
          ctx.ajouterErreur(phrase.ligne, "Il/Elle se trouve dedans/dessus/dessous : un « élément » doit avoir été défini précédemment.")
        }
        break;

      default:
        break;
    }

    return retVal;

  }

}