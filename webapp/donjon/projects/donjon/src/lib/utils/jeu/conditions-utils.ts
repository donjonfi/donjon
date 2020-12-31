import { Condition, LienCondition } from '../../models/compilateur/condition';

import { ClasseUtils } from '../commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';

export class ConditionsUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(jeu, verbeux);
  }

  /** Utilitaires - Éléments du jeu */
  private eju: ElementsJeuUtils;

  /** 
   * Vérifier une condition de type "est", c'est à dire vérifer l'état ou la classe.
   * /!\ La négation n'est pas appliquée ici, il faut le faire ensuite.
   */
  private verifierConditionElementJeuEst(cond: Condition, sujet: ElementJeu) {
    let resultCondition: boolean = null;
    if (!cond.sujetComplement || !cond.sujetComplement.determinant) {
      // vérifier la liste des états
      resultCondition = this.jeu.etats.possedeEtatElement(sujet, cond.complement, this.eju);
    } else {
      switch (cond.sujetComplement.determinant) {
        case "un ":
        case "une ":
        case "des ":
        case "de la ":
        case "du ":
        case "de l’":
        case "de l'":
          resultCondition = ClasseUtils.heriteDe(sujet.classe, cond.sujetComplement.nom);
          // console.log("resultCondition=", resultCondition, "el.classe=", sujet.classe, "sujetComp.nom=", cond.sujetComplement.nom);
          break;

        case "la ":
        case "le ":
        case "l’":
        case "l'":
        case "les ":
          resultCondition = (sujet.intitule.nom === cond.sujetComplement.nom);
          break;

        default:
          console.error("verifierConditionElementJeuEst : déterminant pas géré:", cond.sujetComplement.determinant);
          resultCondition = false;
          break;
      }
    }

    return resultCondition;

  }

  /**
   * Vérifier la condition ainsi que les liens.
   */
  siEstVraiAvecLiens(conditionString: string, condition: Condition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {

    const resultConditionA = this.siEstVraiSansLien(conditionString, condition, ceci, cela);
    let resultConditionB: boolean = null;
    let resultConditionC: boolean = null;
    let resultConditionD: boolean = null;
    let resultFinal = resultConditionA;
    // une 2e condition est liée
    if (condition.lien) {
      switch (condition.lien.typeLien) {
        // ET
        case LienCondition.et:
          // si c’est un ET et que la première condition est vraie, tester la 2e
          if (resultFinal === true) {
            resultFinal = this.siEstVraiSansLien(conditionString, condition.lien, ceci, cela);
            // si les 2 premières conditions sont vraies, tester la 3e
            if (condition.lien.lien && resultFinal === true) {
              resultFinal = this.siEstVraiSansLien(conditionString, condition.lien.lien, ceci, cela);
              // si les 3 premières conditions sont vraies, tester la 4e
              if (condition.lien.lien.lien && resultFinal === true) {
                resultFinal = this.siEstVraiSansLien(conditionString, condition.lien.lien.lien, ceci, cela);
              }
            }
          }
          break;
        // OU
        case LienCondition.ou:
          // si c’est un OU et que la premièr condition est fausse, tester la 2e
          if (resultConditionA !== true) {
            resultFinal = this.siEstVraiSansLien(conditionString, condition.lien, ceci, cela);
            // si les 2 premières conditions sont fausses, tester la 3e
            if (condition.lien.lien && resultFinal !== true) {
              resultFinal = this.siEstVraiSansLien(conditionString, condition.lien.lien, ceci, cela);
              // si les 3 premières conditions sont fausses, tester la 4e
              if (condition.lien.lien.lien && resultFinal !== true) {
                resultFinal = this.siEstVraiSansLien(conditionString, condition.lien.lien.lien, ceci, cela);
              }
            }
          }
          break;
        // SOIT
        case LienCondition.soit:
          let nbVraiSoit = resultConditionA ? 1 : 0;
          // si c’est un SOIT, tester la 2e
          resultConditionB = this.siEstVraiSansLien(conditionString, condition.lien, ceci, cela);
          nbVraiSoit += resultConditionB ? 1 : 0;
          // tester la 3e condition (si pas encore sûr que c’est faux)
          if (nbVraiSoit < 2 && condition.lien.lien) {
            // le résultat final est vrai si la 3e condition est différente du résultat des 2 premières.
            resultConditionC = this.siEstVraiSansLien(conditionString, condition.lien.lien, ceci, cela);
            nbVraiSoit += resultConditionC ? 1 : 0;
            // tester la 4e condition (si pas encore sûr que c’est faux)
            if (nbVraiSoit < 2 && condition.lien.lien.lien) {
              // le résultat final est vrai si la 3e condition est différente du résultat des 2 premières.
              resultConditionD = this.siEstVraiSansLien(conditionString, condition.lien.lien.lien, ceci, cela);
              nbVraiSoit += resultConditionD ? 1 : 0;
            }
          }
          resultFinal = nbVraiSoit === 1;
          break;

        default:
          break;
      }
    }
    return resultFinal;

  }

  /**
   * Tester si la condition est vraie.
   * Remarque: le LIEN (et/ou/soit) n'est PAS TESTÉ. La méthode siEstVraiAvecLiens le fait.
   */
  public siEstVraiSansLien(conditionString: string, condition: Condition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {
    let retVal = false;
    if (condition == null) {
      condition = PhraseUtils.getCondition(conditionString);
    }
    if (condition) {
      // condition spéciale: « historique contient "xxxxx"»
      if (condition.sujet.nom === 'historique' && condition.verbe === "contient") {
        const recherche = condition.complement?.trim();
        if (recherche) {
          retVal = this.jeu.sauvegardes.includes(recherche);
        } else {
          console.error("check si l’historique contient >>> recherche vide");
        }

        // conditions normales
      } else {
        // 1 - Trouver le sujet
        // ++++++++++++++++++++
        let sujet: ElementJeu | Intitule = null;

        if (condition.sujet) {
          if (condition.sujet.nom === 'ceci') {
            sujet = ceci;
            if (!ceci) {
              console.warn("siEstVrai: le « ceci » de la condition est null.");
            }
          } else if (condition.sujet.nom === 'cela') {
            sujet = cela;
            if (!cela) {
              console.warn("siEstVrai: le « cela » de la condition est null.");
            }
          // } else if (condition.sujet.nom === 'joueur') {
          //   sujet = this.jeu.joueur;
          } else {
            const correspondances = this.eju.trouverCorrespondance(condition.sujet, false);
            if (correspondances.elements.length == 1) {
              sujet = correspondances.elements[0];
            } else if (correspondances.elements.length > 1) {
              console.error("siEstVrai >>> plusieurs éléments trouvés pour le sujet:", condition.sujet, condition, correspondances);
            } else {
              console.error("siEstVrai >>> pas d’élément trouvé pour pour le sujet:", condition.sujet, condition, correspondances);
            }
          }
        }


        if (sujet) {

          // 2 - Trouver le verbe
          // ++++++++++++++++++++
          switch (condition.verbe) {
            // ÉTAT
            case 'est':
              // est une [classe] | est [état]
              // remarque: négation appliquée plus loin.
              retVal = this.verifierConditionElementJeuEst(condition, (sujet as ElementJeu));
              break;

            // CONTENU
            case 'contient':
              // remarque: négation appliquée plus loin.
              if (condition.sujetComplement && condition.sujetComplement.nom === 'objet' && (condition.sujetComplement.determinant?.trim() === 'un' || condition.sujetComplement.determinant === "d'" || condition.sujetComplement.determinant === 'd’')) {
                retVal = this.eju.verifierContientObjet(sujet as ElementJeu);
              } else {
                console.error("siEstVrai > condition « contient » pas encore gérée pour le complément ", condition.complement);
              }
              break;


            // PAS DE (aucun)
            case 'aucune': // forme "aucun xxxx pour yyyy". Ex: aucune description pour ceci.
            case 'aucun': // forme "aucun xxxx pour yyyy"
              // remarque: négation appliquée plus loin.
              if (condition.complement === 'description') {
                retVal = (!(sujet as ElementJeu).description);
              } else if (condition.complement === 'aperçu') {
                retVal = (!(sujet as ElementJeu).apercu);
              } else if (condition.complement === 'texte') {
                retVal = (!(sujet as ElementJeu).texte);
              } else {
                console.error("siEstVrai > condition « aucun » pas encore gérée pour le complément ", condition.complement);
              }
              break;

            // ÉLÉMENT POSSÉDÉ (PAR LE JOUEUR)
            case 'possède':
              if (sujet.nom === "joueur") {
                // vérifier si l’objet cible est possédé par le joueur
                // > remarque: négation appliquée plus loin.
                const objetCible = this.trouverObjetCible(condition.complement, condition.sujetComplement, ceci, cela);
                if (objetCible) {
                  retVal = this.jeu.etats.possedeEtatIdElement(objetCible, this.jeu.etats.possedeID);
                }
                break;
              } else {
                console.error("siEstVrai > condition « possède » prise en charge uniquement pour le joueur.");
              }
              break;


            // ÉLÉMENT PORTÉ (PAR LE JOUEUR)
            case 'porte':
              if (sujet.nom.toLowerCase() === "joueur") {
                // vérifier si l’objet cible est porté par le joueur
                // > remarque: négation appliquée plus loin.
                const objetCible = this.trouverObjetCible(condition.complement, condition.sujetComplement, ceci, cela);
                if (objetCible) {
                  retVal = this.jeu.etats.possedeEtatIdElement(objetCible, this.jeu.etats.porteID);
                }
                break;
              } else {
                console.error("siEstVrai > condition « porte » prise en charge uniquement pour le joueur.", sujet.nom);
              }
              break;

            // LOCALISATION
            case 'se trouve':
            case 'se trouvent':
              // retrouver la destination
              // remarque: négation appliquée plus loin.
              let destination: ElementJeu = null;
              if (condition.sujetComplement?.nom === "ici") {
                destination = this.eju.curLieu;
              } else {
                const correspondances = this.eju.trouverCorrespondance(condition.sujetComplement, false);
                if (correspondances.nbCor === 1) {
                  destination = correspondances.elements[0];
                } else if (correspondances.nbCor === 0) {
                  console.error("condition se trouve: pas de correspondance trouvée pour dest=", condition.sujetComplement);
                } else if (correspondances.nbCor > 1) {
                  console.error("condition se trouve: plusieurs correspondances trouvées pour dest=", condition.sujetComplement, "cor=", correspondances);
                }
              }

              // // retrouver l’objet concerné
              // const ciblesTrouvees = this.eju.trouverObjet(condition.sujet, false, (condition.verbe.endsWith('e') ? Nombre.s : Nombre.p));
              // let cible: Objet = null;
              // if (ciblesTrouvees.length === 1) {
              //   cible = ciblesTrouvees[0];
              // } else if (ciblesTrouvees.length === 0) {
              //   console.error("condition se trouve: pas de correspondance trouvée pour cible=", condition.sujet);
              // } else if (ciblesTrouvees.length > 1) {
              //   console.error("condition se trouve: plusieurs correspondances trouvées pour cible=", condition.sujet, "cor=", ciblesTrouvees);
              // }

              // si on a trouvé la cible et la destination
              if (sujet && destination) {
                // vérifier que la cible se trouve au bon endroit
                if ((sujet as Objet).position.cibleId === destination.id) {
                  retVal = true;
                }
              }
              break;

            case 'réagit':
            case 'réagissent':
              console.warn("réagit: sujet=", sujet);
              
              // remarque: négation appliquée plus loin.
              if ((sujet as Objet).reactions && (sujet as Objet).reactions.length > 0) {
                retVal = true;
              }
              break;

            case 'vaut':
              // TODO: gérer plus de situations (en test)
              // remarque: négation appliquée plus loin.
              console.warn("vaut condi=", condition, "ceci=", ceci, "cela=", cela);

              if (('"' + sujet.nom + '"') === condition.complement) {
                retVal = true;
              }
              break;

            default:
              console.error("siEstVrai: verbe pas connu::", condition.verbe);
              break;
          }
        } else {
          console.error("siEstVrai: Condition sans sujet pas gérée:", condition);
        }
      }
    } else {
      console.error("siEstVrai: condition pas comprise:", condition);
    }

    if (this.verbeux) {
      console.log("siEstVrai: ", condition, retVal);
    }
    // prise en compte de la négation
    if (condition.negation) {
      retVal = !retVal;
    }

    return retVal;
  }

  /**
   * Retrouver l’objet cible de la condition.
   * @param brute « ceci » et « cela » sont gérés.
   * @param intitule un objet à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  private trouverObjetCible(brute: string, intitule: GroupeNominal, ceci: Intitule | ElementJeu, cela: Intitule | ElementJeu): Objet {
    let objetCible: Objet = null;
    // retrouver OBJET CLASSIQUE
    if (intitule) {
      const objetsTrouves = this.eju.trouverObjet(intitule, false);
      if (objetsTrouves.length == 1) {
        objetCible = objetsTrouves[0];
      } else {
        console.warn("Instructions > trouverObjetCible > plusieurs correspondances trouvées pour :", brute);
      }
      // retrouver OBJET SPÉCIAL
    } else if (brute === 'ceci') {
      if (ceci && ClasseUtils.heriteDe(ceci?.classe, EClasseRacine.objet)) {
        objetCible = ceci as Objet;
      } else {
        console.error("ConditionsUtils > trouverObjetCible > ceci n’est pas un objet.");
      }
    } else if (brute === 'cela') {
      if (cela && ClasseUtils.heriteDe(cela?.classe, EClasseRacine.objet)) {
        objetCible = cela as Objet;
      } else {
        console.error("ConditionsUtils > trouverObjetCible > cela n’est pas un objet.");
      }
    } else {
      console.error("ConditionsUtils > trouverObjetCible > objet spécial pas pris en change :", brute);
    }
    if (!objetCible) {
      console.warn("ConditionsUtils > trouverObjetCible > pas pu trouver :", brute);
    }
    return objetCible;
  }

}
