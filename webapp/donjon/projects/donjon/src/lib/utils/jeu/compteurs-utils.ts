import { Compteur } from "../../models/compilateur/compteur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProprieteConcept } from "../../models/commun/propriete-element";
import { StringUtils } from "../commun/string.utils";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { TypeValeur } from "../../models/compilateur/type-valeur";
import { Nombre } from "../../models/commun/nombre.enum";
import { InstructionDire } from "./instruction-dire";

export class CompteursUtils {

  /** Changer la valeur d’un compteur */
  public static changerValeurCompteurOuPropriete(compteurOuPropriete: Compteur | ProprieteConcept, verbe: 'vaut' | 'augmente' | 'diminue' | 'est', operationStr: string, eju: ElementsJeuUtils, jeu: Jeu, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined, instructionDire: InstructionDire) {

    if (compteurOuPropriete) {

      // enlever le de qui débute la nouvelle valeur
      const valeurStr = operationStr.replace(/^(de |d’|d'|du |des )/i, "");

      // A) compteur
      if (compteurOuPropriete instanceof Compteur) {
        let operationNum: number = this.intituleValeurVersNombre(valeurStr, contexteTour, evenement, eju, jeu);
        if (operationNum !== null) {
          switch (verbe) {
            case 'vaut':
              compteurOuPropriete.valeur = operationNum;
              break;

            case 'diminue':
              compteurOuPropriete.valeur -= operationNum;
              break;

            case 'augmente':
              compteurOuPropriete.valeur += operationNum;
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
          let operationNum: number = this.intituleValeurVersNombre(valeurStr, contexteTour, evenement, eju, jeu);
          if (operationNum !== null) {
            switch (verbe) {
              case 'vaut':
                compteurOuPropriete.valeur = operationNum.toString();
                break;

              case 'diminue':
                // cas spécifique : quantité d’objet
                if (compteurOuPropriete.nom == 'quantité') {
                  console.log("dim quantité");

                  let valQuantite = parseInt(compteurOuPropriete.valeur);
                  // on ne peut diminuer la quantité que si elle n’est pas infinie
                  if (valQuantite != -1) {
                    valQuantite -= operationNum;
                    // la quantité ne peut pas être négative
                    if (valQuantite < 0) {
                      valQuantite = 0;
                    }
                    // attribuer nouvelle valeur
                    compteurOuPropriete.valeur = valQuantite.toString();
                  }
                } else {
                  compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) - operationNum).toString();
                }
                break;

              case 'augmente':
                // cas spécifique : quantité d’objet
                if (compteurOuPropriete.nom == 'quantité') {
                  console.log("aug quantité");
                  let valQuantite = parseInt(compteurOuPropriete.valeur);
                  // on ne peut diminuer la quantité que si elle n’est pas infinie
                  if (valQuantite != -1) {
                    valQuantite += operationNum;
                    // la quantité ne peut pas être négative
                    if (valQuantite < 0) {
                      valQuantite = 0;
                    }
                    // attribuer nouvelle valeur
                    compteurOuPropriete.valeur = valQuantite.toString();
                  }
                } else {
                  compteurOuPropriete.valeur = (parseFloat(compteurOuPropriete.valeur) + operationNum).toString();
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
              // cas spécifique: intitulé
              if (compteurOuPropriete.nom == 'intitulé') {

                console.warn(`valeurStr=${valeurStr}`);
                let nouvelleValeur = this.intituleValeurVersString(valeurStr, contexteTour, eju, jeu);
                console.warn(`nouvelleValeur step 1=${nouvelleValeur}`);
                // calculer le texte dynamique éventuel
                // TODO: Calculer texte dynamiquement (si contient des []) avant d’appliquer le nouvel intitulé.

                nouvelleValeur = instructionDire.calculerTexteDynamique(nouvelleValeur, 0, undefined, contexteTour, evenement, undefined);
                console.warn(`nouvelleValeur step 2=${nouvelleValeur}`);

                // gérer groupe nominal
                const intituleDecompose = PhraseUtils.getGroupeNominalDefiniOuIndefini(nouvelleValeur, false);
                if (intituleDecompose) {
                  compteurOuPropriete.parent.intitule = intituleDecompose;
                  if (compteurOuPropriete.parent.nombre == Nombre.p) {
                    compteurOuPropriete.parent.intituleP = compteurOuPropriete.parent.intitule;
                    compteurOuPropriete.parent.intituleS = null;
                  } else {
                    compteurOuPropriete.parent.intituleS = compteurOuPropriete.parent.intitule;
                    compteurOuPropriete.parent.intituleP = null;
                  }
                } else {
                  // console.error("L’intitulé « " + valeurStr + " » n’est pas un groupe nominal supporté.")
                  contexteTour.ajouterErreurDerniereInstruction(`L’intitulé « ${nouvelleValeur}" » n’est pas un groupe nominal supporté.`);
                }
                // autres cas
              } else {
                compteurOuPropriete.valeur = this.intituleValeurVersString(valeurStr, contexteTour, eju, jeu);
              }
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

  /**
   * Donner le nombre correspondant au nombre spécifié sous forme de chaîne de caractères.
   * @param valeurString 
   * @returns Le nombre trouvé ou 0 si aucun nombre trouvé.
   */
  public static intituleNombreVersNombre(valeurString: string): number {
    let valeurNum = 0;
    // A) nombre entier
    if (valeurString.match(ExprReg.xNombreEntier)) {
      valeurNum = Number.parseInt(valeurString);
      // B) nombre décimal
    } else if (valeurString.match(ExprReg.xNombreDecimal)) {
      valeurString = valeurString.replace(',', '.');
      valeurNum = Number.parseFloat(valeurString);
    }
    return valeurNum;
  }

  public static intituleValeurVersNombre(valeurString: string, contexteTour: ContexteTour, evenement: Evenement, eju: ElementsJeuUtils, jeu: Jeu): number {
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
      valeurNum = (contexteTour.ceci as Objet).quantite;
    } else if (valeurString == 'quantité cela') {
      valeurNum = (contexteTour.cela as Objet).quantite;
    } else if (valeurString == 'valeur ceci') {
      valeurNum = (contexteTour.ceci as Compteur).valeur;
    } else if (valeurString == 'valeur cela') {
      valeurNum = (contexteTour.cela as Compteur).valeur;
    } else {
      // retrouver une propriété éventuelle
      const curPropriete = PhraseUtils.trouverPropriete(valeurString);
      if (curPropriete) {
        // retrouver la propriété dans l’objet cible                  
        const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, contexteTour, eju, jeu);
        if (curProprieteCible) {
          // récupérer la valeur
          if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
            valeurNum = (curProprieteCible as Compteur).valeur;
          } else {
            valeurNum = parseFloat((curProprieteCible as ProprieteConcept).valeur);
          }
        }
        // trouver compteur éventuel
      } else {
        const resultatGN = ExprReg.xGroupeNominalArticleDefini.exec(valeurString);
        if (resultatGN) {
          let gn = new GroupeNominal(resultatGN[1] ?? null, resultatGN[2], resultatGN[3] ?? null);
          const curCompteur = eju.trouverCompteurAvecNom(gn.nomEpithete);
          if (curCompteur) {
            valeurNum = curCompteur.valeur;
          }
        }

      }
    }
    return valeurNum;
  }

  /**
   * Renvoyer la valeur fournie ou bien la valeur correspondante à l’intitulé de valeur fourni.
   * @param valeurString valeur ou intitulé de la valeur (propriété d’un objet)
   */
  public static intituleValeurVersString(valeurString: string, contexteTour: ContexteTour | undefined, eju: ElementsJeuUtils, jeu: Jeu): string {

    let retVal: string;

    // retirer les guillements ("") autours du texte
    if (valeurString.startsWith('"') && valeurString.endsWith('"')) {
      retVal = valeurString.slice(1, valeurString.length - 1);
    } else {
      retVal = valeurString;
    }

    // retrouver une propriété éventuelle
    const curPropriete = PhraseUtils.trouverPropriete(valeurString);
    if (curPropriete) {
      // retrouver la propriété dans l’objet cible                  
      const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, contexteTour, eju, jeu);
      if (curProprieteCible) {
        // récupérer la valeur
        if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
          retVal = (curProprieteCible as Compteur).valeur.toString();
        } else {
          retVal = (curProprieteCible as ProprieteConcept).valeur;
        }
      }
    }
    return retVal;
  }

  /**
   * Retourne un compteur contenant la valeur de la propriété à condition que la
   * propriété soit de type « nombre ».
   * @param propriete 
   * @returns 
   */
  public static proprieteElementVersCompteur(propriete: ProprieteConcept) {
    if (propriete.type == TypeValeur.nombre) {
      return new Compteur(propriete.nom, parseFloat(propriete.valeur));
    } else {
      return null;
    }
  }

}