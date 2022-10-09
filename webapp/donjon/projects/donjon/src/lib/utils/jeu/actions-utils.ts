import { Action, CandidatActionCeciCela } from "../../models/compilateur/action";
import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";

import { CibleAction } from "../../models/compilateur/cible-action";
import { ClasseUtils } from "../commun/classe-utils";
import { Correspondance } from "./correspondance";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Etat } from "../../models/commun/etat";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { PhraseUtils } from "../commun/phrase-utils";
import { ResultatChercherCandidats } from "../../models/jeu/resultat-chercher-candidats";
import { ResultatVerifierCandidat } from "../../models/jeu/resultat-verifier-candidat";
import { StringUtils } from "../commun/string.utils";

export class ActionsUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
  }

  private eju: ElementsJeuUtils;

  public obtenirRaisonRefuCommande(commande: ElementsPhrase, ceciCommande: Correspondance, celaCommande: Correspondance) {

    let raisonRefu: string = "Inconnu.";

    // 1. trouver l’infinitif (en tenant compte des accents)
    let resCherCand = this.chercherCandidatsCommandeSansControle(commande);

    // verbe inconnu
    if (!resCherCand.verbeConnu) {
      raisonRefu = "Désolé, je ne connais pas le verbe « " + commande.infinitif + " »";
      // verbe connu 
    } else {
      // I) plus aucun candidat en lice => problème ave le nombre d’arguments
      if (resCherCand.candidatsEnLice.length == 0) {
        //     I.A) 1 seul candidat refusé
        if (resCherCand.candidatsRefuses.length == 1) {
          raisonRefu = "Je sais " + this.expliquerRefuTropOuTropPeuArguments(resCherCand.candidatsRefuses[0], commande);
          // I.B) plusieurs candidats refusés
        } else {
          raisonRefu = "Je sais :";
          resCherCand.candidatsRefuses.forEach(candidat => {
            raisonRefu += "{n}{t}- " + this.expliquerRefuTropOuTropPeuArguments(candidat, commande);
          });
        }
        // II) il reste des candidats en lice => le nombre d’arguments est accepté
      } else {
        // il s’agit forcément d’une action avec 1 ou 2 arguments, sinon elle ne serait pas refusée…
        // remarque: il ne peut pas y avoir plusieurs fois la même commande avec le même nombre d’arguments
        // sauf pour les commandes simplifiées.

        let ceciToujoursRefuse = false;
        let celaToujoursRefuse = false;

        let argumentUnique = true;
        // il y a un cela => 2 arguments
        if (celaCommande) {
          argumentUnique = false;
        }

        // tester 1er argument (ceci):
        let candidatsOkCeci: Action[] = [];
        let candidatsKoCeci: Action[] = [];
        resCherCand.candidatsEnLice.forEach(candidat => {
          const resCurCeci = this.verifierCandidatCeciCela(ceciCommande, candidat.cibleCeci);
          if (resCurCeci.elementsTrouves.length) {
            candidatsOkCeci.push(candidat);
          } else {
            candidatsKoCeci.push(candidat);
          }
        });

        if (candidatsOkCeci.length === 0) {
          ceciToujoursRefuse = true;
        }

        // CECI + CELA
        if (celaCommande) {
          // tester le 2e argument (cela)
          let candidatsOkCela: Action[] = [];
          let candidatsKoCela: Action[] = [];
          resCherCand.candidatsEnLice.forEach(candidat => {
            const resCurCeci = this.verifierCandidatCeciCela(celaCommande, candidat.cibleCela);
            if (resCurCeci.elementsTrouves.length) {
              candidatsOkCela.push(candidat);
            } else {
              candidatsKoCela.push(candidat);
            }
          });
          if (candidatsOkCela.length === 0) {
            celaToujoursRefuse = true;
          }
        }

        // CECI et/ou CELA sont KO
        if (ceciToujoursRefuse || celaToujoursRefuse) {

          // si plusieurs candidats, prendre l’action la plus générique.
          if (resCherCand.candidatsEnLice.length > 1) {
            resCherCand.candidatsEnLice = [this.garderActionCompleteSiPossible(resCherCand.candidatsEnLice)];
          }

          // // un seul candidat
          // if (resCherCand.candidatsEnLice.length == 1) {
          // détaillé commande trouvée
          raisonRefu = "Je sais " + this.afficherCandidatAction(resCherCand.candidatsEnLice[0], !ceciToujoursRefuse, !celaToujoursRefuse);
          // refu ceci
          if (ceciToujoursRefuse) {
            // expliquer refu CECI + CELA
            if (celaToujoursRefuse) {
              raisonRefu += (" mais " + this.expliquerRefuClasseOuEtatArgument(resCherCand.candidatsEnLice[0].cibleCeci, ceciCommande, 'ceci', argumentUnique));
              raisonRefu += (" et " + this.expliquerRefuClasseOuEtatArgument(resCherCand.candidatsEnLice[0].cibleCela, celaCommande, 'cela', argumentUnique)) + ".";
              // expliquer refu CECI
            } else {
              if (argumentUnique) {
                raisonRefu = (this.expliquerRefuClasseOuEtatArgument(resCherCand.candidatsEnLice[0].cibleCeci, ceciCommande, 'ceci', argumentUnique));
              } else {
                raisonRefu += (" mais " + this.expliquerRefuClasseOuEtatArgument(resCherCand.candidatsEnLice[0].cibleCeci, ceciCommande, 'ceci', argumentUnique) + ".");
              }
            }
            // expliquer refu CELA
          } else if (celaToujoursRefuse) {
            // expliquer refu cela
            raisonRefu += (" mais " + this.expliquerRefuClasseOuEtatArgument(resCherCand.candidatsEnLice[0].cibleCela, celaCommande, 'cela', argumentUnique) + ".");
          }

          // CECI et CELA sont OK à certains moments
          // => combinaison refusée
          // => il y a forcément plusieurs actions (sinon on n’arriverait pas ici)
        } else {
          raisonRefu = "Je sais :";
          resCherCand.candidatsRefuses.forEach(candidat => {
            // détaillé commande trouvée
            raisonRefu += "{n}{t}- " + this.afficherCandidatAction(candidat, false, false);
          });
          raisonRefu += "La combinaison de « " + ceciCommande.intitule + " » et « " + ceciCommande.intitule + " » ne convient pas.";
        }

      }
    }
    return raisonRefu;
  }

  /**
   * On garde l’action complete parmis la liste d’actions.
   * S’il n’y en a pas on prend la première.
   * @param candidats 
   */
  private garderActionCompleteSiPossible(candidats: Action[]) {
    let retVal: Action = null;
    if (candidats.length) {
      retVal = candidats.find(x => !x.simplifiee);
      if (!retVal) {
        retVal = candidats[0];
      }
    }
    return retVal;
  }

  /**
   * Expliquer pourquoi le ceci (ou cela) de l’action ne convient pas pour le ceci (ou cela) de l’action.
   * @param actionCeci 
   * @param commandeCeci 
   */
  private expliquerRefuClasseOuEtatArgument(actionCeci: CibleAction, commandeCeci: Correspondance, tokenCeciOuCela: 'ceci' | 'cela', argumentUnique: boolean) {

    let retVal: string;

    //     A. classe
    if (this.estCibleUneClasse(actionCeci)) {
      let classeCibleCeci = ClasseUtils.trouverClasse(this.jeu.classes, actionCeci.nom);
      // classe trouvée
      if (classeCibleCeci) {
        if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.element)) {
          // CECI devrait concerner un ÉLÉMENT mais on n’a pas trouvé d’élément.
          if (commandeCeci.elements.length === 0) {
            if (argumentUnique) {
              retVal = "Je n’ai pas trouvé « " + commandeCeci.intitule + " ».";
            } else {
              retVal = "je n’ai pas trouvé « " + commandeCeci.intitule + " »";
            }
          } else {
            // s’il doit s’agir d’un OBJET
            if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.objet)) {
              // objet PAS TROUVÉ
              if (commandeCeci.objets.length === 0) {
                if (argumentUnique) {
                  retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un objet.";
                } else {
                  retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un objet";
                }
                // objet TROUVÉ et CLASSE OK
                //   TODO: gestion quand plusieurs objets ?
              } else if (ClasseUtils.heriteDe(commandeCeci.elements[0].classe, classeCibleCeci.nom)) {
                // expliquer souci avec l’état de l’objet
                retVal = this.expliquerRefuEtatElement(commandeCeci.elements[0], tokenCeciOuCela, actionCeci, argumentUnique);
                // objet TROUVÉ et CLASSE KO
              } else {

                // devrait être une personne
                if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.personne)) {
                  if (argumentUnique) {
                    retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] une personne.";
                  } else {
                    retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] une personne";
                  }
                  // devrait être un être vivant
                } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.vivant)) {
                  if (argumentUnique) {
                    retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un être vivant.";
                  } else {
                    retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un être vivant";
                  }
                  // devrait être autre-chose
                } else {
                  if (argumentUnique) {
                    retVal = "La classe de l’objet « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande.";
                  } else {
                    retVal = "la classe de l’objet « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande";
                  }
                }
              }
              // s’il doit s’agir d’un LIEU
            } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.lieu)) {
              // lieu PAS TROUVÉ
              if (commandeCeci.lieux.length === 0) {
                retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un lieu.";
                // lieu TROUVÉ et CLASSE OK
                //   TODO: gestion quand plusieurs lieux ?
              } else if (ClasseUtils.heriteDe(commandeCeci.elements[0].classe, classeCibleCeci.nom)) {
                // expliquer souci avec l’état de l’objet
                retVal = this.expliquerRefuEtatElement(commandeCeci.elements[0], tokenCeciOuCela, actionCeci, argumentUnique);
                // lieu TROUVÉ et CLASSE KO
              } else {
                if (argumentUnique) {
                  retVal = "La classe du lieu « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande.";
                } else {
                  retVal = "la classe du lieu « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande";
                }
              }
              // s’il doit s’agir d’un autre type d’ÉLÉMENT
            } else {
              if (ClasseUtils.heriteDe(commandeCeci.elements[0].classe, classeCibleCeci.nom)) {
                // expliquer souci avec l’état de l’objet
                retVal = this.expliquerRefuEtatElement(commandeCeci.elements[0], tokenCeciOuCela, actionCeci, argumentUnique);
                // lieu TROUVÉ et CLASSE KO
              } else {
                if (argumentUnique) {
                  retVal = "La classe de l’élément « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande.";
                } else {
                  retVal = "la classe de l’élément « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande";
                }
              }
            }
          }
        } else {
          // s’il doit s’agir d’un COMPTEUR
          if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.compteur)) {
            // compteur trouvé
            if (commandeCeci.compteurs.length) {
              // TODO: check états
              retVal = "L’état de du compteur {/[Intitulé " + tokenCeciOuCela + "]/} ne convient pas pour la commande.";
              // pas de compteur trouvé
            } else {
              retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] un compteur.";
            }
            // s’il doit s’agir d’un INTITULÉ
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.intitule)) {
            // intitulé trouvé
            if (commandeCeci.intitule) {
              // TODO: check états
              retVal = "L’état de l’intitulé {/[Intitulé " + tokenCeciOuCela + "]/} ne convient pas pour la commande.";
              // pas d’intitulé trouvé
            } else {
              // todo: afficher ceci ?
              retVal = "L’argument n’est pas un intitulé valide.";
            }
          } else {
            retVal = "La classe racine de l’argument « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande.";
          }
        }
        // classe inconnue
      } else {
        retVal = "La classe de l’argument « {/[intitulé " + tokenCeciOuCela + "]/} » ne convient pas pour la commande.";
      }
      // B. sujet précis
    } else {
      if (commandeCeci.nbCor === 0) {
        if (argumentUnique) {
          retVal = "Je n’ai pas trouvé « " + commandeCeci.intitule + " ».";
        } else {
          retVal = "je n’ai pas trouvé « " + commandeCeci.intitule + " ».";
        }
      } else {
        if (argumentUnique) {
          // retVal = "{/[Intitulé " + tokenCeciOuCela + "]/} [v pouvoir ipr pas " + tokenCeciOuCela + "] être utilisé[es " + tokenCeciOuCela + "] pour cette commande.";
          retVal = "Cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}.";
        } else {
          retVal = "cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}";
        }
      }
    }

    return retVal;
  }

  /** Afficher la forme de l’action attendue. */
  private afficherCandidatAction(candidat: Action, ceciConnu: boolean, celaConnu: boolean) {
    let explication: string;
    if (candidat.ceci) {
      // CECI + CELA
      if (candidat.cela) {
        if (ceciConnu) {
          explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.afficherNomPrecisDuComplement(candidat.cibleCeci) + " " + (candidat.prepositionCela ? (candidat.prepositionCela + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCela) + "/}";
        } else if (celaConnu) {
          explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + " " + (candidat.prepositionCela ? (candidat.prepositionCela + " ") : "") + this.afficherNomPrecisDuComplement(candidat.cibleCela) + "/}";
        } else {
          explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + " " + (candidat.prepositionCela ? (candidat.prepositionCela + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCela) + "/}";
        }
        // CECI
      } else {
        if (ceciConnu) {
          explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + candidat.cibleCeci + "/}";
        } else {
          explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + "/}";
        }
      }
      // SEUL
    } else {
      explication = "{/" + candidat.infinitif + "/}"
    }
    return explication;
  }

  private obtenirPhraseRefuEtatElement(etat: string, tokenCeciOuCela: 'ceci' | 'cela', argumentUnique: boolean): string {
    let retVal: string;
    switch (etat) {
      case EEtatsBase.visible:
        if (argumentUnique) {
          retVal = "Je ne [le " + tokenCeciOuCela + "] vois pas.";
        } else {
          retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] visible[s " + tokenCeciOuCela + "]";
        }
        break;

      case EEtatsBase.accessible:
        if (argumentUnique) {
          retVal = "Je n’y ai pas accès.";
        } else {
          retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] accessible[s " + tokenCeciOuCela + "]";
        }
        break;

      case EEtatsBase.disponible:
        if (argumentUnique) {
          retVal = "{/[Il " + tokenCeciOuCela + "] [v être ipr pas " + tokenCeciOuCela + "] disponible[s " + tokenCeciOuCela + "].";
        } else {
          retVal = "{/[intitulé " + tokenCeciOuCela + "]/} [v être ipr pas " + tokenCeciOuCela + "] disponible[s " + tokenCeciOuCela + "]";
        }
        break;

      case EEtatsBase.possede:
        if (argumentUnique) {
          // retVal = "Vous ne [le " + tokenCeciOuCela + "] possédez pas.";
          retVal = "vous ne possédez pas {/[intitulé " + tokenCeciOuCela + "]/.}";
        } else {
          retVal = "vous ne possédez pas {/[intitulé " + tokenCeciOuCela + "]/}";
        }
        break;


      case EEtatsBase.present:
        if (argumentUnique) {
          retVal = "[Intitulé " + tokenCeciOuCela + "] [v être ipr pas " + tokenCeciOuCela + "] ici.";
        } else {
          retVal = "{/[intitulé " + tokenCeciOuCela + "] [v être ipr pas " + tokenCeciOuCela + "] ici/}";
        }
        break;

      default:
        // retVal = "L’élément ne convient pas actuellement : {/[intitulé " + tokenCeciOuCela + "]/}.";
        if (argumentUnique) {
          retVal = "Actuellement, cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}.";
        } else {
          retVal = "actuellement, cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}";
        }
        break;
    }
    return retVal;
  }

  private expliquerRefuEtatElement(elementCommande: ElementJeu, tokenCeciOuCela: 'ceci' | 'cela', cibleAction: CibleAction, argumentUnique: boolean) {

    let retVal: string;

    // l’épithete peut en réalité est composé de plusieurs états
    let etatsNonVerifiesBruts = this.listerEtatsNonVerifies(elementCommande, cibleAction.epithete);

    if (etatsNonVerifiesBruts.length == 1) {
      // retrouvé l’état requis dans la liste des états
      const etatAction = this.jeu.etats.trouverEtat(etatsNonVerifiesBruts[0]);
      // état requis trouvé
      if (etatAction) {
        //si ni visible, ni présent => dire qu’il n’est pas présent.
        if (etatAction.nom == EEtatsBase.visible && !this.jeu.etats.possedeEtatIdElement(elementCommande, this.jeu.etats.presentID)) {
          retVal = this.obtenirPhraseRefuEtatElement(EEtatsBase.present, tokenCeciOuCela, argumentUnique);
          // sinon on dire ce qu’il n’est pas
        } else {
          retVal = this.obtenirPhraseRefuEtatElement(etatAction.nom, tokenCeciOuCela, argumentUnique);
        }
        // état requis pas trouvé
      } else {
        // retVal = "L’élément ne convient pas actuellement : {/[Intitulé " + tokenCeciOuCela + "]/}.";
        if (argumentUnique) {
          retVal = "Actuellement, cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}.";
        } else {
          retVal = "actuellement, cette commande ne fonctionne pas avec {/[intitulé " + tokenCeciOuCela + "]/}";
        }
      }
    } else if (etatsNonVerifiesBruts.length == 2) {

      let etatsNonVerifies: Etat[] = [];
      etatsNonVerifiesBruts.forEach(etatBrut => {
        etatsNonVerifies.push(this.jeu.etats.trouverEtat(etatBrut));
      });

      let estListeEt = cibleAction.epithete.match(/\bet\b/);

      if (etatsNonVerifies.some(x => x.nom == EEtatsBase.visible) && etatsNonVerifies.some(x => x.nom == EEtatsBase.accessible)) {
        if (estListeEt) {
          //si ni visible, ni présent => dire qu’il n’est pas présent.
          if (!this.jeu.etats.possedeEtatIdElement(elementCommande, this.jeu.etats.presentID)) {
            retVal = this.obtenirPhraseRefuEtatElement(EEtatsBase.present, tokenCeciOuCela, argumentUnique);
          } else {
            retVal = this.obtenirPhraseRefuEtatElement(EEtatsBase.visible, tokenCeciOuCela, argumentUnique);
          }
        } else {
          retVal = this.obtenirPhraseRefuEtatElement('xxx', tokenCeciOuCela, argumentUnique);
        }
      } else {
        retVal = this.obtenirPhraseRefuEtatElement('xxx', tokenCeciOuCela, argumentUnique);
      }

    } else {

    }

    return retVal;
  }

  private expliquerRefuTropOuTropPeuArguments(candidat: Action, commande: ElementsPhrase) {
    let explication: string;
    //     I.A.a) la seule action possible n’a pas d’argument
    if (!candidat.ceci) {
      explication = "{/" + candidat.infinitif + "/} (sans complément).";
      // I.A.b) la seule action possible fait 1 seul argument (ceci)
    } else if (!candidat.cela) {
      // I.A.b.1) l’utilisateur n’a pas spécifié l’argument
      if (!commande.sujet) {
        explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + "/} mais il manque le complément.";
        // I.A.b.2) l’utilisateur a spécifié un complément de trop.
      } else {
        explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + "/} mais il y a un complément de trop.";
      }
      // I.A.c) la seule action possible fait 2 arguments (ceci et cela).
    } else {
      //     I.A.c.1) l’utilisateur n’a pas spécifié les arguments
      if (!commande.sujet) {
        explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + " " + (candidat.prepositionCela ? (candidat.prepositionCela + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCela) + "/} mais il manque les compléments.";
        // I.A.c.2) l’utilisateur n’a spécifié qu’un seul argument (ceci)
      } else {
        explication = "{/" + candidat.infinitif + " " + (candidat.prepositionCeci ? (candidat.prepositionCeci + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCeci) + " " + (candidat.prepositionCela ? (candidat.prepositionCela + " ") : "") + this.masquerNomPrecisDuComplement(candidat.cibleCela) + "/} mais il manque un complément.";
      }
    }
    return explication;
  }

  /** Permet de ne pas divulgacher l’intrigue au joueur. */
  private masquerNomPrecisDuComplement(actionCeci: CibleAction) {
    let retVal: string;
    //     A. classe
    if (this.estCibleUneClasse(actionCeci)) {
      let classeCibleCeci = ClasseUtils.trouverClasse(this.jeu.classes, actionCeci.nom);
      // classe trouvée
      if (classeCibleCeci) {
        // ÉLÉMENT
        if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.element)) {
          if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.personne)) {
            // persone
            retVal = "quelqu’un";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.vivant)) {
            // vivant
            retVal = "un être vivant";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.objet)) {
            // objet
            retVal = "quelque chose";
          } else {
            // élément
            retVal = "quelque chose";
          }
        } else {
          if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.compteur)) {
            retVal = "un compteur";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.intitule)) {
            retVal = "un sujet";
          } else {
            retVal = "une classe racine inconnue"; // ???
          }
        }
        // classe inconnue
      } else {
        retVal = "une classe inconnue"; // ???
      }
      // B. sujet précis
    } else {
      retVal = "un élément précis";
    }
    return retVal;
  }


  /** Permet de ne pas divulgacher l’intrigue au joueur. */
  private afficherNomPrecisDuComplement(actionCeci: CibleAction) {
    let retVal: string;
    //     A. classe
    if (this.estCibleUneClasse(actionCeci)) {
      let classeCibleCeci = ClasseUtils.trouverClasse(this.jeu.classes, actionCeci.nom);
      // classe trouvée
      if (classeCibleCeci) {
        // ÉLÉMENT
        if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.element)) {
          if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.personne)) {
            // persone
            retVal = "quelqu’un";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.vivant)) {
            // vivant
            retVal = "un être vivant";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.objet)) {
            // objet
            retVal = "quelque chose";
          } else {
            // élément
            retVal = "quelque chose";
          }
        } else {
          if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.compteur)) {
            retVal = "un compteur";
          } else if (ClasseUtils.heriteDe(classeCibleCeci, EClasseRacine.intitule)) {
            retVal = "un sujet";
          } else {
            retVal = "une classe racine inconnue"; // ???
          }
        }
        // classe inconnue
      } else {
        retVal = "une classe inconnue"; // ???
      }
      // B. sujet précis
    } else {
      retVal = actionCeci.determinant + actionCeci.nomEpithete;
    }
    return retVal;
  }

  /**
   * Vérifier dans les actions si l’infitif spécifié, avec le nombre d’arguments spécifiés, existe.
   * Retourne un score qui sera plus élevé si les prépositions sont celles prévues pour cette commande.
   */
  public scoreInfinitifExisteAvecCeciCela(infinitif: string, isCeci: boolean, isCela: boolean, prepositionCeci: string | undefined, prepositionCela: string | undefined): number {
    // chercher les candidats en tenant compte des accents
    var candidats = this.chercherCandidatsActionSansControle(infinitif, isCeci, isCela, true);

    // si verbe pas trouvé, chercher candidat en ne tenant pas compte des accents
    if (!candidats.verbeConnu) {
      candidats = this.chercherCandidatsActionSansControle(infinitif, isCeci, isCela, false);
    }

    var score = 0;

    if (candidats.candidatsEnLice.length != 0) {
      // si action avec cet infinitif et ce nombre d'arguments existe, augmenter le score.
      score += 100;
      // si les prépositions correspondent à celles prévues pour la commande, on augment le score.
      if (candidats.candidatsEnLice.some(x =>
        (x.prepositionCeci == prepositionCeci && x.prepositionCela == prepositionCela)
      )) {
        score += 10;
      }

    }
    return score;
  }

  /**
   * On cherche une action qui correspond sur l’infinitif et le nombre d’arguments mais sans vérifier la nature des arguments.
   */
  public chercherCandidatsActionSansControle(infinitif: string, isCeci: boolean, isCela: boolean, tenirCompteDesAccents: boolean) {
    let candidatsEnLice: Action[] = [];
    let candidatsRefuses: Action[] = [];
    let verbeConnu: boolean = false;
    const infinitifNormalise = StringUtils.normaliserMot(infinitif);

    // trouver les commande qui corresponde (sans vérifier le sujet (+complément) exacte)
    this.jeu.actions.forEach(action => {
      let infinitifOk = false;
      // vérifier infinitif => avec accents
      if (tenirCompteDesAccents) {
        infinitifOk = (infinitif === action.infinitif);
        // vérifier également les synonymes
        if (!infinitifOk && action.synonymes) {
          action.synonymes.forEach(synonyme => {
            if (!infinitifOk && infinitif === synonyme) {
              infinitifOk = true;
            }
          });
        }
        // vérifier infinitif => sans accents
      } else {
        infinitifOk = (infinitifNormalise === action.infinitifSansAccent);
        // vérifier également les synonymes
        if (!infinitifOk && action.synonymesSansAccent) {
          action.synonymesSansAccent.forEach(synonymeSansAccent => {
            if (!infinitifOk && infinitifNormalise === synonymeSansAccent) {
              infinitifOk = true;
            }
          });
        }
      }

      if (infinitifOk) {
        verbeConnu = true;
        let candidatValide = false;
        // vérifier sujet
        if ((isCeci && action.ceci) || (!isCeci && !action.ceci)) {
          // vérifier complément
          if ((isCela && action.cela) || (!isCela && !action.cela)) {
            candidatValide = true;
          }
        }
        if (candidatValide) {
          candidatsEnLice.push(action);
        } else {
          candidatsRefuses.push(action);
        }
      }
    });
    // if (this.verbeux) {
    //   console.warn("testerCommandePersonnalisee :", candidatsEnLice.length, "candidat(s) p1 :", candidatsEnLice);
    // }
    return new ResultatChercherCandidats(verbeConnu, candidatsEnLice, candidatsRefuses);
  }

  /**
   * Chercher les actions correspondants à la commande sur base de l’infinitif et du nombre d’arguments 
   * sans tenir compte de la nature des arguments.
   */
  private chercherCandidatsCommandeSansControle(commande: ElementsPhrase): ResultatChercherCandidats {
    const infinitif = commande.infinitif;
    const isCeci = commande.sujet ? true : false;
    const isCela = commande.sujetComplement1 ? true : false;
    // chercher candidats en tenant compte des accents
    let candidats = this.chercherCandidatsActionSansControle(infinitif, isCeci, isCela, true);
    // si infinitif pas trouvé, essayer sans tenir compte des accents
    if (!candidats.verbeConnu) {
      candidats = this.chercherCandidatsActionSansControle(infinitif, isCeci, isCela, false);
    }
    return candidats;
  }

  /** Trouver l’action personnalisée correspondant le mieux la la commande de l’utilisateur */
  public trouverActionPersonnalisee(commande: ElementsPhrase, ceciCommande: Correspondance, celaCommande: Correspondance): CandidatActionCeciCela[] {

    let matchCeci: ResultatVerifierCandidat = null;
    let matchCela: ResultatVerifierCandidat = null;
    let resultat: CandidatActionCeciCela[] = null;

    let resCherCand = this.chercherCandidatsCommandeSansControle(commande);

    if (resCherCand.verbeConnu) {
      resultat = []; // verbe connu

      // infinitif + sujet (+complément), vérifier que celui de la commande correspond
      if (commande.sujet) {

        let meilleurScore = 0;

        resCherCand.candidatsEnLice.forEach(candidatAction => {
          let candidatCorrespond = false;
          matchCeci = null;
          matchCela = null;

          // 1) vérifier sujet (CECI)
          if (candidatAction.cibleCeci) {
            matchCeci = this.verifierCandidatCeciCela(ceciCommande, candidatAction.cibleCeci);
            // A. aucun candidat valide trouvé
            if (matchCeci.elementsTrouves.length === 0) {
              // console.log(">>> Pas de candidat valide trouvé pour ceci avec le candidat:", candidat, "ceci:", ceci);
              // B. au moins un candidat se démarque
            } else {
              // 2) vérifier complément (CELA)
              if (commande.sujetComplement1 || commande.complement1) {
                if (candidatAction.cibleCela) {

                  matchCela = this.verifierCandidatCeciCela(celaCommande, candidatAction.cibleCela);

                  // A. aucun candidat valide trouvé
                  if (matchCela.elementsTrouves.length === 0) {
                    // console.log(">>> Pas de candidat valide trouvé pour cela avec le candidat:", candidat, "cela:", cela);
                    // B. au moins un candidat se démarque
                  } else {
                    candidatCorrespond = true;
                  }
                }
                // pas de cela
              } else {
                candidatCorrespond = true;
              }
            }
          }

          /*
   
                 // B. plusieurs candidats se démarquent
            } else if (matchCeci.elementsTrouves.length !== 1) {
              console.warn(">>> Plusieurs candidats se démarquent pour ceci avec le candidat:", candidat, "ceci:", ceci);
   
   
                 // B. plusieurs candidats se démarquent
                  } else if (matchCela.elementsTrouves.length !== 1) {
                    console.warn(">>> Plusieurs candidats se démarquent pour cela avec le candidat:", candidat, "cela:", cela);
   
          */

          if (candidatCorrespond) {

            const score = matchCeci.meilleurScore + (matchCela?.meilleurScore ?? 0);

            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (score > meilleurScore) {
              meilleurScore = score;
              resultat = [new CandidatActionCeciCela(candidatAction, matchCeci?.elementsTrouves, matchCela?.elementsTrouves)];
              // plusieurs scores équivalents => on ajoute au résultat existant
            } else if (score === meilleurScore) {
              resultat.push(new CandidatActionCeciCela(candidatAction, matchCeci?.elementsTrouves, matchCela?.elementsTrouves));
            }
          }
        });

        // infinitif simple
      } else {
        // à priori on ne devrait avoir qu’un seul résultat vu que verbe simple…
        resCherCand.candidatsEnLice.forEach(candidatAction => {
          resultat.push(new CandidatActionCeciCela(candidatAction, null, null));
        });
      }
    }
    return resultat;
  }

  /** Est-ce que la cible (ceci ou cela) de l’action est une classe ? */
  private estCibleUneClasse(cibleCeci: CibleAction) {
    return cibleCeci.determinant?.match(/^(un|une|des|deux|1|2)( )?$/) ?? false;
  }

  /**
   * Vérifier si on trouve l’élément rechercher parmis les correspondances.
   * @param ceciCelaCommande  correspondances
   * @param candidatCeciCelaAction  élément recherché
   * @returns élément éventuellement trouvé ou -1 si plusieurs éléments possibles.
   */
  private verifierCandidatCeciCela(ceciCelaCommande: Correspondance, candidatCeciCelaAction: CibleAction): ResultatVerifierCandidat {
    let retVal: Array<ElementJeu | Intitule> = [];

    // on donne un score aux correspondances : cela permet de départager plusieurs corresspondances.
    let meilleurScore = 0;

    //   A. s’il s’agit d’une classe
    if (this.estCibleUneClasse(candidatCeciCelaAction)) {
      ceciCelaCommande.elements.forEach(ele => {
        // vérifier si l’ojet est du bon type
        if (ClasseUtils.heriteDe(ele.classe, ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom))) {

          // s’il n’y a pas d’état requis ou si l’état est respecté
          // if (!candidatCeciCelaAction.epithete || this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.epithete, this.eju)) {
          if (this.controllerEtatsElement(ele, candidatCeciCelaAction.epithete)) {
            let curScore = 125;
            // si priorité respectée, score augmente
            if (candidatCeciCelaAction.priorite) {
              // if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.priorite, this.eju)) {
              if (this.controllerEtatsElement(ele, candidatCeciCelaAction.priorite)) {
                curScore += 75; // prioritaire
              }
            }
            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [ele];
              // plusieurs scores équivalents => on ajoute au résultat existant
            } else if (curScore === meilleurScore) {
              retVal.push(ele);
            }
          }
        }
      });

      // si ce n'est pas un élément du jeu,
      //  - vérifier direction
      if (meilleurScore === 0 && ceciCelaCommande.localisation && (ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.direction || ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.intitule)) {
        meilleurScore = 75;
        retVal = [ceciCelaCommande.localisation];
      }
      //  - vérifier intitué
      if (meilleurScore === 0 && ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.intitule) {
        meilleurScore = 50;
        retVal = [ceciCelaCommande.intitule];
      }
      // B. il s’agit d’un sujet précis
    } else {

      // Vérifier s’il s’agit du sujet précis
      // PRIORITÉ 1 >> élément (objet ou lieu)
      if (ceciCelaCommande.elements.length) {
        // console.log("verifierCandidatCeciCela > sujet précis > élements (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
        // vérifier s’il s’agit du sujet précis
        ceciCelaCommande.elements.forEach(ele => {
          // console.log("check for ele=", ele, "candidatCeciCela=", candidatCeciCela);
          // console.log("check for ele.intitule.nom=", ele.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
          // console.log("check for ele.intitule.epithete=", ele.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);
          if (ele.intitule.nom === candidatCeciCelaAction.nom && ele.intitule.epithete === candidatCeciCelaAction.epithete) {
            let curScore = 1000;
            // si priorité respectée, score augmente
            if (candidatCeciCelaAction.priorite) {
              // if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.priorite, this.eju)) {
              if (this.controllerEtatsElement(ele, candidatCeciCelaAction.priorite)) {
                curScore += 500; // prioritaire
              }
            }
            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [ele];
              // 2 scores équivalents => on ajoute au résultat existant
            } else if (curScore === meilleurScore) {
              retVal.push(ele);
            }
          }
        });
        // PRIORITÉ 2 >> compteur
      } else if (ceciCelaCommande.compteurs.length) {
        // console.log("verifierCandidatCeciCela > sujet précis > compteurs (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
        // vérifier s’il s’agit du sujet précis
        ceciCelaCommande.compteurs.forEach(cpt => {
          // console.log("check for cpt=", cpt, "candidatCeciCela=", candidatCeciCela);
          // console.log("check for cpt.intitule.nom=", cpt.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
          // console.log("check for cpt.intitule.epithete=", cpt.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

          if (cpt.intitule.nom === candidatCeciCelaAction.nom && cpt.intitule.epithete === candidatCeciCelaAction.epithete) {
            let curScore = 500;
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [cpt];
            } else {
              // déjà un match, on en a plusieurs
              // (ici ils ont toujours la même valeur)
              retVal.push(cpt);
            }
          }
        });
        // PRIORITÉ 3 >> intitulé
      } else if (ceciCelaCommande.intitule) {
        // console.log("verifierCandidatCeciCela > sujet précis > intitulé (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");

        const intitule = ceciCelaCommande.intitule;

        // vérifier s’il s’agit du sujet précis
        // console.log("check for intitule=", intitule, "candidatCeciCela=", candidatCeciCela);
        // console.log("check for intitule.intitule.nom=", intitule.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
        // console.log("check for intitule.intitule.epithete=", intitule.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

        if (intitule.intitule.nom === candidatCeciCelaAction.nom && intitule.intitule.epithete === candidatCeciCelaAction.epithete) {
          let curScore = 250;
          if (curScore > meilleurScore) {
            meilleurScore = curScore;
            retVal = [intitule];
          } else {
            // déjà un match, on en a plusieurs
            // (ici ils ont toujours la même valeur)
            retVal.push(intitule);
          }
        }
      }

      // todo: vérifier début de nom si aucune correspondance exacte

      // il s’agit d’un type
    }
    if (this.verbeux) {
      console.log("VerifierCandidat >>> \nbestScore=", meilleurScore, "\ncandidatCeciCela=", candidatCeciCelaAction, "\nceciCela=", ceciCelaCommande);
    }
    return new ResultatVerifierCandidat(retVal, meilleurScore);
  }

  /**
   * Contrôler si l’élément possède les états spécifiés ou non.
   * Si la liste d’états est vide, le résultat sera vrai.
   * Si la liste d’états contient plusieurs éléments, il doivent êtres séparés par des virgules et enfin de liste un « et » ou un « ou ».
   */
  private controllerEtatsElement(element: ElementJeu, listeEtats: string) {
    let etats: string[];
    // s’il y a des états à vérifire
    if (listeEtats) {
      let estListeEt = /\bet\b/.test(listeEtats);
      etats = PhraseUtils.separerListeIntitulesEtOu(listeEtats, true);

      // console.log(">>>> etats:", etats);

      let unEtatPasVerifie = false;
      let unEtatVerifie = false;
      etats.forEach(etat => {
        if (this.jeu.etats.possedeEtatElement(element, etat, this.eju)) {
          unEtatVerifie = true;
        } else {
          unEtatPasVerifie = true;
        }
      });

      // console.log(">>>>> estListeEt:", estListeEt);
      // console.log(">>>>>> unEtatPasVerifie:", unEtatPasVerifie);
      // console.log(">>>>>> unEtatVerifie:", unEtatVerifie);


      // et => il faut tout vérifier
      if (estListeEt) {
        return !unEtatPasVerifie;
        // ou => il faut vérifier 1 seul état
      } else {
        return unEtatVerifie;
      }

      // rien à vérifier
    } else {
      return true;
    }
  }

  /** 
   * Retourner la liste des états qui ne sont pas vérifiés pour l’élément spécifié. 
   * 
   * Remarque:
   *   - dans le cas d’un « ou », si au moins un des états est vérifié, la liste retournée sera vide.
   *   - dans le cas d’un « et », seuls les états non vérifiés seront retournés.
   */
  private listerEtatsNonVerifies(element: ElementJeu, listeEtats: string): string[] {
    let tousLesEtats: string[];
    let etatsNonVerifies: string[] = [];
    // s’il y a des états à vérifire
    if (listeEtats) {
      let estListeEt = listeEtats.match(/\bet\b/);
      tousLesEtats = PhraseUtils.separerListeIntitulesEtOu(listeEtats, true);
      let unEtatPasVerifie = false;
      let unEtatVerifie = false;
      tousLesEtats.forEach(etat => {
        if (this.jeu.etats.possedeEtatElement(element, etat, this.eju)) {
          unEtatVerifie = true;
        } else {
          unEtatPasVerifie = true;
          etatsNonVerifies.push(etat);
        }
      });
      // et => il faut tout vérifier
      if (estListeEt) {
        if (unEtatPasVerifie) {
          return etatsNonVerifies;
        } else {
          return [];
        }
        // ou => il faut vérifier 1 seul état
      } else {
        if (unEtatVerifie) {
          return [];
        } else {
          return etatsNonVerifies;
        }
      }
      // rien à vérifier
    } else {
      return [];
    }
  }

}