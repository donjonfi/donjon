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
            let trouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.inventaire, false);
            if (trouve) {
              retVal = true;
            }
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
        let eleJeu = this.eju.trouverElementJeu(els.sujet, EmplacementElement.iciEtInventaire, true);
        if (eleJeu) {
          console.warn("siEstVrai: sujet trouvé:", eleJeu);
          switch (els.verbe) {
            // état
            case 'est':

              retVal = ElementsJeuUtils.possedeUnDeCesEtats(eleJeu, els.complement);
              if (this.verbeux) {
                console.warn("siEstVrai: est:", els.complement, retVal);
              }
              break;

            default:
              console.warn("siEstVrai: verbe pas connu::", els.verbe);
              break;
          }
        } else {
          console.warn("siEstVrai: sujet pas trouvé:", els.sujet);
        }
      }
    } else {
      console.error("siEstVrai: condition pas comprise:", condition);
    }
    return retVal;
  }



}
