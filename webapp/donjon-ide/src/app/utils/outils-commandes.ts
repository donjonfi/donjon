import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { ResolvedStaticSymbol } from '@angular/compiler';

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

  trouverObjet(mots: string[], objetNonPlace = false) {

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

  getVoisin(loc: Localisation) {
    console.log("getVoisin:", loc);

    let found = this.curSalle.voisins.find(x => x.localisation == loc);

    console.log("  >> found:", found);

    return found ? found.salleIndex : -1;
  }

  get curSalle() {
    // TODO: retenir la salle
    const retVal = this.jeu.salles.find(x => x.id === this.jeu.position);
    if (!retVal) {
      console.warn("Pas trouvé la curSalle:", this.jeu.position);
    }
    return retVal;
  }

  afficherCurSalle() {
    if (this.curSalle) {
      return "—————————————————\n" +
        (this.curSalle.intitule ? (this.curSalle.intitule) : (this.curSalle.determinant + this.curSalle.nom))
        + "\n—————————————————\n"
        + (this.curSalle.description ? (this.curSalle.description + "\n") : "")
        + this.afficherSorties()
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
        retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, this.curSalle.id, voisin.salleIndex));
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
    switch (localisation) {
      case Localisation.nord:
        return "nord (n)";
      case Localisation.sud:
        return "sud (s)";
      case Localisation.est:
        return "est (e)";
      case Localisation.ouest:
        return "ouest (o)";

      case Localisation.bas:
        return "descendre " + this.getSalle(voisinIndex)?.nom + " (de)";
      case Localisation.haut:
        return "monter " + this.getSalle(voisinIndex)?.nom + " (mo)";
      case Localisation.exterieur:
        return "sortir " + this.getSalle(curSalleIndex)?.nom + " (so)";
      case Localisation.interieur:
        return "entrer " + this.getSalle(voisinIndex)?.nom + " (en)";

      default:
        return localisation.toString();
    }
  }

}