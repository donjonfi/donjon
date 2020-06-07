import { PositionObjet, PrepositionSpatiale } from '../models/jeu/position-objet';

import { Action } from '../models/compilateur/action';
import { Auditeur } from '../models/jouer/auditeur';
import { ClasseRacine } from '../models/commun/classe';
import { ElementGenerique } from '../models/compilateur/element-generique';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { Genre } from '../models/commun/genre.enum';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Jeu } from '../models/jeu/jeu';
import { Lieu } from '../models/jeu/lieu';
import { Localisation } from '../models/jeu/localisation';
import { Monde } from '../models/compilateur/monde';
import { MotUtils } from './mot-utils';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { Regle } from '../models/compilateur/regle';
import { TypeRegle } from '../models/compilateur/type-regle';
import { Voisin } from '../models/jeu/voisin';

export class Generateur {

  public static genererJeu(monde: Monde, regles: Regle[], actions: Action[]): Jeu {

    let indexElementJeu = 0;
    let jeu = new Jeu();

    jeu.titre = monde.titre;



    // PLACER LE JOUEUR
    // ****************
    jeu.joueur = new Objet(++indexElementJeu, "Joueur", new GroupeNominal("Le", "Joueur"), ClasseRacine.vivant, 1, Genre.m);

    if (monde.joueurs.length > 0 && monde.joueurs[0].positionString) {
      const ps = PositionObjet.getPrepositionSpatiale(monde.joueurs[0].positionString.position);
      const lieuID = Generateur.getLieuID(jeu.lieux, monde.joueurs[0].positionString.complement);
      if (lieuID !== -1) {
        jeu.joueur.position = new PositionObjet(ps, ClasseRacine.lieu, lieuID);
      }
    }

    // AJOUTER LES LIEUX
    // ******************
    let premierIndexLieu = (indexElementJeu + 1);
    monde.lieux.forEach(curEle => {

      let titre = curEle.determinant + curEle.nom;

      let nouvLieu = new Lieu(++indexElementJeu, curEle.nom, titre, curEle.type);
      nouvLieu.description = curEle.description;
      // parcourir les propriétés du lieu
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            nouvLieu.description = pro.valeur;
            break;

          case 'titre':
          case 'intitulé':
            nouvLieu.titre = pro.valeur;
            break;

          default:
            break;
        }
      });
      jeu.lieux.push(nouvLieu);
    });

    // AJOUTER LES PORTES
    // ******************
    let premierIndexPorte = (indexElementJeu + 1);
    monde.portes.forEach(curEle => {
      const intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
      let newPorte = new Objet(++indexElementJeu, curEle.nom, intitule, curEle.type, curEle.quantite, curEle.genre);
      newPorte.description = curEle.description;
      curEle.attributs.forEach(at => {
        newPorte.etats.push(at);
      });

      // par défaut une porte est ouvrable (sauf si elle contient « pas ouvrable ».)
      if (!ElementsJeuUtils.possedeUnDeCesEtats(newPorte, "pas ouvrable", "ouvrable")) {
        newPorte.etats.push("ouvrable");
      }

      // parcourir les propriétés du lieu
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            newPorte.description = pro.valeur;
            break;

          case 'intitulé':
          case 'titre':
            newPorte.titre = pro.valeur;
            break;

          default:
            break;
        }
      });
      jeu.objets.push(newPorte);
    });

    // DÉFINIR LES VOISINS (LIEUX)
    // ****************************
    for (let index = 0; index < monde.lieux.length; index++) {
      const curEle = monde.lieux[index];
      Generateur.ajouterVoisin(jeu.lieux, curEle, (premierIndexLieu + index));
    }

    // DÉFINIR LES VOISINS (PORTES)
    // ****************************
    for (let index = 0; index < monde.portes.length; index++) {
      const curEle = monde.portes[index];
      Generateur.ajouterVoisin(jeu.lieux, curEle, (premierIndexPorte + index));
    }


    // PLACER LES ÉLÉMENTS DU JEU DANS LES LIEUX (ET DANS LA LISTE COMMUNE)
    // *********************************************************************
    let premierIndexObjet = (indexElementJeu + 1);

    monde.objets.forEach(curEle => {
      let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
      let newObjet = new Objet(++indexElementJeu, curEle.nom, intitule, curEle.type, curEle.quantite, curEle.genre);

      newObjet.description = curEle.description;
      newObjet.etats = curEle.attributs;
      newObjet.capacites = curEle.capacites;

      // Déterminer le SINGULIER à partir du pluriel.
      if (curEle.nombre === Nombre.p) {
        // on a déjà le pluriel
        newObjet.intituleP = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        // le singulier est fourni
        if (curEle.nomS) {
          newObjet.intituleS = new GroupeNominal(null, curEle.nomS, curEle.epitheteS);
          // le singulier est calculé
        } else {
          newObjet.intituleS = new GroupeNominal(null, MotUtils.getSingulier(curEle.nom), MotUtils.getSingulier(curEle.epithete));
        }
        // Déterminer PLURIEL à partir du singulier.
      } else if (curEle.nombre == Nombre.s) {
        // on a déjà le singulier
        newObjet.intituleS = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        // le pluriel est fourni
        if (curEle.nomP) {
          newObjet.intituleP = new GroupeNominal(null, curEle.nomP, curEle.epitheteP);
          // le pluriel est calculé
        } else {
          newObjet.intituleP = new GroupeNominal(null, MotUtils.getPluriel(curEle.nom), MotUtils.getPluriel(curEle.epithete));
        }
      }

      // parcourir les propriétés de l’élément
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            newObjet.description = pro.valeur;
            break;

          case 'intitulé':
            // TODO: gérer groupe nominal ?
            newObjet.intitule = new GroupeNominal(null, pro.valeur);
            break;

          default:
            break;
        }
      });


      // POSITION de l’élément
      if (curEle.positionString) {
        // const localisation = Generateur.getLocalisation(curEle.positionString.position);
        const lieuID = Generateur.getLieuID(jeu.lieux, curEle.positionString.complement);
        // lieu trouvé
        if (lieuID !== -1) {
          newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), ClasseRacine.lieu, lieuID);
          // pas de lieu trouvé
        } else {
          // chercher un contenant ou un support
          const contenantSupport = Generateur.getContenantSupport(jeu.objets, curEle.positionString.complement);
          if (contenantSupport) {
            newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), ClasseRacine.objet, contenantSupport.id);
          } else {
            console.warn("position élément jeu pas trouvé:", curEle.nom, curEle.positionString);
          }
        }

        jeu.objets.push(newObjet);

        // élément pas positionné
      } else {
        jeu.objets.push(newObjet);
      }
    });

    // PLACEMENT DU JOUEUR
    // *******************
    // si pas de position définie, on commence dans le premier lieu
    if (!jeu.joueur.position) {
      if (jeu.lieux.length > 0) {
        jeu.joueur.position = new PositionObjet(PrepositionSpatiale.dans, ClasseRacine.lieu, jeu.lieux[0].id);
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

    // GÉNÉRER LES ACTIONS
    // *******************
    actions.forEach(action => {
      jeu.actions.push(action);
    });

    return jeu;

  }

  /**
   * Ajout d'un voisin (lieu ou porte) à un lieu 
   */
  static ajouterVoisin(lieux: Lieu[], elVoisin: ElementGenerique, idElVoisin: number) {

    console.log("ajouterVoisin >>> ", elVoisin);

    if (elVoisin.positionString) {
      const localisation = Generateur.getLocalisation(elVoisin.positionString.position);
      const lieuTrouveID = Generateur.getLieuID(lieux, elVoisin.positionString.complement);

      if (localisation === Localisation.inconnu || lieuTrouveID === -1) {
        console.log("positionString pas trouvé:", elVoisin.positionString);
      } else {
        // ajouter au lieu trouvé, le voisin elVoisin
        const opposeVoisin = new Voisin(idElVoisin, elVoisin.type, localisation);
        const lieu = lieux.find(x => x.id == lieuTrouveID);
        lieu.voisins.push(opposeVoisin);

        // le lieu trouvé, est le voisin du lieu elVoisin.
        if (elVoisin.type == ClasseRacine.lieu) {
          // ajouter le lieu trouvé aux voisins de elVoisin
          const newVoisin = new Voisin(lieuTrouveID, elVoisin.type, this.getOpposePosition(localisation));
          const lieuTrouve = lieux.find(x => x.id === idElVoisin);
          lieuTrouve.voisins.push(newVoisin);
        }
      }
    } else {

    }
  }

  static getAuditeur(regle: Regle) {
    let auditeur = new Auditeur();
    auditeur.type = regle.typeRegle;
    auditeur.evenement = regle.evenement;
    auditeur.instructions = regle.instructions;
    return auditeur;
  }
  /**
   * Retrouver un lieu sur base de son intitulé.
   * @param lieux 
   * @param intituleLieu
   * @returns ID du lieu ou -1 si pas trouvée.
   */
  static getLieuID(lieux: Lieu[], intituleLieu: string) {

    let candidats: Lieu[] = [];
    let retVal = -1;
    // trouver le sujet complet
    lieux.forEach(lieu => {
      if (lieu.nom == intituleLieu) {
        candidats.push(lieu);
      }
    });
    // sujet trouvé
    if (candidats.length === 1) {
      retVal = candidats[0].id;
      // pas trouvé => on va chercher le début d'un sujet
    } else if (candidats.length === 0) {
      let nbFound = 0;
      // trouver un début de sujet
      lieux.forEach(lieu => {
        if (lieu.nom.startsWith(intituleLieu)) {
          candidats.push(lieu);
          nbFound += 1;
        }
      });
      if (nbFound === 1) {
        retVal = candidats[0].id;
      } else {
        console.log("complément position pas trouvé :", intituleLieu);
      }
    } else {
      console.log("complément position pas trouvé (plusieurs candidats) :", intituleLieu);

    }

    return retVal;
  }

  static getContenantSupport(objets: Objet[], nomObjet: string) {

    // TODO: check si contenant ou support ?
    // mais quid pour « sous » ?

    let trouve: Objet = null;

    objets.forEach(el => {
      if (el.nom === nomObjet) {
        trouve = el;
      }
    });

    return trouve;
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
