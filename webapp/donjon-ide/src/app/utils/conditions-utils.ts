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
      if (condition.sujet.nom === "joueur") {

        switch (condition.verbe) {
          case 'possède':
            // retrouver l’objet dans l’inventaire
            let trouve = this.eju.trouverElementJeu(condition.sujetComplement, EmplacementElement.inventaire, true, false);
            if (trouve === -1) {
              console.warn("siEstVrai >>> plusieurs éléments trouvés pour", condition.sujetComplement, condition);
            }
            retVal = (trouve !== null && trouve !== -1);
            break;

          case 'est':
            console.warn("siEstVrai: joueur est: pas géré", condition);
            break;

          default:
            console.warn("siEstVrai: verbe pas connu:", condition);
            break;
        }

        // concerne l'inventaire (du joueur)
      } else if (condition.sujet.nom == "inventaire") {

        // concerne un élément du jeu
      } else {
        switch (condition.verbe) {
          // état
          case 'est':
            let eleJeu = this.eju.trouverElementJeu(condition.sujet, EmplacementElement.iciEtInventaire, true, true);
            // élément trouvé
            if (eleJeu === -1) {
              console.warn("siEstVrai >>> plusieurs éléments trouvés pour", condition.sujet, condition);
            } else if (eleJeu) {
              retVal = ElementsJeuUtils.possedeCetEtat(eleJeu, condition.complement);
              // élément pas trouvé
            } else {
              retVal = false;
            }
            break;

          case 'se trouve':
          case 'se trouvent':
            // vérifier si un élément est présent dans la pièce actuelle
            if (condition.complement === 'ici') {
              let eleJeu = this.eju.trouverElementJeu(condition.sujet, EmplacementElement.ici, true, false);
              retVal = (eleJeu !== null);
              // vérifier si un élément est à un endroit particulier
            } else {
              // TODO: chercher un élément dans une autre pièce
              console.warn("se trouve xxxx pas encore géré :", condition.complement);
              return false;
            }
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
