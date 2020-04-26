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

  siEstVrai(condition: string) {
    let retVal = false;
    const els = PhraseUtils.decomposerCondition(condition);
    if (els) {
      // concerne le joueur
      if (els.sujet.nom === "joueur") {

        switch (els.verbe) {
          case 'possède':
            // retrouver l’objet dans l’inventaire
            let trouve = this.eju.trouverElementJeu(els.sujetComplement, EmplacementElement.inventaire, false);
            retVal = (trouve !== null);
            break;

          case 'est':

            break;

          default:
            console.warn("siEstVrai: verbe pas connu::", els.verbe);
            break;
        }

        // concerne l'inventaire (du joueur)
      } else if (els.sujet.nom == "inventaire") {

        // concerne un élément du jeu
      } else {
        switch (els.verbe) {
          // état
          case 'est':
            let eleJeu = this.eju.trouverElementJeu(els.sujet, EmplacementElement.iciEtInventaire, true);
            // élément trouvé
            if (eleJeu) {
              retVal = ElementsJeuUtils.possedeUnDeCesEtats(eleJeu, els.complement);
              // élément pas trouvé
            } else {
              retVal = false;
            }
            break;

          case 'se trouve':
          case 'se trouvent':
            // vérifier si un élément est présent dans la pièce actuelle
            if (els.complement === 'ici') {
              let eleJeu = this.eju.trouverElementJeu(els.sujet, EmplacementElement.ici, false);
              retVal = (eleJeu !== null);
              // vérifier si un élément est à un endroit particulier
            } else {
              // TODO: chercher un élément dans une autre pièce
              console.warn("se trouve xxxx pas encore géré...", els.complement);
              return false;
            }
            console.warn("se trouve ici:", retVal, els.complement);
            break;

          default:
            console.error("siEstVrai: verbe pas connu::", els.verbe);
            break;
        }
      }
    } else {
      console.error("siEstVrai: condition pas comprise:", condition);
    }
    return retVal;
  }



}
