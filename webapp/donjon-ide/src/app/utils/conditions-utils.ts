import { Classe, EClasseRacine } from '../models/commun/classe';

import { Condition } from '../models/compilateur/condition';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { Jeu } from '../models/jeu/jeu';
import { Objet } from '../models/jeu/objet';
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

  conditionsRemplies(conditions: Condition[], ceci: ElementJeu, cela: ElementJeu) {
    if (conditions.length === 0) {
      console.warn("conditions-utils > conditionsRemplies: aucune condition à vérier.", conditions);
      return true;
    } else if (conditions.length === 1) {
      // console.warn("conditions-utils > conditionsRemplies: à vérifier…", conditions);
      const curCondition = conditions[0];
      let resultCondition = false;
      if (curCondition.verbe === 'est') {
        if (curCondition.sujet.nom === 'ceci') {
          resultCondition = this.verifierConditionElementJeuEst(curCondition, ceci);
        } else if (curCondition.sujet.nom === 'cela') {
          resultCondition = this.verifierConditionElementJeuEst(curCondition, cela);
        } else {
          console.error("conditionsRemplies: sujet pas supporté:", curCondition.sujet);
        }
        console.error("conditionsRemplies >>>> resultat:", resultCondition);
        return resultCondition;
      } else {
        console.error("conditionsRemplies: verbe pas supporté:", curCondition.verbe);
        return false;
      }
    } else {
      console.error("conditions-utils > conditionsRemplies: ne gère pas encore plusieurs conditions.", conditions);
      return false;
    }
  }

  private verifierConditionElementJeuEst(cond: Condition, el: ElementJeu) {
    let resultCondition = null;
    if (!cond.sujetComplement || !cond.sujetComplement.determinant) {
      // s’il s’agit d’un objet, on vérifier d’abord les attributs
      if (Classe.heriteDe(el.classe, EClasseRacine.objet)) {
        const obj = el as Objet;
        // attributs spécifiques aux objets
        // - possede
        if (cond.complement.startsWith('possédé')) {
          resultCondition = obj.possede;
        } else if (cond.complement.startsWith('visible')) {
          resultCondition = obj.visible;
        }
      }
      // si pas un objet ou pas un attribut spécifique, vérifier la liste des états
      if (resultCondition === null) {
        resultCondition = ElementsJeuUtils.possedeCetEtat(el, cond.complement);
      }

    } else {
      switch (cond.sujetComplement.determinant) {
        case "un ":
        case "une ":
        case "des ":
        case "de la ":
        case "du ":
        case "de l’":
        case "de l'":
          resultCondition = Classe.heriteDe(el.classe, cond.sujetComplement.nom);
          console.log("resultCondition=", resultCondition, "el.classe=", el.classe, "sujetComp.nom=", cond.sujetComplement.nom);
          break;

        case "la ":
        case "le ":
        case "l’":
        case "l'":
        case "les ":
          resultCondition = (el.intitule.nom === cond.sujetComplement.nom);
          break;

        default:
          console.error("verifierConditionElementJeuEst : déterminant pas géré:", cond.sujetComplement.determinant);
          resultCondition = false;
          break;
      }
    }

    // négation de la condition ?
    if (resultCondition !== null && cond.negation) {
      resultCondition = !resultCondition;
    }

    return resultCondition;

  }

  siEstVrai(conditionString: string, condition: Condition, ceci: ElementJeu, cela: ElementJeu) {
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
              console.error("siEstVrai >>> pas d’élément trouvé pour", condition.sujet, condition);
            }
            break;

          case 'contient':
            if (condition.sujet.nom === 'ceci') {
              if (condition.complement === 'un objet') {
                retVal = this.eju.verifierContientObjet(ceci);
              } else {
                console.error("siEstVari > ceci contient YYYYY pas encore gérée.");
              }
            } else if (condition.sujet.nom === 'cela') {
              if (condition.complement === 'un objet') {
                retVal = this.eju.verifierContientObjet(cela);
              } else {
                console.error("siEstVari > cela contient YYYYY pas encore gérée.");
              }
            }

            break;

          case 'possède':
          case 'possèdent':
            console.error("siEstVrais > condition « possède » pas encore gérée.");
            break;

          case 'se trouve':
          case 'se trouvent':
            // vérifier si un élément est présent à l’endroit indiqué
            // (pour l’instant seul « ici » est géré.)
            const objetsTrouves = this.eju.getObjetsQuiSeTrouventLa(condition.complement);

            console.log("siEstVrai >> se trouve >> objetsTrouves=", objetsTrouves);

            // singulier
            if (condition.verbe.endsWith('e')) {
              objetsTrouves.forEach(obj => {
                if (obj.intituleS.nom === condition.sujet.nom && (!condition.sujet.epithete || condition.sujet.epithete === obj.intituleS.epithete)) {
                  retVal = true;
                }
              });
              // pluriel
            } else {
              objetsTrouves.forEach(obj => {
                if (obj.intituleP.nom === condition.sujet.nom && (!condition.sujet.epithete || condition.sujet.epithete === obj.intituleP.epithete)) {
                  retVal = true;
                }
              });
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

    console.info("siEstVrai: ", condition, retVal);

    return retVal;
  }



}
