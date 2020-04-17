import { ConditionDebutee, StatutCondition, xFois } from '../models/jouer/statut-conditions';

import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { Porte } from '../models/jeu/porte';

export class OutilsCommandes {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) { }

  static copierObjet(original: Objet) {
    let retVal = new Objet();
    retVal.quantite = 1; // ça on copie pas !
    retVal.nombre = Nombre.s;
    retVal.genre = original.genre;
    retVal.determinant = original.determinant;
    retVal.intitule = original.intitule;
    retVal.intituleF = original.intituleF;
    retVal.intituleM = original.intituleM;
    retVal.intituleS = original.intituleS;
    retVal.intituleP = original.intituleP;
    retVal.id = original.id; // TODO: quid des ID pour les clones ?
    return retVal;
  }

  /**
   * Obtenir l'accord ('', 'e' ou 'es') en fonction de l'objet.
   * @param o 
   * @param estFeminin forcer féminin
   * @param estSingulier forcer singulier
   */
  static afficherAccordSimple(o: Objet, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (o.nombre == Nombre.s || estSingulier) {
      if (o.genre == Genre.f || estFeminin) {
        retVal = "e";
      } else {
        retVal = "";
      }
    } else {
      if (o.genre == Genre.f || estFeminin) {
        retVal = "es";
      } else {
        retVal = "s";
      }
    }
    return retVal;
  }

  static afficherUnUneDesQuantite(o: Objet, majuscule: boolean, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (o.quantite == 1 || estSingulier) {
      if (o.genre == Genre.f || estFeminin) {
        retVal = majuscule ? "Une " : "une ";
      } else {
        retVal = majuscule ? "Un " : "un ";
      }
    } else if (o.quantite >= 10 || o.quantite == -1) {
      retVal = majuscule ? "Des " : "des ";
    } else {
      retVal = (o.quantite + " ");
    }
    return retVal;
  }

  static afficherQuantiteIntituleObjet(o: Objet, majuscule: boolean, estFeminin: boolean) {

    let determinant = OutilsCommandes.afficherUnUneDesQuantite(o, majuscule, estFeminin, null);
    let intitule = o.intitule;

    if (o.intituleS && o.quantite == 1) {
      intitule = o.intituleS;
    } else if (o.intituleP) {
      intitule = o.intituleP;
    }

    return determinant + intitule;
  }

  static normaliserMot(mot: string) {
    const retVal = mot
      .toLocaleLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .replace(/éèêë/g, 'e')
      .replace(/ï/g, 'i')
      .replace(/àä/g, 'a')
      .replace(/ç/g, 'c');
    return retVal;
  }

  static objetPossedeCapaciteAction(objet: Objet, actionA: string, actionB: string = null): boolean {
    if (objet) {
      var retVal = false;
      objet.capacites.forEach(cap => {
        const curAction = cap.verbe.toLocaleLowerCase().trim();
        if ((curAction === actionA.toLocaleLowerCase().trim()) || (actionB && curAction === actionB.toLocaleLowerCase().trim())) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("portePossedeCapaciteAction >> objet pas défini.");
    }
  }

  static objetPossedeCapaciteActionCible(objet: Objet, actionA: string, actionB: string = null, cible: string): boolean {
    if (objet) {
      var retVal = false;
      objet.capacites.forEach(cap => {
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
      console.error("portePossedeCapaciteAction >> objet pas défini.");
    }
  }


  static portePossedeUnDeCesEtats(porte: Porte, etatA: string, etatB: string = null): boolean {
    if (porte) {
      var retVal = false;
      porte.etat.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        if (curEt === etatA.toLocaleLowerCase().trim()) {
          retVal = true;
        } else if (etatB && curEt === etatB.toLocaleLowerCase().trim()) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("portePossedeUnDeCesEtats >> porte pas définie.");
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

  afficherStatutPorte(porte: Porte) {
    let retVal = "";
    if (!porte) {
      console.error("afficherStatutPorte >> porte pas définie");
    } else {
      let ouvrable = OutilsCommandes.portePossedeUnDeCesEtats(porte, 'ouvrable');
      let ouvert = OutilsCommandes.portePossedeUnDeCesEtats(porte, 'ouvert', 'ouverte');
      let verrou = OutilsCommandes.portePossedeUnDeCesEtats(porte, 'verrouillé', 'verrouillée');

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

  trouverPorte(mots: string[]) {

    let retVal: Porte = null;

    let portesVisiblesID = this.curSalle.voisins.filter(x => x.porteIndex != -1).map(x => x.porteIndex);

    let portesVisibles = new Array<Porte>();
    portesVisiblesID.forEach(porteID => {
      portesVisibles.push(this.getPorte(porteID));
    });

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

    // à priori on recherche sur le singulier
    let objetsTrouves = portesVisibles.filter(x => OutilsCommandes.normaliserMot((x.intitule ? x.intitule : x.nom)).startsWith(premierMot));

    if (objetsTrouves.length == 1) {
      retVal = objetsTrouves[0];
    } else if (objetsTrouves.length > 1) {
      // TODO: ajouter des mots en plus
    }
    return retVal;
  }

  trouverObjet(mots: string[], objetNonPlace = false, regarderAussiInventaire = true) {

    let listeObjets = (objetNonPlace ? this.jeu.objets : this.curSalle.inventaire.objets);

    let retVal: Objet = null;

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

    // à priori on recherche sur le singulier
    let objetsTrouves = listeObjets.filter(x => OutilsCommandes.normaliserMot(x.intituleS).startsWith(premierMot) && x.quantite !== 0);
    // si rien trouvé, on recherche dans l'inventaire (si on peut)
    if (objetsTrouves.length == 0 && regarderAussiInventaire) {
      objetsTrouves = this.jeu.inventaire.objets.filter(x => OutilsCommandes.normaliserMot(x.intituleS).startsWith(premierMot) && x.quantite !== 0);
    }
    // si rien trouvé, on recherche sur la forme par défaut
    if (objetsTrouves.length == 0) {
      objetsTrouves = listeObjets.filter(x => OutilsCommandes.normaliserMot(x.intitule).startsWith(premierMot) && x.quantite !== 0);
    }
    // si on a trouvé un objet
    if (objetsTrouves.length == 1) {
      retVal = objetsTrouves[0];
      // si on a trouvé plusiers objets différents
    } else if (objetsTrouves.length > 1) {
      // TODO: ajouter des mots en plus
    }

    if (this.verbeux) {
      console.log("trouverObjet >>> det=", determinant, "mot=", premierMot, "retVal=", retVal);
    }
    return retVal;
  }

  prendreObjet(objetID, objetNonPlace = false) {
    let retVal: Objet = null;
    let listeObjets = (objetNonPlace ? this.jeu.objets : this.curSalle.inventaire.objets);
    // un seul exemplaire : on le retire de l'inventaire et on le retourne.
    let objetIndex = listeObjets.findIndex(x => x.id === objetID);
    let objet = listeObjets[objetIndex];
    if (objet.quantite == 1) {
      retVal = listeObjets.splice(objetIndex, 1)[0];
      // plusieurs exemplaires : on le clone
    } else {
      // décrémenter quantité si pas infini
      if (objet.quantite != -1) {
        objet.quantite -= 1;
      }
      // faire une copie
      retVal = OutilsCommandes.copierObjet(objet);
    }
    return retVal;
  }

  getSalle(index: number) {
    return this.jeu.salles.find(x => x.id === index);
  }

  getPorte(index: number) {
    return this.jeu.portes.find(x => x.id === index);
  }

  getVoisinSalle(loc: Localisation) {
    let found = this.curSalle.voisins.find(x => x.salleIndex != -1 && x.localisation == loc);
    console.log("getVoisinSalle:", loc, ">> found:", found);
    return found ? found.salleIndex : -1;
  }

  getVoisinPorte(loc: Localisation) {
    let found = this.curSalle.voisins.find(x => x.porteIndex != -1 && x.localisation == loc);
    console.log("getVoisinPorte:", loc, ">> found:", found);
    return found ? found.porteIndex : -1;
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
        if (voisin.salleIndex != -1) {
          retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, this.curSalle.id, voisin.salleIndex));
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
        retVal += "\n - " + OutilsCommandes.afficherQuantiteIntituleObjet(o, false, null);
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
        retVal += "\n - Il y a " + OutilsCommandes.afficherQuantiteIntituleObjet(o, false, null);
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
    } while (statut.morceaux[index] !== 'fin choix');

    // si on est dans une balise fois, 
    // et si il y a un "puis"
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