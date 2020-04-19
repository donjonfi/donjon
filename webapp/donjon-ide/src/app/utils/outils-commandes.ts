import { ConditionDebutee, StatutCondition, xFois } from '../models/jouer/statut-conditions';

import { ElementJeu } from '../models/jeu/element-jeu';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { TypeElement } from '../models/commun/type-element.enum';

export class OutilsCommandes {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) { }

  static copierEleJeu(original: ElementJeu) {
    // Rem: La quantité est toujours à 1, et le nombre est donc toujours singulier.
    // Rem: L’id reste le même que celui de l’original.
    // TODO: attribuer un nouvel id aux clones ?
    let retVal = new ElementJeu(original.id, original.type, original.determinant, original.nom, original.genre, Nombre.s, 1);
    retVal.description = original.description;
    retVal.intitule = original.intitule;
    retVal.intituleF = original.intituleF;
    retVal.intituleM = original.intituleM;
    retVal.intituleS = original.intituleS;
    retVal.intituleP = original.intituleP;

    // TODO: faut-il copier le nombre d’affichage de la description ?
    retVal.nbAffichageDescription = original.nbAffichageDescription;

    // TODO: copier les états
    // TODO: copier les capacités
    // TODO: copier les propriétés
    // TODO: faut-il copier l’inventaire ?
    return retVal;
  }

  /**
   * Obtenir l'accord ('', 'e' ou 'es') en fonction de l'objet.
   * @param ej 
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

  static normaliserMot(mot: string) {
    let retVal = "";
    if (mot) {
      retVal = mot
        .toLocaleLowerCase()
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/éèêë/g, 'e')
        .replace(/ï/g, 'i')
        .replace(/àä/g, 'a')
        .replace(/ç/g, 'c');
    }
    return retVal;
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

  static possedeCapaciteActionCible(ej: ElementJeu, actionA: string, actionB: string = null, cible: string): boolean {
    if (ej) {
      var retVal = false;
      ej.capacites.forEach(cap => {
        const curAction = cap.verbe.toLocaleLowerCase().trim();
        // TODO: check si null ?
        const curCible = cap.complement.toLocaleLowerCase().trim();
        if ((curAction === actionA.toLocaleLowerCase().trim()) || (actionB && curAction === actionB.toLocaleLowerCase().trim())) {
          if (cible.toLocaleLowerCase().trim() == curCible) {
            retVal = true;
          }
        }
      });
      return retVal;
    } else {
      console.error("portePossedeCapaciteAction >> ElementJeu pas défini.");
    }
  }


  static possedeUnDeCesEtats(ej: ElementJeu, etatA: string, etatB: string = null): boolean {
    if (ej) {
      var retVal = false;
      ej.etats.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        if (curEt === etatA.toLocaleLowerCase().trim()) {
          retVal = true;
        } else if (etatB && curEt === etatB.toLocaleLowerCase().trim()) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("possedeUnDeCesEtats >> ElementJeu pas défini.");
    }
  }

  positionnerJoueur(position: string) {
    position = position.replace(/^au |dans (le |la |l'|l’)|à l’intérieur (du|de l’|de l'|de la |des )|sur (le |la |l’|l'|les)/i, '');
    // chercher la salle
    let sallesTrouvees = this.jeu.salles.filter(x => OutilsCommandes.normaliserMot(x.nom).startsWith(position));
    // si on n’a pas trouvé
    if (sallesTrouvees.length == 0) {
      console.warn("positionnerJoueur : pas pu trouver la salle correspondant à la position", position);
      // si on a trouvé une salle
    } else if (sallesTrouvees.length == 1) {
      this.jeu.position = sallesTrouvees[0].id;
      // si on a trouvé plusieurs salles différentes
    } else if (sallesTrouvees.length > 1) {
      // TODO: ajouter des mots en plus
    }
  }

  afficherStatutPorte(porte: ElementJeu) {
    let retVal = "";
    if (!porte) {
      console.error("afficherStatutPorte >> porte pas définie");
    } else if (porte.type !== TypeElement.porte) {
      console.error("afficherStatutPorte >> l’élément de jeu n’est pas de type Porte");
    } else {
      let ouvrable = OutilsCommandes.possedeUnDeCesEtats(porte, 'ouvrable');
      let ouvert = OutilsCommandes.possedeUnDeCesEtats(porte, 'ouvert', 'ouverte');
      let verrou = OutilsCommandes.possedeUnDeCesEtats(porte, 'verrouillé', 'verrouillée');

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

  trouverElementJeu(mots: string[], emplacement: EmplacementElement, inclurePortes: boolean) {

    let listeEleJeu: ElementJeu[] = new Array<ElementJeu>();

    switch (emplacement) {

      // chercher dans la salle actuelle
      case EmplacementElement.ici:
        // inventaire de la salle actuelle
        listeEleJeu = listeEleJeu.concat(this.curSalle.inventaire.objets);
        // ajouter les portes adjacentes
        if (inclurePortes) {
          const portesVisiblesID = this.curSalle.voisins.filter(x => x.type === TypeElement.porte).map(x => x.id);
          portesVisiblesID.forEach(porteID => {
            listeEleJeu.push(this.getPorte(porteID));
          });
        }
        break;

      // chercher dans l’inventaire du joueur
      case EmplacementElement.inventaire:
        listeEleJeu = this.jeu.inventaire.objets;
        break;

      // chercher dans la salle actuelle et dans l’inventaire du joueur
      case EmplacementElement.iciEtInventaire:
        listeEleJeu = listeEleJeu.concat(this.curSalle.inventaire.objets);
        // ajouter les portes adjacentes
        if (inclurePortes) {
          const portesVisiblesID = this.curSalle.voisins.filter(x => x.type === TypeElement.porte).map(x => x.id);
          portesVisiblesID.forEach(porteID => {
            listeEleJeu.push(this.getPorte(porteID));
          });
        }
        // ajouter l'inventaire du joueur
        listeEleJeu = listeEleJeu.concat(this.jeu.inventaire.objets);
        break;

      // chercher dans l’ensemble des éléments du jeu
      case EmplacementElement.partout:
        // inclure les portes
        if (inclurePortes) {
          listeEleJeu = this.jeu.elements;
          // ne pas inclure les portes
        } else {
          listeEleJeu = this.jeu.elements.filter(x => x.type !== TypeElement.porte)
        }
        break;

      case EmplacementElement.portes:
        listeEleJeu = new Array<ElementJeu>();
        const portesVisiblesID = this.curSalle.voisins.filter(x => x.type === TypeElement.porte).map(x => x.id);
        portesVisiblesID.forEach(porteID => {
          listeEleJeu.push(this.getPorte(porteID));
        });
        break;

      default:
        break;
    }

    console.log("trouverElementJeu >>> listeEleJeu=", listeEleJeu);

    let retVal: ElementJeu = null;

    // commencer par chercher avec le 2e mot
    let determinant = '';
    let premierMot: string;
    if (mots[1] == 'la' || mots[1] == 'le' || mots[1] === 'les' || mots[1] == 'l’' || mots[1] == 'l\'' || mots[1] == 'du' || mots[1] == 'un' || mots[1] == 'une') {
      determinant = mots[1];
      premierMot = mots[2];
    } else {
      premierMot = mots[1];
    }

    // remplacer les carctères doubles et les accents
    premierMot = OutilsCommandes.normaliserMot(premierMot);

    // ON CHERCHE DANS L'INTITULÉ SINGULIER (si il y en a un...)
    let eleJeuTrouves = listeEleJeu.filter(x => OutilsCommandes.normaliserMot(x.intituleS).startsWith(premierMot) && x.quantite !== 0);
    // SI RIEN TROUVE, ON CHERCHE DANS L'INTITULÉ PAR DÉFAUT
    if (eleJeuTrouves.length == 0) {
      eleJeuTrouves = listeEleJeu.filter(x => OutilsCommandes.normaliserMot(x.intitule).startsWith(premierMot) && x.quantite !== 0);
    }
    // si on a trouvé un objet
    if (eleJeuTrouves.length == 1) {
      retVal = eleJeuTrouves[0];
      // si on a trouvé plusiers objets différents
    } else if (eleJeuTrouves.length > 1) {
      // TODO: ajouter des mots en plus

    }

    if (this.verbeux) {
      console.log("trouverElementJeu >>> det=", determinant, "mot=", premierMot, "retVal=", retVal);
    }
    return retVal;
  }

  prendreElementJeu(eleJeuID) {
    let retVal: ElementJeu = null;
    let listeObjets: ElementJeu[] = null;
    let indexEleJeu = -1;
    // on recherche en priorité l'objet dans la salle actuelle
    if (this.curSalle) {
      listeObjets = this.curSalle.inventaire.objets;
      indexEleJeu = listeObjets.findIndex(x => x.id == eleJeuID);
    }
    // si pas trouvé, on recherche dans la liste globale
    if (indexEleJeu == -1) {
      listeObjets = this.jeu.elements;
      indexEleJeu = listeObjets.findIndex(x => x.id == eleJeuID);
    }

    if (indexEleJeu !== -1) {
      let eleJeu = listeObjets[indexEleJeu];
      // un seul exemplaire : on le retire de l'inventaire et on le retourne.
      if (eleJeu.quantite == 1) {
        retVal = listeObjets.splice(indexEleJeu, 1)[0];
        // plusieurs exemplaires : on le clone
      } else {
        // décrémenter quantité si pas infini
        if (eleJeu.quantite != -1) {
          eleJeu.quantite -= 1;
        }
        // faire une copie
        retVal = OutilsCommandes.copierEleJeu(eleJeu);
      }
    } else {
      console.error("prendreElementJeu >>> élément pas trouvé !");
    }
    return retVal;
  }

  getSalle(index: number) {
    return this.jeu.salles.find(x => x.id === index);
  }

  getPorte(index: number) {
    return this.jeu.elements.find(x => x.id === index);
  }

  getVoisins(loc: Localisation, type: TypeElement) {
    let found = this.curSalle.voisins.find(x => x.type === type && x.localisation === loc);
    return found ? found.id : -1;
  }

  get curSalle() {
    // TODO: retenir la salle
    const retVal = this.jeu.salles.find(x => x.id === this.jeu.position);
    if (retVal) {
      // la salle a été visité par le joueur
      retVal.visite = true;
    } else {
      console.warn("Pas trouvé la curSalle:", this.jeu.position);
    }
    return retVal;
  }

  afficherCurSalle() {
    if (this.curSalle) {
      return "—————————————————\n" +
        (this.curSalle.intitule ? (this.curSalle.intitule) : (this.curSalle.determinant + this.curSalle.nom))
        + "\n—————————————————\n"
        + (this.curSalle.description ? (this.calculerDescription(this.curSalle.description, ++this.curSalle.nbAffichageDescription) + "\n") : "")
        + this.afficherSorties();
    } else {
      console.warn("Pas trouvé de curSalle :(");
      return "Je suis où moi ? :(";
    }

  }

  afficherSorties() {
    let retVal: string;

    if (this.curSalle.voisins.length > 0) {
      retVal = "Sorties :";
      this.curSalle.voisins.forEach(voisin => {
        if (voisin.type == TypeElement.salle) {
          retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, this.curSalle.id, voisin.id));
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
        retVal += "\n - " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
      });
    }
    return retVal;
  }

  afficherObjetsCurSalle() {
    let retVal: string;

    let objets = this.curSalle.inventaire.objets.filter(x => x.quantite !== 0);

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
    let salle = this.getSalle(voisinIndex);
    let salleIntitulle = (salle.intitule ? salle.intitule : (salle.determinant + salle.nom));
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
        retVal = "descendre " + salleIntitulle + " (de)";
        break;
      case Localisation.haut:
        retVal = "monter " + salleIntitulle + " (mo)";
        break;
      case Localisation.exterieur:
        retVal = "sortir " + salleIntitulle + " (so)";
        break;
      case Localisation.interieur:
        retVal = "entrer " + salleIntitulle + " (en)";
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
      console.log("resultFois:", resultFois, "nbFois:", nbFois);
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
      statut.siVrai = true;
      retVal = true;
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