import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { Action } from '../../models/compilateur/action';
import { Aide } from '../../models/commun/aide';
import { Auditeur } from '../../models/jouer/auditeur';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Compteur } from '../../models/compilateur/compteur';
import { CompteursUtils } from '../jeu/compteurs-utils';
import { ELocalisation } from '../../models/jeu/localisation';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { ListeEtats } from '../jeu/liste-etats';
import { Monde } from '../../models/compilateur/monde';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { Parametres } from '../../models/commun/parametres';
import { ProprieteElement } from '../../models/commun/propriete-element';
import { Regle } from '../../models/compilateur/regle';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { Voisin } from '../../models/jeu/voisin';

export class Generateur {

  public static genererJeu(monde: Monde, regles: Regle[], actions: Action[], compteurs: ElementGenerique[], aides: Aide[], parametres: Parametres): Jeu {

    let jeu = new Jeu();

    // DÉFINIR LES CLASSES
    // *******************
    jeu.classes = [];
    monde.classes.forEach(classe => {
      classe.id = jeu.nextID++;
      jeu.classes.push(classe);
    });

    // DÉFINIR LES FICHES D'AIDE
    // *************************
    jeu.aides = aides;

    // DÉFINIR LES PARAMÈTRES
    // *************************
    jeu.parametres = parametres;

    // // ÉCRAN
    // // ****************
    // let ecran = new Objet(jeu.nextID++, "écran", new GroupeNominal("l’", "écran"), ClassesRacines.Objet, 1, Genre.m, Nombre.s);
    // ecran.intituleS = ecran.intitule;
    // jeu.etats.ajouterEtatElement(ecran, EEtatsBase.invisible);
    // jeu.objets.push(ecran);

    // INFOS SUR LE JEU
    // ****************
    const jeuDansMonde = monde.speciaux.find(x => x.nom === 'jeu');
    if (jeuDansMonde) {
      jeu.titre = jeuDansMonde.proprietes.find(x => x.nom === "titre")?.valeur;
      jeu.auteur = jeuDansMonde.proprietes.find(x => x.nom === "auteur")?.valeur;
      jeu.auteurs = jeuDansMonde.proprietes.find(x => x.nom === "auteurs")?.valeur;
      jeu.version = jeuDansMonde.proprietes.find(x => x.nom === "version")?.valeur;
    }

    const siteWebDansMonde = monde.speciaux.find(x => x.nom === 'site' && x.epithete === 'web');
    if (siteWebDansMonde) {
      jeu.siteWebTitre = siteWebDansMonde.proprietes.find(x => x.nom === 'titre')?.valeur;
      jeu.siteWebLien = siteWebDansMonde.proprietes.find(x => x.nom === 'lien')?.valeur;
    }

    const licenceDansMonde = monde.speciaux.find(x => x.nom === 'licence');
    if (licenceDansMonde) {
      jeu.licenceTitre = licenceDansMonde.proprietes.find(x => x.nom === "titre")?.valeur;
      jeu.licenceLien = licenceDansMonde.proprietes.find(x => x.nom === "lien")?.valeur;
    }

    // INVENTAIRE
    // **********
    // (on l’ajoute pour pouvoir interragir avec)
    let inventaire = new Objet(jeu.nextID++, "inventaire", new GroupeNominal("l’", "inventaire", null), ClassesRacines.Special, 1, Genre.m, Nombre.s);
    inventaire.intituleS = inventaire.intitule;
    jeu.etats.ajouterEtatElement(inventaire, EEtatsBase.inaccessible);
    jeu.objets.push(inventaire);

    // AJOUTER LES LIEUX
    // ******************
    let premierIndexLieu = (jeu.nextID);
    monde.lieux.forEach(curEle => {

      // let titre = (curEle.determinant ? (" " + curEle.determinant) : "") + curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "");
      let titreSansAutoMaj = (curEle.determinant ? curEle.determinant : "") + curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "");
      // mettre majuscule en début d’intitulé (début de Phrase)
      let titre = titreSansAutoMaj[0].toUpperCase() + titreSansAutoMaj.slice(1);
      let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);

      let nouvLieu = new Lieu(jeu.nextID++, (curEle.nom.toLowerCase() + (curEle.epithete ? (" " + curEle.epithete.toLowerCase()) : "")), intitule, titre);
      nouvLieu.genre = curEle.genre;
      nouvLieu.nombre = curEle.nombre;
      nouvLieu.synonymes = (curEle.synonymes && curEle.synonymes.length) ? curEle.synonymes : null;
      // ajouter description éventuelle du lieu
      if (curEle.description) {
        nouvLieu.description = curEle.description;
      }
      // ajouter les états par défaut de la classe du lieu
      //  (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
      Generateur.attribuerEtatsParDefaut(nouvLieu.classe, nouvLieu, jeu.etats);
      // ajouter les états du lieu définis explicitements
      if (curEle.attributs) {
        curEle.attributs.forEach(attribut => {
          jeu.etats.ajouterEtatElement(nouvLieu, attribut);
        });
      }

      // parcourir les propriétés du lieu
      let nouvellesProp: ProprieteElement[] = []
      curEle.proprietes.forEach(pro => {
        // spécial: intitulé
        if (pro.nom == 'intitulé') {
          // TODO: gérer groupe nominal ?
          nouvLieu.intitule = new GroupeNominal(null, pro.valeur);
          if (nouvLieu.nombre == Nombre.p) {
            nouvLieu.intituleP = nouvLieu.intitule;
          } else {
            nouvLieu.intituleS = nouvLieu.intitule;
          }
          // autres propriétés
        } else {
          // fix ç de aperçu
          if (pro.nom == 'apercu') {
            pro.nom = 'aperçu';
          }
          // ajouter ou mettre à jour
          const proExistantDeja = nouvLieu.proprietes.find(x => x.nom == pro.nom);
          if (proExistantDeja) {
            proExistantDeja.valeur = pro.valeur;
          } else {
            nouvellesProp.push(pro);
          }
        }
      });
      nouvLieu.proprietes.push(...nouvellesProp);

      // description par défaut du lieu
      if (nouvLieu.description === null) {
        nouvLieu.description = "Vous êtes dans " + titreSansAutoMaj + ".";
      }

      jeu.lieux.push(nouvLieu);
    });

    // DÉFINIR LES VOISINS (LIEUX)
    // ****************************
    for (let index = 0; index < monde.lieux.length; index++) {
      const curEle = monde.lieux[index];
      Generateur.ajouterVoisin(jeu.lieux, curEle, (premierIndexLieu + index));
    }

    // PLACER LE JOUEUR
    // ****************
    let joueur = new Objet(jeu.nextID++, "joueur", new GroupeNominal("le ", "joueur"), ClassesRacines.Vivant, 1, Genre.m, Nombre.s);
    jeu.joueur = joueur;
    joueur.intituleS = joueur.intitule;
    joueur.synonymes = [
      new GroupeNominal("", "moi", null)
    ];
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.cache);
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.intact);
    // ajouter le joueur aux objets du jeu
    jeu.objets.push(joueur);
    // regarder si on a positionné le joueur dans le monde
    const joueurDansMonde = monde.speciaux.find(x => x.nom === 'joueur');
    if (joueurDansMonde) {
      if (joueurDansMonde.positionString) {
        const ps = PositionObjet.getPrepositionSpatiale(joueurDansMonde.positionString.position);
        const lieuID = Generateur.getLieuID(jeu.lieux, joueurDansMonde.positionString.complement, true);
        if (lieuID !== -1) {
          joueur.position = new PositionObjet(ps, EClasseRacine.lieu, lieuID);
        }
      }

      // parcourir les propriétés du joueur
      let nouvellesProp: ProprieteElement[] = []
      joueurDansMonde.proprietes.forEach(pro => {
        // spécial: intitulé
        if (pro.nom == 'intitulé') {
          // TODO: gérer groupe nominal ?
          joueur.intitule = new GroupeNominal(null, pro.valeur);
          if (joueur.nombre == Nombre.p) {
            joueur.intituleP = joueur.intitule;
          } else {
            joueur.intituleS = joueur.intitule;
          }
          // autres propriétés
        } else {
          // fix ç de aperçu
          if (pro.nom == 'apercu') {
            pro.nom = 'aperçu';
          }
          // ajouter ou mettre à jour
          const proExistantDeja = joueur.proprietes.find(x => x.nom == pro.nom);
          if (proExistantDeja) {
            proExistantDeja.valeur = pro.valeur;
          } else {
            nouvellesProp.push(pro);
          }
        }
      });
      joueur.proprietes.push(...nouvellesProp);

      // description du joueur par défaut
      if (joueur.description === null) {
        joueur.description = "(C’est vous)";
      }

      // ajouter attributs du joueur
      if (joueurDansMonde.attributs) {
        joueurDansMonde.attributs.forEach(attribut => {
          jeu.etats.ajouterEtatElement(joueur, attribut);
        });
      }
    }


    // PLACER LES ÉLÉMENTS DU JEU DANS LES LIEUX (ET DANS LA LISTE COMMUNE)
    // *********************************************************************
    monde.objets.forEach(curEle => {
      // ignorer le joueur (on l'a déjà ajouté)
      if (curEle.nom.toLowerCase() != 'joueur') {
        let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        let newObjet = new Objet(jeu.nextID++, (curEle.nom.toLowerCase() + (curEle.epithete ? (" " + curEle.epithete.toLowerCase()) : "")), intitule, curEle.classe, curEle.quantite, curEle.genre, curEle.nombre);

        // s'il s'agit d'un objet multiple, lui donner l'id de sa classe comme id initial
        if (curEle.determinant?.match(/^(un |une |des |\d+ )$/i)) {
          newObjet.idOriginal = newObjet.classe.id;
        }
        newObjet.capacites = curEle.capacites;
        newObjet.reactions = curEle.reactions;
        newObjet.synonymes = (curEle.synonymes && curEle.synonymes.length) ? curEle.synonymes : null;

        // ajouter description éventuelle de l’objet
        if (curEle.description) {
          newObjet.description = curEle.description;
        }

        // ajouter les états par défaut de la classe de l’objet
        //  (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
        Generateur.attribuerEtatsParDefaut(newObjet.classe, newObjet, jeu.etats);
        // ajouter les états de l'objet définis explicitements
        if (curEle.attributs) {
          curEle.attributs.forEach(attribut => {
            jeu.etats.ajouterEtatElement(newObjet, attribut);
          });
        }

        // attributs liés à la quantité d’objets
        if (newObjet.quantite == 1) {
          jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.unique);
        } else {
          // plusieurs exemplaires
          jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.multiple);
          // quantité illimitée
          if (newObjet.quantite == -1) {
            jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.illimite);
          }
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

        // parcourir les propriétés de l’objet
        let nouvellesProp: ProprieteElement[] = []
        curEle.proprietes.forEach(pro => {
          // spécial: intitulé
          if (pro.nom == 'intitulé') {
            // TODO: gérer groupe nominal ?
            newObjet.intitule = new GroupeNominal(null, pro.valeur);
            if (newObjet.nombre == Nombre.p) {
              newObjet.intituleP = newObjet.intitule;
            } else {
              newObjet.intituleS = newObjet.intitule;
            }
            // autres propriétés
          } else {
            // fix ç de aperçu
            if (pro.nom == 'apercu') {
              pro.nom = 'aperçu';
            }
            // ajouter ou mettre à jour
            const proExistantDeja = newObjet.proprietes.find(x => x.nom == pro.nom);
            if (proExistantDeja) {
              proExistantDeja.valeur = pro.valeur;
            } else {
              nouvellesProp.push(pro);
            }
          }
        });
        newObjet.proprietes.push(...nouvellesProp);

        // description par défaut
        if (newObjet.description === null) {
          // mettre un déterminant indéfini, sauf si intitulé sans déterminant.
          const detIndefini = newObjet.intitule.determinant ? ElementsJeuUtils.trouverDeterminantIndefini(newObjet) : "";
          if (newObjet.nombre == Nombre.p) {
            newObjet.description = "Ce sont " + detIndefini + newObjet.intitule.nom + (newObjet.intitule.epithete ? (" " + newObjet.intitule.epithete) : "") + ".";
          } else {
            newObjet.description = "C’est " + detIndefini + newObjet.intitule.nom + (newObjet.intitule.epithete ? (" " + newObjet.intitule.epithete) : "") + ".";
          }
        }

        // POSITION de l’élément
        // --   A. OBSTACLE (PORTE ou autre)
        if (ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.obstacle)) {
          Generateur.ajouterVoisin(jeu.lieux, curEle, newObjet.id);
        } else {
          // -- B. AUTRE TYPE D'OBJET
          if (curEle.positionString) {
            //console.error("@@ curEle.positionString=", curEle.positionString);

            // const localisation = Generateur.getLocalisation(curEle.positionString.position);
            const lieuID = Generateur.getLieuID(jeu.lieux, curEle.positionString.complement, false);

            // A) lieu trouvé
            if (lieuID !== -1) {
              newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), EClasseRacine.lieu, lieuID);

              // vu que l’objet est dans un lieu, il ni porté ni occupé donc il est disponible
              jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.disponible, true);

              // B) pas de lieu trouvé
            } else {

              // chercher un contenant ou un support
              const contenantSupport = Generateur.getContenantSupportOuCouvrant(jeu.objets, curEle.positionString.complement);
              // >> trouvé contenant
              if (contenantSupport) {

                // si le contenant est vivant, l’objet est « occupé »
                if (ClasseUtils.heriteDe(contenantSupport.classe, EClasseRacine.vivant)) {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.occupe, true);
                  // sinon l’objet est disponible
                } else {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.disponible, true);
                }

                // si le contenant est le joueur, l’objet est possédé
                if (contenantSupport === jeu.joueur) {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.possede, true);
                }

                newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curEle.positionString.position), EClasseRacine.objet, contenantSupport.id);
                // >> pas trouvé de contenant
              } else {
                console.warn("position élément jeu pas trouvé:", (curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "")), curEle.positionString);
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

    // GÉNÉRER LES COMPTEURS
    // *********************
    compteurs.forEach(cpt => {
      const curCompteur = new Compteur(cpt.nom, 0, new GroupeNominal(cpt.determinant, cpt.nom, cpt.epithete), ClassesRacines.Compteur);

      // vérifier les attributs du compteur
      cpt.attributs.forEach(curAttribut => {
        // valeur initialisation
        const initialisation = ExprReg.xInitialiseA.exec(curAttribut)
        if (initialisation) {
          // vérifier s’il s’agit d’un nombre
          curCompteur.valeur = CompteursUtils.intituleNombreVersNombre(initialisation[1]);
        }
      });

      jeu.compteurs.push(curCompteur);
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

      if (localisation === ELocalisation.inconnu || lieuTrouveID === -1) {
        console.log("positionString pas trouvé:", elVoisin.positionString);
      } else {

        // on met la classe racine lieu, porte ou obstacle:
        let classeRacine: string;
        // lieu
        if (ClasseUtils.heriteDe(elVoisin.classe, EClasseRacine.lieu)) {
          classeRacine = EClasseRacine.lieu;
          // porte
        } else if (ClasseUtils.heriteDe(elVoisin.classe, EClasseRacine.porte)) {
          classeRacine = EClasseRacine.porte;
          // autre type d’obstacle
        } else {
          classeRacine = EClasseRacine.obstacle;
        }

        // ajouter au lieu trouvé, le voisin elVoisin
        const opposeVoisin = new Voisin(idElVoisin, classeRacine, localisation);
        const lieu = lieux.find(x => x.id == lieuTrouveID);
        lieu.voisins.push(opposeVoisin);

        // le lieu trouvé, est le voisin du lieu elVoisin.
        if (classeRacine == EClasseRacine.lieu) {
          // ajouter le lieu trouvé aux voisins de elVoisin
          const newVoisin = new Voisin(lieuTrouveID, classeRacine, this.getOpposePosition(localisation));
          const lieuTrouve = lieux.find(x => x.id === idElVoisin);
          lieuTrouve.voisins.push(newVoisin);
        // la porte trouvée, est également visible depuis le lieu voisin à priori…
        } else if (classeRacine == EClasseRacine.porte) {
          // todo: rendre la porte visible chez le voisin également
        }

      }
    } else {
      // ???
    }
  }

  static getAuditeur(regle: Regle) {
    let auditeur = new Auditeur();
    auditeur.type = regle.typeRegle;
    auditeur.evenements = regle.evenements;
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
    const intituleLieuLower = intituleLieu.toLowerCase();
    lieux.forEach(lieu => {
      // rem: le nom d’un lieu est toujours un minuscule, pas besoin de forcer ici
      if (lieu.nom == intituleLieuLower) {
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

  /** Trouver l’objet qui fait office de contenant (dans), support (sur) ou couvrant (sous) */
  static getContenantSupportOuCouvrant(objets: Objet[], nomObjet: string) {

    // patch pour l’inventaire qui est en réalité le joueur:
    if (nomObjet === 'inventaire') {
      nomObjet = 'joueur';
    }

    // TODO: check si contenant ou support ?
    // mais quid pour « sous » ?

    let trouve: Objet = null;

    const nomObjetLower = nomObjet.toLowerCase();

    objets.forEach(el => {
      // rem: le nom d’un Objet est toujours en lower case c’est pourquoi on ne le force pas ici.
      if (el.nom === nomObjetLower) {
        trouve = el;
      }
    });

    return trouve;
  }

  /**
   * Atribuer les états par défaut de l’objet sur base de la classe spécifiée.
   * Si la classe à un parent, on commence par attribuer les états par défaut du parent.
   */
  static attribuerEtatsParDefaut(classe: Classe, ele: ElementJeu, etats: ListeEtats) {
    // commencer par la classe parent (s’il y en a)
    if (classe.parent) {
      Generateur.attribuerEtatsParDefaut(classe.parent, ele, etats);
    }
    // attribuer les états par défaut de la classe
    classe.etats.forEach(nomEtat => {
      etats.ajouterEtatElement(ele, nomEtat);
    });
  }

  /**
   * Obtenir la localisation correspondante.
   */
  static getLocalisation(strPosition: string) {

    strPosition = strPosition
      .trim()
      .replace(/^((à (l’|l')|en |au( |\-)))/, "")
      .replace(/(du|de( la| l'| l’)?|des|le|la|les|l’|l')$/, "")
      .trim();

    let retVal = ELocalisation.inconnu;
    switch (strPosition) {
      case "bas":
      case "dessous":
        retVal = ELocalisation.bas;
        break;
      case "haut":
      case "dessus":
        retVal = ELocalisation.haut;
        break;
      case "extérieur":
      case "exterieur":
      case "hors":
        retVal = ELocalisation.exterieur;
        break;
      case "intérieur":
      case "intérieur":
      case "dans":
        retVal = ELocalisation.interieur;
        break;
      case "est":
        retVal = ELocalisation.est;
        break;
      case "ouest":
        retVal = ELocalisation.ouest;
        break;
      case "nord":
        retVal = ELocalisation.nord;
        break;
      case "sud":
        retVal = ELocalisation.sud;
        break;

      default:
        console.log("Localisation pas connue: ", strPosition);
        break;
    }

    return retVal;
  }

  static getOpposePosition(localisation: ELocalisation) {
    switch (localisation) {

      case ELocalisation.bas:
        return ELocalisation.haut;

      case ELocalisation.haut:
        return ELocalisation.bas;

      case ELocalisation.est:
        return ELocalisation.ouest;

      case ELocalisation.ouest:
        return ELocalisation.est;

      case ELocalisation.nord:
        return ELocalisation.sud;

      case ELocalisation.sud:
        return ELocalisation.nord;

      case ELocalisation.interieur:
        return ELocalisation.exterieur;

      case ELocalisation.exterieur:
        return ELocalisation.interieur;

      default:
        return ELocalisation.inconnu;
    }
  }

}
