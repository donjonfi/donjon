import { Compteur } from "../../models/compilateur/compteur";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { MotUtils } from "../commun/mot-utils";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProprieteElement } from "../../models/commun/propriete-element";
import { StringUtils } from "../commun/string.utils";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { TypeValeur } from "../../models/compilateur/type-valeur";

export class CompteursUtils {

  /** Changer la valeur d’un compteur */
  public static changerValeurCompteurOuPropriete(compteurOuPropriete: Compteur | ProprieteElement, verbe: 'vaut' | 'augmente' | 'diminue' | 'est', opperationStr: string, eju: ElementsJeuUtils, jeu: Jeu, ceci: ElementJeu | Compteur | Intitule = null, cela: ElementJeu | Compteur | Intitule = null, evenement: Evenement = null, declenchements: number) {

    if (compteurOuPropriete) {

      // enlever le de qui débute la nouvelle valeur
      const valeurStr = opperationStr.replace(/^(de |d’|d')/i, "");

      // A) compteur
      if (compteurOuPropriete instanceof Compteur) {
        let opperationNum: number = this.intituleValeurVersNombre(valeurStr, ceci, cela, evenement, eju, jeu);
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
          let opperationNum: number = this.intituleValeurVersNombre(valeurStr, ceci, cela, evenement, eju, jeu);
          if (opperationNum !== null) {
            switch (verbe) {
              case 'vaut':
                compteurOuPropriete.valeur = opperationNum.toString();
                break;

              case 'diminue':
                // cas spécifique : quantité d’objet
                if (compteurOuPropriete.nom == 'quantité') {
                  console.log("dim quantité");

                  let valQuantite = parseInt(compteurOuPropriete.valeur);
                  // on ne peut diminuer la quantité que si elle n’est pas infinie
                  if (valQuantite != -1) {
                    valQuantite -= opperationNum;
                    // la quantité ne peut pas être négative
                    if (valQuantite < 0) {
                      valQuantite = 0;
                    }
                    // attribuer nouvelle valeur
                    compteurOuPropriete.valeur = valQuantite.toString();
                  }
                } else {
                  compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) - opperationNum).toString();
                }
                break;

              case 'augmente':
                // cas spécifique : quantité d’objet
                if (compteurOuPropriete.nom == 'quantité') {
                  console.log("aug quantité");
                  let valQuantite = parseInt(compteurOuPropriete.valeur);
                  // on ne peut diminuer la quantité que si elle n’est pas infinie
                  if (valQuantite != -1) {
                    valQuantite += opperationNum;
                    // la quantité ne peut pas être négative
                    if (valQuantite < 0) {
                      valQuantite = 0;
                    }
                    // attribuer nouvelle valeur
                    compteurOuPropriete.valeur = valQuantite.toString();
                  }
                } else {
                  compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) + opperationNum).toString();
                }
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
              compteurOuPropriete.valeur = this.intituleValeurVersString(valeurStr, ceci, cela, evenement, eju, jeu);
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
        const resultatGN = ExprReg.xGroupeNominal.exec(valeurString);
        if (resultatGN) {
          let gn = new GroupeNominal(resultatGN[1] ?? null, resultatGN[2], resultatGN[3] ?? null);
          const curCompteur = eju.trouverCompteur(gn);
          if (curCompteur && curCompteur.length) {
            if (curCompteur.length == 1) {
              valeurNum = curCompteur[0].valeur;
            } else {
              console.error("intituleValeurVersNombre: plusieurs compteurs trouvés pour ", valeurString);
            }
          }
        }

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