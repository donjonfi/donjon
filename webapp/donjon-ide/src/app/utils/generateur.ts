import { Auditeur } from '../models/jouer/auditeur';
import { ElementGenerique } from '../models/compilateur/element-generique';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Monde } from '../models/compilateur/monde';
import { Nombre } from '../models/commun/nombre.enum';
import { OutilsCommandes } from './outils-commandes';
import { Regle } from '../models/compilateur/regle';
import { Salle } from '../models/jeu/salle';
import { TypeElement } from '../models/commun/type-element.enum';
import { TypeRegle } from '../models/compilateur/type-regle';
import { Voisin } from '../models/jeu/voisin';

export class Generateur {

  public static genererJeu(monde: Monde, regles: Regle[]): Jeu {

    let indexElementJeu = 0;
    let jeu = new Jeu();

    jeu.titre = monde.titre;

    // AJOUTER LES SALLES
    // ******************
    let premierIndexSalle = (indexElementJeu + 1);
    monde.salles.forEach(curEle => {
      let newSalle = new Salle(++indexElementJeu, curEle.type, curEle.determinant, curEle.nom, curEle.genre, curEle.nombre, curEle.quantite);
      newSalle.intitule = curEle.determinant + curEle.nom;
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
    });

    // AJOUTER LES PORTES
    // ******************
    let premierIndexPorte = (indexElementJeu + 1);
    monde.portes.forEach(curEle => {
      let newPorte = new ElementJeu(++indexElementJeu, curEle.type, curEle.determinant, curEle.nom, curEle.genre, curEle.nombre, curEle.quantite);
      newPorte.intitule = curEle.determinant + curEle.nom;
      newPorte.description = curEle.description;
      curEle.attributs.forEach(at => {
        newPorte.etats.push(at);
      });

      // par défaut une porte est ouvrable (sauf si elle contient « pas ouvrable ».)
      if (!ElementsJeuUtils.possedeUnDeCesEtats(newPorte, "pas ouvrable", "ouvrable")) {
        newPorte.etats.push("ouvrable");
      }

      // parcourir les propriétés de la salle
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            newPorte.description = pro.valeur;
            break;

          case 'intitulé':
            newPorte.intitule = pro.valeur;
            break;

          default:
            break;
        }
      });
      jeu.elements.push(newPorte);
    });

    // DÉFINIR LES VOISINS (SALLES)
    // ****************************
    for (let index = 0; index < monde.salles.length; index++) {
      const curEle = monde.salles[index];
      Generateur.ajouterVoisin(jeu.salles, curEle, (premierIndexSalle + index));
    }

    // DÉFINIR LES VOISINS (PORTES)
    // ****************************
    for (let index = 0; index < monde.portes.length; index++) {
      const curEle = monde.portes[index];
      Generateur.ajouterVoisin(jeu.salles, curEle, (premierIndexPorte + index));
    }

    // PLACER LE JOUEUR
    // ****************
    if (monde.joueurs.length > 0 && monde.joueurs[0].positionString) {
      const localisation = Generateur.getLocalisation(monde.joueurs[0].positionString.position);
      const salleID = Generateur.getSalleID(jeu.salles, monde.joueurs[0].positionString.complement);
      if (salleID != -1) {
        jeu.position = salleID;
      }
    }

    // PLACER LES ÉLÉMENTS DU JEU DANS LES SALLES (ET DANS LA LISTE COMMUNE)
    // *********************************************************************
    let premierIndexObjet = (indexElementJeu + 1);

    monde.objets.forEach(curEle => {
      let newEleJeu = new ElementJeu(++indexElementJeu, curEle.type, curEle.determinant, curEle.nom, curEle.genre, curEle.nombre, curEle.quantite);

      newEleJeu.intitule = curEle.nom;
      newEleJeu.description = curEle.description;
      newEleJeu.etats = curEle.attributs;
      newEleJeu.capacites = curEle.capacites;

      // Déterminer PLURIEL
      if (curEle.nombre == Nombre.p) {
        newEleJeu.intituleP = curEle.nom;
        // le singulier est fourni
        if (curEle.nomS) {
          newEleJeu.intituleS = curEle.nomS;
          // le singulier est calculé
        } else {
          // essayer de déterminer le singulier sur base des règles les plus communes
          if (curEle.nom.endsWith('eaux') || curEle.nom.endsWith('eux')) {
            newEleJeu.intituleS = curEle.nom.slice(0, curEle.nom.length - 1);
          } else if (curEle.nom.endsWith('aux')) {
            newEleJeu.intituleS = curEle.nom.slice(0, curEle.nom.length - 2) + 'l';
          } else if (curEle.nom.endsWith('s')) {
            newEleJeu.intituleS = curEle.nom.slice(0, curEle.nom.length - 1);
          } else {
            newEleJeu.intituleS = curEle.nom;
          }
        }
        // Déterminer SINGULIER
      } else if (curEle.nombre == Nombre.s) {
        newEleJeu.intituleS = curEle.nom;
        // le pluriel est fourni
        if (curEle.nomP) {
          newEleJeu.intituleP = curEle.nomP;
          // le pluriel est calculé
        } else {
          // essayer de déterminer le pluriel sur base des règles les plus communes
          if (curEle.nom.endsWith('al')) {
            newEleJeu.intituleP = curEle.nom.slice(0, curEle.nom.length - 1) + 'ux';
          } else if (curEle.nom.endsWith('au') || curEle.nom.endsWith('eu')) {
            newEleJeu.intituleP = curEle.nom + 'x';
          } else if (curEle.nom.endsWith('s') || curEle.nom.endsWith('x') || curEle.nom.endsWith('z')) {
            newEleJeu.intituleP = curEle.nom;
          } else {
            newEleJeu.intituleP = curEle.nom + 's';
          }
        }
      }

      // parcourir les propriétés de l’élément
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            newEleJeu.description = pro.valeur;
            break;

          case 'intitulé':
            newEleJeu.intitule = pro.valeur;
            break;

          default:
            break;
        }
      });


      // POSITION de l’élément
      if (curEle.positionString) {
        // const localisation = Generateur.getLocalisation(curEle.positionString.position);
        const salleID = Generateur.getSalleID(jeu.salles, curEle.positionString.complement);
        // élément pas trouvé
        if (salleID === -1) {
          console.log("position élément jeu pas trouvé: ", curEle.nom, curEle.positionString);
          jeu.elements.push(newEleJeu);
          // élément trouvé
        } else {
          const salleTrouvee = jeu.salles.find(x => x.id === salleID);
          salleTrouvee.inventaire.objets.push(newEleJeu);
        }
        // élément pas positionné
      } else {
        jeu.elements.push(newEleJeu);
      }
    });

    // PLACEMENT DU JOUEUR
    // *******************
    // si pas de position définie, on commence dans la première salle
    if (!jeu.position) {
      if (jeu.salles.length > 0) {
        jeu.position = jeu.salles[0].id;
      }
    }

    // GÉNÉRER LES AUDITEURS
    // *********************
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

  /**
   * Ajout d'un voisin (salle ou porte) à une salle 
   */
  static ajouterVoisin(salles: Salle[], elVoisin: ElementGenerique, idElVoisin: number) {

    console.log("ajouterVoisin >>> ", elVoisin);

    if (elVoisin.positionString) {
      const localisation = Generateur.getLocalisation(elVoisin.positionString.position);
      const foundSalleID = Generateur.getSalleID(salles, elVoisin.positionString.complement);

      if (localisation === Localisation.inconnu || foundSalleID === -1) {
        console.log("positionString pas trouvé: ", elVoisin.positionString);
      } else {
        // ajouter à la salle trouvée, le voisin elVoisin
        const opposeVoisin = new Voisin(idElVoisin, elVoisin.type, localisation);
        const salle = salles.find(x => x.id == foundSalleID);
        salle.voisins.push(opposeVoisin);

        // la salle trouvée, est la voisine de la salle elVoisin.
        if (elVoisin.type == TypeElement.salle) {
          // ajouter la salle trouvée aux voisins de elVoisin
          const newVoisin = new Voisin(foundSalleID, elVoisin.type, this.getOpposePosition(localisation));
          const salleTrouvee = salles.find(x => x.id === idElVoisin);
          salleTrouvee.voisins.push(newVoisin);
        }
      }
    } else {

    }
  }

  static getAuditeur(regle: Regle) {
    let auditeur = new Auditeur();
    auditeur.type = regle.typeRegle;
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
