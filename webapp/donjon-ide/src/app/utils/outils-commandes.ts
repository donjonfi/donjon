import { ConditionDebutee, StatutCondition, xFois } from '../models/jouer/statut-conditions';

import { ConditionsUtils } from './conditions-utils';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Resultat } from '../models/jouer/resultat';
import { StringUtils } from './string.utils';
import { TypeElement } from '../models/commun/type-element.enum';

export class OutilsCommandes {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) {

    this.cond = new ConditionsUtils(jeu, verbeux);
    this.eju = new ElementsJeuUtils(jeu, verbeux);

  }
  /** Utilitairs - Conditions */
  private cond: ConditionsUtils;
  /** Utilitaires - Éléments du jeu */
  private eju: ElementsJeuUtils;



  /**
   * Obtenir l'accord ('', 'e' ou 'es') en fonction de l'objet.
   * @param ej élément à tester
   * @param estFeminin forcer féminin
   * @param estSingulier forcer singulier
   */
  static afficherAccordSimple(ej: ElementJeu, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (ej.nombre == Nombre.s || estSingulier) {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = "e";
      } else {
        retVal = "";
      }
    } else {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = "es";
      } else {
        retVal = "s";
      }
    }
    return retVal;
  }

  static afficherUnUneDesQuantite(ej: ElementJeu, majuscule: boolean, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (ej.quantite == 1 || estSingulier) {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = majuscule ? "Une " : "une ";
      } else {
        retVal = majuscule ? "Un " : "un ";
      }
    } else if (ej.quantite >= 10 || ej.quantite == -1) {
      retVal = majuscule ? "Des " : "des ";
    } else {
      retVal = (ej.quantite + " ");
    }
    return retVal;
  }

  static afficherQuantiteIntitule(ej: ElementJeu, majuscule: boolean, estFeminin: boolean) {

    let determinant = OutilsCommandes.afficherUnUneDesQuantite(ej, majuscule, estFeminin, null);
    let intitule = ej.intitule;

    if (ej.intituleS && ej.quantite == 1) {
      intitule = ej.intituleS;
    } else if (ej.intituleP) {
      intitule = ej.intituleP;
    }

    return determinant + intitule;
  }



  static objetPossedeCapaciteAction(ej: ElementJeu, actionA: string, actionB: string = null): boolean {
    if (ej) {
      var retVal = false;
      ej.capacites.forEach(cap => {
        const curAction = cap.verbe.toLocaleLowerCase().trim();
        if ((curAction === actionA.toLocaleLowerCase().trim()) || (actionB && curAction === actionB.toLocaleLowerCase().trim())) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("portePossedeCapaciteAction >> ElementJeu pas défini.");
    }
  }



  positionnerJoueur(position: string): Resultat {

    let resultat = new Resultat(true, '', 1);

    position = position.trim().replace(/^au |dans (le |la |l'|l’)|à l’intérieur (du|de l’|de l'|de la |des )|sur (le |la |l’|l'|les)/i, '');
    // chercher la salle
    let sallesTrouvees = this.jeu.salles.filter(x => StringUtils.normaliserMot(x.nom).startsWith(position));
    // si on n’a pas trouvé
    if (sallesTrouvees.length == 0) {
      console.error("positionnerJoueur : pas pu trouver la salle correspondant à la position", position);
      resultat.succes = false;
      // si on a trouvé une salle
    } else if (sallesTrouvees.length == 1) {
      this.jeu.position = sallesTrouvees[0].id;
      // si on a trouvé plusieurs salles différentes
    } else if (sallesTrouvees.length > 1) {
      // TODO: ajouter des mots en plus
      console.error("positionnerJoueur : plusieurs salles trouvées pour la position", position);
      resultat.succes = false;
    }

    return resultat;
  }

  afficherStatutPorte(porte: ElementJeu) {
    let retVal = "";
    if (!porte) {
      console.error("afficherStatutPorte >> porte pas définie");
    } else if (porte.type !== TypeElement.porte) {
      console.error("afficherStatutPorte >> l’élément de jeu n’est pas de type Porte");
    } else {
      let ouvrable = ElementsJeuUtils.possedeCetEtat(porte, 'ouvrable');
      let ouvert = ElementsJeuUtils.possedeCetEtatAutoF(porte, 'ouvert');
      let verrou = ElementsJeuUtils.possedeCetEtatAutoF(porte, 'verrouillé');

      if (porte.genre == Genre.f) {
        if (ouvert) {
          retVal += "Elle est ouverte.";
        } else {
          retVal += "Elle est fermée " + (verrou ? "et verrouillée." : "mais pas verrouillée.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'la fermer.' : 'l’ouvrir.');
        }
      } else {
        if (ouvert) {
          retVal += "Il est ouvert.";
        } else {
          retVal += "Il est fermé " + (verrou ? "et verrouillé." : "mais pas verrouillé.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'le fermer.' : 'l’ouvrir.');
        }
      }

    }
    return retVal;
  }



  afficherCurSalle() {
    if (this.eju.curSalle) {
      return "—————————————————\n" +
        this.eju.curSalle.intitule
        + "\n—————————————————\n"
        + (this.eju.curSalle.description ? (this.calculerDescription(this.eju.curSalle.description, ++this.eju.curSalle.nbAffichageDescription) + "\n") : "")
        + this.afficherSorties();
    } else {
      console.warn("Pas trouvé de curSalle :(");
      return "Je suis où moi ? :(";
    }

  }

  afficherSorties() {
    let retVal: string;

    if (this.eju.curSalle.voisins.length > 0) {
      retVal = "Sorties :";
      this.eju.curSalle.voisins.forEach(voisin => {
        if (voisin.type == TypeElement.salle) {
          retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, this.eju.curSalle.id, voisin.id));
        }
      });
    } else {
      retVal = "Il n’y a pas de sortie.";
    }
    return retVal;
  }

  afficherInventaire() {
    let retVal: string;
    let objets = this.jeu.inventaire.objets.filter(x => x.quantite !== 0);
    if (objets.length == 0) {
      retVal = "\nVotre inventaire est vide.";
    } else {
      retVal = "\nContenu de l'inventaire :";
      objets.forEach(o => {
        if (o.quantite > 0) {
          retVal += "\n - " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
        }
      });
    }
    return retVal;
  }

  afficherContenu(el: ElementJeu, phraseSiVide = "Il n’y a rien d’intéressant.") {
    let retVal: string;
    let objets = el.inventaire.objets.filter(x => x.quantite !== 0);
    if (objets.length == 0) {
      retVal = phraseSiVide;
    } else {
      retVal = "Vous trouvez :";
      objets.forEach(o => {
        if (o.quantite > 0) {
          retVal += "\n - " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
        }
      });
    }
    return retVal;
  }

  afficherObjetsCurSalle() {
    let retVal: string;

    let objets = this.eju.curSalle.inventaire.objets.filter(x => x.quantite !== 0);

    if (objets.length == 0) {
      retVal = "\nJe ne vois pas d’objet ici.";
    } else {
      retVal = "\nCe que vous voyez ici :";
      objets.forEach(o => {
        retVal += "\n - Il y a " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
      });
    }
    return retVal;
  }

  afficherLocalisation(localisation: Localisation, curSalleIndex: number, voisinIndex: number) {
    let retVal: string = null;
    let salle = this.eju.getSalle(voisinIndex);
    let salleIntitulle = salle.intitule;
    switch (localisation) {
      case Localisation.nord:
        retVal = "nord (n)" + (salle.visite ? (" − " + salleIntitulle) : '');
        break;
      case Localisation.sud:
        retVal = "sud (s) " + (salle.visite ? (" − " + salleIntitulle) : '');
        break;
      case Localisation.est:
        retVal = "est (e)" + (salle.visite ? (" − " + salleIntitulle) : '');
        break;
      case Localisation.ouest:
        retVal = "ouest (o)" + (salle.visite ? (" − " + salleIntitulle) : '');
        break;
      case Localisation.bas:
        retVal = "descendre (de) − " + salleIntitulle;
        break;
      case Localisation.haut:
        retVal = "monter (mo) − " + salleIntitulle;
        break;
      case Localisation.exterieur:
        retVal = "sortir (so) − " + salleIntitulle;
        break;
      case Localisation.interieur:
        retVal = "entrer (en) − " + salleIntitulle;
        break;

      default:
        retVal = localisation.toString();
    }
    return retVal;
  }

  calculerDescription(description: string, nbAffichage: number) {

    const morceaux = description.split(/\[|\]/);
    let statut = new StatutCondition(nbAffichage, morceaux, 0);
    let suivantEstCondition = description.trim().startsWith("[");
    let afficherMorceauSuivant = true;
    let retVal = "";

    for (let index = 0; index < morceaux.length; index++) {
      statut.curMorceauIndex = index;
      const curMorceau = morceaux[index];
      if (suivantEstCondition) {
        afficherMorceauSuivant = this.estConditionRemplie(curMorceau, statut);
        suivantEstCondition = false;
      } else {
        if (afficherMorceauSuivant) {
          retVal += curMorceau;
        }
        suivantEstCondition = true;
      }
    }

    return retVal;
  }


  estConditionRemplie(condition: string, statut: StatutCondition): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = this.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      // Au hasard
      // TODO: au hasard
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = this.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = Math.random();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = this.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      // TODO: vérifier le si
      statut.siVrai = this.cond.siEstVrai(conditionLC, null);
      retVal = statut.siVrai;
    } else if (statut.conditionDebutee != ConditionDebutee.aucune) {
      retVal = false;
      switch (conditionLC) {

        case 'ou':
          if (statut.conditionDebutee == ConditionDebutee.hasard) {
            retVal = (statut.choixAuHasard === ++statut.dernIndexChoix);
          } else {
            console.warn("[ou] sans 'au hasard'.");
          }
          break;

        case 'puis':
          if (statut.conditionDebutee === ConditionDebutee.fois) {
            // toutes les fois suivant le dernier Xe fois
            retVal = (statut.nbAffichage > statut.plusGrandChoix);
          } else if (statut.conditionDebutee === ConditionDebutee.boucle) {
            // boucler
            statut.dernIndexChoix += 1;
            retVal = (statut.nbAffichage % statut.nbChoix === (statut.dernIndexChoix == statut.nbChoix ? 0 : statut.dernIndexChoix));
          } else {
            console.warn("[puis] sans 'fois' ou 'boucle'.");
          }
          break;

        case 'sinon':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = !statut.siVrai;
          } else {
            console.warn("[sinon] sans 'si'.");
            retVal = false;
          }
          break;

        case 'fin choix':
          if (statut.conditionDebutee == ConditionDebutee.boucle || statut.conditionDebutee == ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard) {
            retVal = true;
          } else {
            console.warn("[fin choix] sans 'fois', 'boucle' ou 'hasard'.");
          }
          break;

        case 'fin si':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = true;
          } else {
            console.warn("[fin si] sans 'si'.");
          }
          break;

        default:
          console.warn("je ne sais pas quoi faire pour:", conditionLC);
          break;
      }
    }

    console.log("estConditionRemplie", condition, statut, retVal);

    return retVal;
  }



  private calculerNbChoix(statut: StatutCondition) {
    let nbChoix = 0;
    let index = statut.curMorceauIndex;
    do {
      index += 2;
      nbChoix += 1;
    } while (statut.morceaux[index] !== 'fin choix' && (index < (statut.morceaux.length - 3)));

    // si on est dans une balise fois et si il y a un "puis"
    // => récupérer le dernier élément fois pour avoir le plus élevé
    if (statut.conditionDebutee == ConditionDebutee.fois) {

      if (statut.morceaux[index - 2] == "puis") {
        const result = statut.morceaux[index - 4].match(xFois);
        if (result) {
          statut.plusGrandChoix = Number.parseInt(result[1], 10);
        } else {
          console.warn("'puis' ne suit pas un 'Xe fois'");
        }
      }
    }

    return nbChoix;
  }
}
