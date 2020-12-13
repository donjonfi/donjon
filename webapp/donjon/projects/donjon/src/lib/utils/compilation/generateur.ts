import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { Action } from '../../models/compilateur/action';
import { Aide } from '../../models/commun/aide';
import { Auditeur } from '../../models/jouer/auditeur';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { ListeEtats } from '../jeu/liste-etats';
import { Localisation } from '../../models/jeu/localisation';
import { Monde } from '../../models/compilateur/monde';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { Regle } from '../../models/compilateur/regle';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { Voisin } from '../../models/jeu/voisin';

export class Generateur {

  public static genererJeu(monde: Monde, regles: Regle[], actions: Action[], aides: Aide[]): Jeu {

    let indexElementJeu = 0;
    let jeu = new Jeu();

    // DÉFINIR LES CLASSES
    // *******************
    jeu.classes = monde.classes;

    // DÉFINIR LES FICHES D'AIDE
    // *************************
    jeu.aides = aides;

    // PLACER LE JOUEUR
    // ****************
    let joueur = new Objet(++indexElementJeu, "joueur", new GroupeNominal("Le ", "joueur"), ClassesRacines.Vivant, 1, Genre.m, Nombre.s);
    jeu.joueur = joueur;
    joueur.intituleS = joueur.intitule;
    joueur.description = "(C’est vous)";
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.invisible);
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.intact);
    // ajouter le joueur aux objets du jeu
    jeu.objets.push(joueur);
    // regarder si on a positionné le joueur dans le monde
    const joueurDansMonde = monde.speciaux.find(x => x.nom === 'joueur');
    if (joueurDansMonde && joueurDansMonde.positionString) {
      const ps = PositionObjet.getPrepositionSpatiale(joueurDansMonde.positionString.position);
      const lieuID = Generateur.getLieuID(jeu.lieux, joueurDansMonde.positionString.complement, true);
      if (lieuID !== -1) {
        joueur.position = new PositionObjet(ps, EClasseRacine.lieu, lieuID);
      }
    }

    // INFOS SUR LE JEU
    // ****************
    const jeuDansMonde = monde.speciaux.find(x => x.nom === 'jeu');
    if (jeuDansMonde) {
      jeu.titre = jeuDansMonde.proprietes.find(x => x.nom === "titre")?.valeur;
      jeu.auteur = jeuDansMonde.proprietes.find(x => x.nom === "auteur")?.valeur;
      jeu.auteurs = jeuDansMonde.proprietes.find(x => x.nom === "auteurs")?.valeur;
      jeu.version = jeuDansMonde.proprietes.find(x => x.nom === "version")?.valeur;
    }
    const licenceDansMonde = monde.speciaux.find(x => x.nom === 'licence');
    if (licenceDansMonde) {
      jeu.licenceTitre = licenceDansMonde.proprietes.find(x => x.nom === "titre")?.valeur;
      jeu.licenceLien = licenceDansMonde.proprietes.find(x => x.nom === "lien")?.valeur;
    }

    // AJOUTER LES LIEUX
    // ******************
    let premierIndexLieu = (indexElementJeu + 1);
    monde.lieux.forEach(curEle => {

      let titre = curEle.determinant + curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "");
      let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);

      let nouvLieu = new Lieu(++indexElementJeu, curEle.nom, intitule, titre);
      nouvLieu.description = curEle.description;

      // parcourir les propriétés du lieu
      curEle.proprietes.forEach(pro => {
        switch (pro.nom) {
          case 'description':
            nouvLieu.description = pro.valeur;
            break;

          case 'titre':
            nouvLieu.titre = pro.valeur;
            break;

          default:
            break;
        }
      });
      jeu.lieux.push(nouvLieu);
    });

    // DÉFINIR LES VOISINS (LIEUX)
    // ****************************
    for (let index = 0; index < monde.lieux.length; index++) {
      const curEle = monde.lieux[index];
      Generateur.ajouterVoisin(jeu.lieux, curEle, (premierIndexLieu + index));
    }

    // PLACER LES ÉLÉMENTS DU JEU DANS LES LIEUX (ET DANS LA LISTE COMMUNE)
    // *********************************************************************
    let premierIndexObjet = (indexElementJeu + 1);

    monde.objets.forEach(curEle => {
      // ignorer le joueur (on l'a déjà ajouté)
      if (curEle.nom.toLowerCase() != 'joueur') {
        let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        let newObjet = new Objet(++indexElementJeu, curEle.nom, intitule, curEle.classe, curEle.quantite, curEle.genre, curEle.nombre);

        newObjet.description = curEle.description;
        newObjet.apercu = curEle.apercu;
        // newObjet.etats = curEle.attributs ?? [];
        newObjet.capacites = curEle.capacites;
        newObjet.reactions = curEle.reactions;
        newObjet.synonymes = (curEle.synonymes && curEle.synonymes.length) ? curEle.synonymes : null;
        // ajouter les états par défaut de la classe de l’objet:
        // (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
        // console.warn("BEGIN attribuerEtatsParDefaut >> obj=", newObjet, "cla=", newObjet.classe);
        Generateur.attribuerEtatsParDefaut(newObjet.classe, newObjet, jeu.etats);
        // console.warn("END attribuerEtatsParDefaut >> obj=", newObjet, "cla=", newObjet.classe);

        // ajouter les états de l'objet définis explicitements
        if (curEle.attributs) {
          curEle.attributs.forEach(attribut => {
            jeu.etats.ajouterEtatElement(newObjet, attribut);
          });
        }

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
            case 'aperçu':
              newObjet.apercu = pro.valeur;
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
        // -- PORTE
        if (ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.porte)) {
          Generateur.ajouterVoisin(jeu.lieux, curEle, newObjet.id);
        } else {
          // -- AUTRE TYPE D'OBJET
          if (curEle.positionString) {
            // const localisation = Generateur.getLocalisation(curEle.positionString.position);
            const lieuID = Generateur.getLieuID(jeu.lieux, curEle.positionString.complement, false);
            // lieu trouvé
            if (lieuID !== -1) {
              newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), EClasseRacine.lieu, lieuID);
              // pas de lieu trouvé
            } else {
              // chercher un contenant ou un support
              const contenantSupport = Generateur.getContenantSupport(jeu.objets, curEle.positionString.complement);
              if (contenantSupport) {
                newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), EClasseRacine.objet, contenantSupport.id);
              } else {
                console.warn("position élément jeu pas trouvé:", curEle.nom, curEle.positionString);
              }
            }
          }
        }
        jeu.objets.push(newObjet);
      }
    });

    // PLACEMENT DU JOUEUR
    // *******************
    // si pas de position définie, on commence dans le premier lieu
    if (!jeu.joueur.position) {
      if (jeu.lieux.length > 0) {
        jeu.joueur.position = new PositionObjet(PrepositionSpatiale.dans, EClasseRacine.lieu, jeu.lieux[0].id);
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

    // console.log("ajouterVoisin >>> ", elVoisin);

    if (elVoisin.positionString) {
      const localisation = Generateur.getLocalisation(elVoisin.positionString.position);
      const lieuTrouveID = Generateur.getLieuID(lieux, elVoisin.positionString.complement, true);

      if (localisation === Localisation.inconnu || lieuTrouveID === -1) {
        console.log("positionString pas trouvé:", elVoisin.positionString);
      } else {
        // ajouter au lieu trouvé, le voisin elVoisin
        const opposeVoisin = new Voisin(idElVoisin, elVoisin.classe.nom, localisation);
        const lieu = lieux.find(x => x.id == lieuTrouveID);
        lieu.voisins.push(opposeVoisin);

        // le lieu trouvé, est le voisin du lieu elVoisin.
        if (elVoisin.classeIntitule == EClasseRacine.lieu) {
          // ajouter le lieu trouvé aux voisins de elVoisin
          const newVoisin = new Voisin(lieuTrouveID, elVoisin.classe.nom, this.getOpposePosition(localisation));
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
  static getLieuID(lieux: Lieu[], intituleLieu: string, erreurSiPasTrouve: boolean) {

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
      } else if (erreurSiPasTrouve) {
        console.log("complément position pas trouvé : intituleLieu=", intituleLieu, "lieux=", lieux);
      }
    } else if (erreurSiPasTrouve) {
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
   * Atribuer les états par défaut de l’objet sur base de la classe spécifiée.
   * Si la classe à un parent, on commence par attribuer les états par défaut du parent.
   */
  static attribuerEtatsParDefaut(classe: Classe, obj: Objet, etats: ListeEtats) {
    // commencer par la classe parent (s’il y en a)
    if (classe.parent) {
      // console.log(">>>>> on regarde le parent=", classe.parent);
      Generateur.attribuerEtatsParDefaut(classe.parent, obj, etats);
      // attribuer les états par défaut de la classe
    }
    // console.log(">>>>>> on regarde dedans");
    classe.etats.forEach(nomEtat => {
      etats.ajouterEtatElement(obj, nomEtat);
    });
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
