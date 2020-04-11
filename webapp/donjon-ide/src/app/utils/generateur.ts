import { Auditeur } from '../models/jouer/auditeur';
import { Consequence } from '../models/compilateur/consequence';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Instruction } from '../models/jouer/instruction';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Monde } from '../models/compilateur/monde';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { PhraseUtils } from './phrase-utils';
import { Regle } from '../models/compilateur/regle';
import { Salle } from '../models/jeu/salle';
import { TypeRegle } from '../models/compilateur/type-regle';
import { Voisin } from '../models/jeu/voisin';

export class Generateur {

  public static genererJeu(monde: Monde, regles: Regle[]): Jeu {

    let jeu = new Jeu();

    jeu.titre = monde.titre;

    // AJOUTER LES SALLES
    for (let index = 0; index < monde.salles.length; index++) {
      const curEle = monde.salles[index];

      let newSalle = new Salle();
      newSalle.id = (index);
      newSalle.nom = curEle.nom;
      newSalle.determinant = curEle.determinant;
      newSalle.genre = curEle.genre;
      newSalle.nombre = curEle.nombre;
      newSalle.description = curEle.description;

      // parcourir les propriétés de la salle
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            newSalle.description = pro.valeur;
            break;

          case 'intitulé':
            newSalle.intitule = pro.valeur;
            break;

          default:
            break;
        }
      });

      jeu.salles.push(newSalle);
    }

    // DÉFINIR LES VOISINS
    for (let index = 0; index < monde.salles.length; index++) {
      const curEle = monde.salles[index];

      if (curEle.positionString) {
        const localisation = Generateur.getLocalisation(curEle.positionString.position);
        const salleID = Generateur.getSalleID(jeu.salles, curEle.positionString.complement);

        if (localisation === Localisation.inconnu || salleID === -1) {
          console.log("positionString pas trouvé: ", curEle.positionString);
        } else {
          let newVoisin = new Voisin();
          newVoisin.localisation = this.getOpposePosition(localisation);
          newVoisin.salleIndex = salleID;
          // newVoisin.salle = jeu.salles[complement];
          jeu.salles[index].voisins.push(newVoisin);

          let opposeVoisin = new Voisin();
          opposeVoisin.localisation = localisation;
          // opposeVoisin.salle = jeu.salles[index];
          opposeVoisin.salleIndex = index;
          jeu.salles[salleID].voisins.push(opposeVoisin);
        }
      }
    }

    // PLACER LE JOUEUR
    if (monde.joueurs.length > 0 && monde.joueurs[0].positionString) {
      const localisation = Generateur.getLocalisation(monde.joueurs[0].positionString.position);
      const salleID = Generateur.getSalleID(jeu.salles, monde.joueurs[0].positionString.complement);
      if (salleID != -1) {
        jeu.position = salleID;
      }
    }

    // PLACER LES OBJETS DANS LES SALLES (ET DANS LA LISTE COMMUNE)
    for (let index = 0; index < monde.objets.length; index++) {
      const curEle = monde.objets[index];

      let newObjet = new Objet();
      newObjet.id = index;
      newObjet.intitule = curEle.nom;
      newObjet.description = curEle.description;

      if (curEle.nombre == Nombre.p) {
        newObjet.intituleP = curEle.nom;
        if (curEle.nomS) {
          newObjet.intituleS = curEle.nomS;
        } else {
          // essayer de déterminer le singulier sur base des règles les plus communes
          if (curEle.nom.endsWith('eaux') || curEle.nom.endsWith('eux')) {
            newObjet.intituleS = curEle.nom.slice(0, curEle.nom.length - 1);
          } else if (curEle.nom.endsWith('aux')) {
            newObjet.intituleS = curEle.nom.slice(0, curEle.nom.length - 2) + 'l';
          } else if (curEle.nom.endsWith('s')) {
            newObjet.intituleS = curEle.nom.slice(0, curEle.nom.length - 1);
          } else {
            newObjet.intituleS = curEle.nom;
          }
        }
      } else if (curEle.nombre == Nombre.s) {
        newObjet.intituleS = curEle.nom;

        if (curEle.nomP) {
          newObjet.intituleP = curEle.nomP;
        } else {
          // essayer de déterminer le pluriel sur base des règles les plus communes
          if (curEle.nom.endsWith('al')) {
            newObjet.intituleP = curEle.nom.slice(0, curEle.nom.length - 1) + 'ux';
          } else if (curEle.nom.endsWith('au') || curEle.nom.endsWith('eu')) {
            newObjet.intituleP = curEle.nom + 'x';
          } else if (curEle.nom.endsWith('s') || curEle.nom.endsWith('x') || curEle.nom.endsWith('z')) {
            newObjet.intituleP = curEle.nom;
          } else {
            newObjet.intituleP = curEle.nom + 's';
          }
        }
      }

      newObjet.determinant = curEle.determinant;
      newObjet.genre = curEle.genre;
      newObjet.nombre = curEle.nombre;
      newObjet.quantite = curEle.quantite;
      newObjet.etat = curEle.attributs;
      newObjet.type = curEle.type;

      if (curEle.positionString) {
        // const localisation = Generateur.getLocalisation(curEle.positionString.position);
        const salleID = Generateur.getSalleID(jeu.salles, curEle.positionString.complement);

        if (salleID === -1) {
          console.log("position objet pas trouvé: ", curEle.nom, curEle.positionString);
          jeu.objets.push(newObjet);
          // objet pas positionné
        } else {
          jeu.salles[salleID].inventaire.objets.push(newObjet);
        }
        // objet pas positionné
      } else {
        if (!jeu.objets) {
          console.warn(" jeu.objets est vide ?!");
          jeu.objets = new Array<Objet>();
        }
        jeu.objets.push(newObjet);
      }
    }

    // PLACEMENT DU JOUEUR
    // si pas de position définie, on commence dans la première salle
    if (!jeu.position) {
      if (jeu.salles.length > 0) {
        jeu.position = jeu.salles[0].id;
      }
    }

    // générer les auditeurs
    regles.forEach(regle => {
      switch (regle.typeRegle) {
        case TypeRegle.apres:
        case TypeRegle.avant:
        case TypeRegle.remplacer:
          jeu.auditeurs.push(Generateur.getAuditeur(regle));
          break;

        default:
          break;
      }
    });

    return jeu;

  }

  static getAuditeur(regle: Regle) {
    let auditeur = new Auditeur();
    auditeur.type = regle.typeRegle;
    auditeur.determinant = regle.condition.determinant;
    auditeur.sujet = regle.condition.sujet;
    auditeur.verbe = regle.condition.verbe;
    auditeur.complement = regle.condition.complement;
    auditeur.instructions = regle.instructions;
    return auditeur;
  }
  /**
   * Retrouver une salle sur base de son intitulé.
   * @param salles 
   * @param intituleSalle 
   * @returns ID de la salle ou -1 si pas trouvée.
   */
  static getSalleID(salles: Salle[], intituleSalle: string) {

    let candidats: Salle[] = [];
    let retVal = -1;
    // trouver le sujet complet
    salles.forEach(salle => {
      if (salle.nom == intituleSalle) {
        candidats.push(salle);
      }
    });
    // sujet trouvé
    if (candidats.length === 1) {
      retVal = candidats[0].id;
      // pas trouvé => on va chercher le début d'un sujet
    } else if (candidats.length === 0) {
      let nbFound = 0;
      // trouver un début de sujet
      salles.forEach(salle => {
        if (salle.nom.startsWith(intituleSalle)) {
          candidats.push(salle);
          nbFound += 1;
        }
      });
      if (nbFound === 1) {
        retVal = candidats[0].id;
      } else {
        console.log("complément position pas trouvé : ", intituleSalle);
      }
    } else {
      console.log("complément position pas trouvé (plusieurs candidats) : ", intituleSalle);

    }

    return retVal;
  }

  /**
   * Obtenir la localisation correspondante.
   */
  static getLocalisation(strPosition: string) {

    strPosition = strPosition.replace(/(du|de la|de l'|des)/g, "").trim();

    let retVal = Localisation.inconnu;
    switch (strPosition) {
      case "en bas":
        retVal = Localisation.bas;
        break;
      case "en haut":
        retVal = Localisation.haut;
        break;
      case "à l'extérieur":
        retVal = Localisation.exterieur;
        break;
      case "à l'intérieur":
        retVal = Localisation.interieur;
        break;
      case "à l'est":
        retVal = Localisation.est;
        break;
      case "à l'ouest":
        retVal = Localisation.ouest;
        break;
      case "au nord":
        retVal = Localisation.nord;
        break;
      case "au sud":
        retVal = Localisation.sud;
        break;

      default:
        console.log("Localisation pas connue: ", strPosition);
        break;
    }

    return retVal;
  }

  static getOpposePosition(localisation: Localisation) {
    switch (localisation) {
      case Localisation.bas:
        return Localisation.haut;
        break;
      case Localisation.haut:
        return Localisation.bas;
        break;
      case Localisation.est:
        return Localisation.ouest;
        break;
      case Localisation.ouest:
        return Localisation.est;
        break;
      case Localisation.nord:
        return Localisation.sud;
        break;
      case Localisation.sud:
        return Localisation.nord;
        break;
      case Localisation.interieur:
        return Localisation.exterieur;
        break;
      case Localisation.exterieur:
        return Localisation.interieur;
        break;
      default:
        return Localisation.inconnu;
        break;
    }
  }

}
