import { Compteur } from "../../models/compilateur/compteur";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProprieteElement } from "../../models/commun/propriete-element";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { TypeValeur } from "../../models/compilateur/type-valeur";

export class CompteursUtils {

  /** Changer la valeur d’un compteur */
  public static changerValeurCompteurOuPropriete(compteurOuPropriete: Compteur | ProprieteElement, verbe: 'vaut' | 'augmente' | 'diminue' | 'est', opperationStr: string, eju: ElementsJeuUtils, jeu: Jeu) {

    if (compteurOuPropriete) {

      // enlever le de qui débute la nouvelle valeur
      const valeurStr = opperationStr.replace(/^(de |d’|d')/i, "");

      // A) compteur
      if (compteurOuPropriete instanceof Compteur) {
        let opperationNum: number = this.intituleValeurVersNombre(valeurStr, null, null, null, eju, jeu);
        if (opperationNum !== null) {
          switch (verbe) {
            case 'vaut':
              compteurOuPropriete.valeur = opperationNum;
              break;

            case 'diminue':
              compteurOuPropriete.valeur -= opperationNum;
              break;

            case 'augmente':
              compteurOuPropriete.valeur += opperationNum;
              break;

            default:
              console.error("changerValeurCompteurOuPropriete: verbe inconnu:", verbe);
              break;
          }
        }

        // B) propriété
      } else {
        // > nombre
        if (compteurOuPropriete.type == TypeValeur.nombre) {
          let opperationNum: number = this.intituleValeurVersNombre(valeurStr, null, null, null, eju, jeu);
          if (opperationNum !== null) {
            switch (verbe) {
              case 'vaut':
                compteurOuPropriete.valeur = opperationNum.toString();
                break;

              case 'diminue':
                compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) - opperationNum).toString();
                break;

              case 'augmente':
                compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) + opperationNum).toString();
                break;

              default:
                console.error("changerValeurCompteurOuPropriete: verbe inconnu:", verbe);
                break;
            }
          }
          // > texte
        } else {
          switch (verbe) {
            case 'vaut':
            case 'est':
              compteurOuPropriete.valeur = this.intituleValeurVersString(valeurStr, null, null, null, eju, jeu);
              break;

            case 'diminue':
              console.error("changerValeurCompteurOuPropriete: on ne peut pas diminuer une valeur qui n’est pas un nombre.");
              break;

            case 'augmente':
              console.error("changerValeurCompteurOuPropriete: on ne peut pas augmenter une valeur qui n’est pas un nombre.");
              break;

            default:
              console.error("changerValeurCompteurOuPropriete: verbe inconnu:", verbe);
              break;
          }
        }
      }

    }


  }

  public static intituleValeurVersNombre(valeurString: string, ceci: ElementJeu | Compteur | Intitule, cela: ElementJeu | Compteur | Intitule, evenement: Evenement, eju: ElementsJeuUtils, jeu: Jeu): number {
    let valeurNum: number = null;

    // calculer la nouvelle valeur
    // A) nombre entier
    if (valeurString.match(ExprReg.xNombreEntier)) {
      valeurNum = Number.parseInt(valeurString);
      // B) nombre décimal
    } else if (valeurString.match(ExprReg.xNombreDecimal)) {
      valeurString = valeurString.replace(',', '.');
      valeurNum = Number.parseFloat(valeurString);
      // C) compteur ou propriété
    } else if (valeurString == 'quantitéCeci') {
      valeurNum = evenement.quantiteCeci;
    } else if (valeurString == 'quantitéCela') {
      valeurNum = evenement.quantiteCela;
    } else if (valeurString == 'quantité ceci') {
      valeurNum = (ceci as Objet).quantite;
    } else if (valeurString == 'quantité cela') {
      valeurNum = (cela as Objet).quantite;
    } else if (valeurString == 'valeur ceci') {
      valeurNum = (ceci as Compteur).valeur;
    } else if (valeurString == 'valeur cela') {
      valeurNum = (cela as Compteur).valeur;
    } else {
      // retrouver une propriété éventuelle
      const curPropriete = PhraseUtils.trouverPropriete(valeurString);
      if (curPropriete) {
        // retrouver la propriété dans l’objet cible                  
        const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, ceci, cela, eju, jeu);
        if (curProprieteCible) {
          // récupérer la valeur
          if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
            valeurNum = (curProprieteCible as Compteur).valeur;
          } else {
            valeurNum = parseFloat((curProprieteCible as ProprieteElement).valeur);
          }
        }
        // trouver compteur éventuel
      } else {
        console.log("intituleValeurVersNombre: TODO: valeur d’un compteur");
      }
    }
    return valeurNum;
  }

  public static intituleValeurVersString(valeurString: string, ceci: ElementJeu | Compteur | Intitule, cela: ElementJeu | Compteur | Intitule, evenement: Evenement, eju: ElementsJeuUtils, jeu: Jeu): string {

    let retVal = valeurString;

    // retrouver une propriété éventuelle
    const curPropriete = PhraseUtils.trouverPropriete(valeurString);
    if (curPropriete) {
      // retrouver la propriété dans l’objet cible                  
      const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, ceci, cela, eju, jeu);
      if (curProprieteCible) {
        // récupérer la valeur
        if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
          retVal = (curProprieteCible as Compteur).valeur.toString();
        } else {
          retVal = (curProprieteCible as ProprieteElement).valeur;
        }
      }
    }

    return retVal;
  }

}