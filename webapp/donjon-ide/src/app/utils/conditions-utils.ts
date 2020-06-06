import { Condition } from '../models/compilateur/condition';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { Jeu } from '../models/jeu/jeu';
import { OutilsCommandes } from './outils-commandes';
import { PhraseUtils } from './phrase-utils';

export class ConditionsUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(jeu, verbeux);
  }

  /** Utilitaires - Éléments du jeu */
  private eju: ElementsJeuUtils;

  siEstVrai(conditionString: string, condition: Condition) {
    let retVal = false;
    if (condition == null) {
      condition = PhraseUtils.getCondition(conditionString);
    }
    if (condition) {
      // concerne le joueur
      // if (condition.sujet.nom === "joueur") {

      //   switch (condition.verbe) {
      //     case 'possède':
      //       // retrouver l’objet dans l’inventaire
      //       let trouve = this.eju.trouverElementJeu(condition.sujetComplement, EmplacementElement.inventaire, true, false);
      //       if (trouve === -1) {
      //         console.warn("siEstVrai >>> plusieurs éléments trouvés pour", condition.sujetComplement, condition);
      //       }
      //       retVal = (trouve !== null && trouve !== -1);
      //       break;

      //     case 'est':
      //       console.warn("siEstVrai: joueur est: pas géré", condition);
      //       break;

      //     default:
      //       console.warn("siEstVrai: verbe pas connu:", condition);
      //       break;
      //   }

        // concerne l'inventaire (du joueur)
      // } else 
      if (condition.sujet.nom == "inventaire") {

        // concerne un élément du jeu
      } else {
        switch (condition.verbe) {
          // état
          case 'est':
            const correspondances = this.eju.trouverCorrespondance(condition.sujet);

            if (correspondances.elements.length == 1) {
              let eleJeu = correspondances.elements[0];
              retVal = ElementsJeuUtils.possedeCetEtat(eleJeu, condition.complement);
            } else if (correspondances.elements.length > 1) {
              console.error("siEstVrai >>> plusieurs éléments trouvés pour", condition.sujet, condition);
            } else {
              console.error("siEstVrai >>> pas l’élément trouvé pour", condition.sujet, condition);
            }
            break;

          case 'possède':
          case 'possèdent':
            console.error("siEstVrais > condition « possède » pas encore gérée.");
            break;

          case 'se trouve':
          case 'se trouvent':
            // vérifier si un élément est présent dans la pièce actuelle
            this.eju.getObjetsQuiSeTrouventLa(condition.complement);
            console.error("siEstVrais > condition « se trouve » pas encore gérée.");
            break;

          default:
            console.error("siEstVrai: verbe pas connu::", condition.verbe);
            break;
        }
      }
    } else {
      console.error("siEstVrai: condition pas comprise:", condition);
    }

    console.error("siEstVrai: ", condition, retVal);

    return retVal;
  }



}
