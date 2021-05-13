import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { Capacite } from '../../models/commun/capacite';
import { ClasseUtils } from './classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Compteur } from '../../models/compilateur/compteur';
import { Correspondance } from '../jeu/correspondance';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { MotUtils } from './mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';
import { Propriete } from '../../models/commun/propriete';
import { Voisin } from '../../models/jeu/voisin';
import { stringify } from '@angular/compiler/src/util';

export class ElementsJeuUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) { }

  static calculerIntituleGenerique(ceci: Intitule, forcerMajuscule: boolean) {
    let retVal = ceci?.nom ?? "???";
    if (ceci.intitule) {

      let determinant = (ceci.intitule.determinant ? ceci.intitule.determinant : "");
      let nom = ceci.intitule.nom;
      let epithete = (ceci.intitule.epithete ? (" " + ceci.intitule.epithete) : "");

      retVal = determinant + nom + epithete;
    }
    // mettre majuscule en début d’intitulé (début de Phrase)
    if (forcerMajuscule) {
      retVal = retVal[0].toUpperCase() + retVal.slice(1);
    }
    return retVal;
  }

  calculerIntituleElement(ceci: ElementJeu, forcerMajuscule: boolean, forcerConnu: boolean, forcerNombre: Nombre = null) {
    let retVal = ceci?.nom ?? "???";
    if (ceci.intitule) {

      let determinant = ceci.intitule.determinant ?? "";
      let nom = ceci.intitule.nom;
      let epithete = ceci.intitule.epithete ?? "";

      // indénombrable
      if (this.jeu.etats.possedeEtatElement(ceci, EEtatsBase.indenombrable, this)) {
        if (nom.match(/^(a|e|é|è|ê|i|o|u|y)(.+)/)) {
          determinant = "de l’";
        } else {
          if (ceci.genre === Genre.f) {
            determinant = "de la ";
          } else {
            determinant = "du ";
          }
        }
        nom = ceci.intituleS.nom;
        epithete = ceci.intituleS.epithete ?? "";
        // dénombrable
      } else {
        // 1 exemplaire => un/une ou le/la selon le contexte
        if (forcerNombre === Nombre.s || (forcerNombre !== Nombre.p && ceci.quantite == 1)) {
          nom = ceci.intituleS.nom;
          epithete = ceci.intituleS.epithete ?? "";
          // n’ajouter un déterminant que si cet élément possède un déterminant
          // (sinon c’est que c’est un nom propre…)
          if (ceci.intitule.determinant) {
            // il existe de multiples exemplaires
            if (this.jeu.etats.possedeEtatElement(ceci, EEtatsBase.multiple, this)) {
              if (ceci.genre === Genre.f) {
                determinant = "une ";
              } else {
                determinant = "un ";
              }

              // il n’existe qu’un seul exemplaire
            } else {

              // si l’élément est encore intact
              if (!forcerConnu && this.jeu.etats.possedeEtatIdElement(ceci, this.jeu.etats.intactID)) {
                if (ceci.genre === Genre.f) {
                  determinant = "une ";
                } else {
                  determinant = "un ";
                }
                // si l’élément a déjà été déplacer ou modifié
              } else {
                // commence par une voyelle
                if (nom.match(/^(a|e|é|è|ê|i|o|u|y)(.+)/)) {
                  determinant = "l’";
                  // commence par une consonne
                } else {
                  if (ceci.genre === Genre.f) {
                    determinant = "la ";
                  } else {
                    determinant = "le ";
                  }
                }
              }

            }
          }
        }
        // quantité infinie => des
        else if (ceci.quantite == -1 || forcerNombre === Nombre.p) {
          determinant = "des ";
          nom = ceci.intituleP.nom;
          epithete = ceci.intituleP.epithete ?? "";
          // plusieurs exemplaires => nombre d’exemplaire
        } else {
          determinant = (ceci.quantite + " ");
          nom = ceci.intituleP.nom;
          epithete = ceci.intituleP.epithete ?? "";
        }
      }

      retVal = determinant + nom + epithete;
    }
    // mettre majuscule en début d’intitulé (début de Phrase)
    if (forcerMajuscule) {
      retVal = retVal[0].toUpperCase() + retVal.slice(1);
    }
    return retVal;
  }

  static trouverDeterminantIndefini(el: ElementJeu): string {

    switch (el.nombre) {
      // pluriel
      case Nombre.p:
        return "des ";

      // singulier
      case Nombre.s:
        switch (el.genre) {
          // féminin
          case Genre.f:
            return "une ";

          // masculin / neutre
          case Genre.m:
          case Genre.n:
            return "un ";
        }

      // indéfini
      case Nombre.i:
        switch (el.genre) {
          // féminin
          case Genre.f:
            if (el.intitule.nom.match(/^{aeiouy}.*/)) {
              return "de l’"
            } else {
              return "de la "
            }

          // masculin
          case Genre.m:
            if (el.intitule.nom.match(/^{aeiouy}.*/)) {
              return "de l’"
            } else {
              return "du "
            }

          // neutre
          case Genre.n:
            return "de l’";
        }
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
          if (cible.toLocaleLowerCase().trim() === curCible) {
            retVal = true;
          }
        }
      });
      return retVal;
    } else {
      console.error("portePossedeCapaciteAction >> ElementJeu pas défini.");
    }
  }


  get curLieu() {
    // TODO: retenir le lieu
    const lieuID = this.getLieuObjet(this.jeu.joueur);
    const retVal: Lieu = this.jeu.lieux.find(x => x.id === lieuID);
    if (retVal) {
      // le lieu a été visité par le joueur
      this.jeu.etats.ajouterEtatElement(retVal, EEtatsBase.visite, true);
    } else {
      console.warn("Pas trouvé la curLieu:", lieuID);
    }
    return retVal;
  }

  majAdjacenceLieux() {
    // console.warn("majAdjacenceLieux");
    this.jeu.lieux.forEach(lieu => {
      this.majAdjacenceLieu(lieu);
    });
  }

  private majAdjacenceLieu(lieu: Lieu) {
    // le lieu est adjacent (au lieu actuel, curLieu) si il est son voisin.
    // (même si séparé par une porte fermée et invisible !)
    const voisinTrouve = this.curLieu.voisins.find(x => x.type == EClasseRacine.lieu && x.id == lieu.id);
    // adjacent
    if (voisinTrouve) {
      this.jeu.etats.ajouterEtatElement(lieu, EEtatsBase.adjacent, true);
    } else {
      this.jeu.etats.retirerEtatElement(lieu, EEtatsBase.adjacent, true);
    }
  }

  majPresenceDesObjets() {
    this.jeu.objets.forEach(obj => {
      this.majPresenceObjet(obj);
    });
  }

  majPresenceObjet(obj: Objet) {
    // console.log("majPresenceObjet: ", obj.nom);
    // les objets possédés sont présents
    if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.possedeID)) {
      this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.present, true);
      // les objets non possedes peuvent être visibles seulement si positionnés dans le lieu actuel
    } else if (obj.position && this.getLieuObjet(obj) === this.curLieu.id) {
      this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.present, true);
    } else if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.porte)) {
      // les portes adjacentes au lieu actuel sont présentes
      if (this.curLieu.voisins.some(x => x.id === obj.id)) {
        this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.present, true);
      } else {
        this.jeu.etats.retirerEtatElement(obj, EEtatsBase.present, true);
      }
    } else {
      // les autres objets ne sont pas présents
      this.jeu.etats.retirerEtatElement(obj, EEtatsBase.present, true);
    }
  }


  getLieuObjet(obj: Objet): number {
    // objet pas positionné
    if (obj.position == null) {
      return null;
      // objet dans un lieu
    } else if (obj.position.cibleType === EClasseRacine.lieu) {
      return obj.position.cibleId;
      // objet possédé (par le joueur)
    } else if (obj.position.cibleId === this.jeu.joueur.id) {
      // objet dans le lieu actuel puisque possédé par le joueur
      return this.curLieu.id;
    } else {
      // objet dans un contenant qui est dans un lieu
      const contenant = this.jeu.objets.find(x => x.id === obj.position.cibleId);
      if (contenant) {

        if (obj.id == contenant.id) {
          throw new Error("getLieuObjet >>> l’objet est positionné sur lui même !\n" + JSON.stringify(obj));
        } else {
          return this.getLieuObjet(contenant);
        }
        // objet porté par le joueur => pas de lieu
      } else {
        console.error("getLieuObjet: contenant pas trouvé pour", obj);
        return null;
      }
    }
  }

  /**
   * Récupérer un lieu sur base de son ID.
   * Retourne null si pas trouvé.
   * @param id 
   */
  getLieu(id: number) {
    return this.jeu.lieux.find(x => x.id === id);
  }

  /**
   * Récupérer l’ID du voisin dans la direction indiquée. (Retourne -1 si pas trouvé)
   * @param loc 
   * @param type 
   */
  getVoisinDirectionID(loc: Localisation | ELocalisation, type: EClasseRacine) {
    let voisin: Voisin = null;
    if (loc instanceof Localisation) {
      voisin = this.curLieu.voisins.find(x => x.type === type && x.localisation === loc.id);
    } else {
      voisin = this.curLieu.voisins.find(x => x.type === type && x.localisation === loc);
    }
    return voisin ? voisin.id : -1;
  }

  /**
   * Récupérer les lieux voisins visibles depuis le lieu spécifié.
   * @param loc 
   * @param type 
   */
  getLieuxVoisinsVisibles(lieu: Lieu) {
    let voisinsVisibles: Voisin[] = [];
    let voisin: Voisin = null;
    const allLieuxVoisins = lieu.voisins.filter(x => x.type == EClasseRacine.lieu);

    // s’il y a des voisins
    if (allLieuxVoisins.length != 0) {
      // pour chaque voisin vérifier s’il y a une porte dans sa direction
      allLieuxVoisins.forEach(voisin => {
        const curVoisinPorte = lieu.voisins.find(x => x.type == EClasseRacine.porte && x.localisation == voisin.localisation);
        // il y a une porte
        if (curVoisinPorte) {
          // retrouver la porte
          const curPorte = this.getObjet(curVoisinPorte.id);
          // si la porte est ouverte ou visible, on voit le voisin
          if (this.jeu.etats.possedeEtatIdElement(curPorte, this.jeu.etats.ouvertID) || this.jeu.etats.estVisible(curPorte, this)) {
            voisinsVisibles.push(voisin);
          }
          // il n’y a pas de porte
        } else {
          voisinsVisibles.push(voisin);
        }
      });
    }

    return voisinsVisibles;
  }

  getObjet(id: number) {
    return this.jeu.objets.find(x => x.id === id);
  }

  getPrecisionTypeElement(typeElement: string) {

  }

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  //  TROUVER CORRESPONDANCE
  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  /**
   * Trouver des correspondances dans le jeu pour le sujet spécifié (lieu, objet, direction, …).
   */
  trouverCorrespondance(sujet: GroupeNominal, prioriteObjetsPresents: boolean, prioriteLieuxAdjacents: boolean): Correspondance {
    let cor: Correspondance = null;
    if (sujet) {
      cor = new Correspondance();
      cor.intitule = new Intitule(sujet.nom, sujet, ClassesRacines.Intitule);
      // 1. Chercher dans les directions.
      cor.localisation = ElementsJeuUtils.trouverLocalisation(sujet);

      if (cor.localisation !== null) {
        cor.nbCor = 1;
      } else {
        // 2. Chercher dans la liste des lieux.
        cor.lieux = this.trouverLieu(sujet, prioriteLieuxAdjacents);
        // ajouter les lieux aux éléments
        if (cor.lieux.length > 0) {
          cor.elements = cor.elements.concat(cor.lieux);
          cor.nbCor += cor.lieux.length;
        }

        // 3. Chercher parmis les objets

        // déterminer si le mot à chercher est au pluriel
        const nombre = sujet.determinant ? MotUtils.getNombre(sujet.determinant) : (MotUtils.estFormePlurielle(sujet.nom) ? Nombre.p : Nombre.s);

        cor.objets = this.trouverObjet(sujet, prioriteObjetsPresents, nombre);
        // ajouter les objets aux éléments
        if (cor.objets.length > 0) {
          cor.elements = cor.elements.concat(cor.objets);
          cor.nbCor += cor.objets.length;
        }
        // 4. Chercher parmais les compteurs
        cor.compteurs = this.trouverCompteur(sujet);
        cor.nbCor += cor.compteurs.length;
      }
      if (this.verbeux) {
        console.log(" >>>> éléments trouvés:", cor.elements);
      }

      // console.log(" >>>> objets trouvés:", cor.objets);
      // console.log(" >>>> lieux trouvés:", cor.lieux);
      // console.log(" >>>> intitulé:", cor.intitule);
    }

    return cor;
  }

  static trouverLocalisation(sujet: GroupeNominal) {

    // console.log("$$$ trouverLocalisation sujet=", sujet);


    switch (sujet.nom) {
      case 'sud':
        return Localisation.Sud;

      case 'nord':
        return Localisation.Nord;

      case 'est':
        return Localisation.Est;

      case 'ouest':
        return Localisation.Ouest;

      case 'bas':
        return Localisation.Bas;

      case 'haut':
        return Localisation.Haut;

      case 'dessus':
      case 'au-dessus':
        return Localisation.Haut;

      case 'dessous':
      case 'au-dessous':
        return Localisation.Bas;

      case 'exterieur':
      case 'extérieur':
      case 'dehors':
      case 'hors':
        return Localisation.Exterieur;

      case 'interieur':
      case 'intérieur':
      case 'dedans':
      case 'dans':
        return Localisation.Interieur;

      default:
        return null;
        break;
    }

  }


  /**
   * Retrouver un objet parmis tous les objets sur base de son intitulé.
   * Remarque: Il peut y avoir plus d’une correspondance.
   * @param nombre: Si indéfini on recherche dans intitulé par défaut, sinon on tient compte du genre pour recherche l’intitulé.
   */
  trouverObjet(sujet: GroupeNominal, prioriteObjetsPresents: boolean, nombre: Nombre = Nombre.i): Objet[] {

    let objetsTrouves: Objet[] = null;
    const sujetNom = sujet.nom.toLowerCase();
    const sujetEpithete = sujet.epithete?.toLowerCase();

    // chercher parmis les objets présents
    const objetsPresents = this.jeu.objets.filter(x => x.etats.includes(this.jeu.etats.presentID));
    // console.warn("objetsPresents=", objetsPresents);
    objetsTrouves = this.suiteTrouverObjet(objetsPresents, sujetNom, sujetEpithete, nombre);
    // console.warn("objetsTrouves=", objetsTrouves);

    // si rien trouvé dans les objets présents ou si pas priorité présents, chercher dans les autres
    if (objetsTrouves.length === 0 || !prioriteObjetsPresents) {
      const objetsNonPresents = this.jeu.objets.filter(x => !x.etats.includes(this.jeu.etats.presentID));
      // console.warn("objetsNonPresents=", objetsNonPresents, "\nsujetNom=", sujetNom, "\nsujetEpithete=", sujetEpithete, "\nnombre=", nombre);
      objetsTrouves = objetsTrouves.concat(this.suiteTrouverObjet(objetsNonPresents, sujetNom, sujetEpithete, nombre));
      // console.warn("objetsTrouves=", objetsTrouves);
    }

    return objetsTrouves;
  }

  private suiteTrouverObjet(objets: Objet[], sujetNom: string, sujetEpithete: string, nombre: Nombre) {

    let retVal: Objet[] = [];

    objets.forEach(obj => {
      let dejaAjoute = false;
      // A. regarder dans l'intitulé
      switch (nombre) {

        case Nombre.i:
          if (obj.intitule.nom.toLowerCase() === sujetNom && (sujetEpithete === obj.intitule.epithete?.toLowerCase())) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;

        case Nombre.s:
          if (obj.intituleS?.nom?.toLowerCase() === sujetNom && (sujetEpithete === obj.intituleS?.epithete?.toLowerCase())) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;

        case Nombre.p:
          if (obj.intituleP?.nom?.toLowerCase() === sujetNom && (sujetEpithete == obj.intituleP?.epithete?.toLowerCase())) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;
      }

      // B. Regarder dans les synonymes (si pas déjà ajouté)
      if (!dejaAjoute && obj.synonymes) {
        obj.synonymes.forEach(synonyme => {
          if (synonyme.nom.toLowerCase() === sujetNom && (sujetEpithete == synonyme.epithete?.toLowerCase())) {
            retVal.push(obj);
          }
        });
      }

    });

    return retVal;
  }

  /**
   * Retrouver un compteur parmis tous les compteurs sur base de son intitulé.
   * Remarque: Il peut y avoir plus d’une correspondance.
   */
  trouverCompteur(sujet: GroupeNominal): Compteur[] {

    let compteursTrouves: Compteur[] = [];
    const sujetNom = sujet.nom.toLowerCase();
    const sujetEpithete = sujet.epithete?.toLowerCase();

    this.jeu.compteurs.forEach(
      cpt => {
        if (cpt.intitule.nom.toLowerCase() === sujetNom && (sujetEpithete === cpt.intitule.epithete?.toLowerCase())) {
          compteursTrouves.push(cpt);
        }
      }
    );

    return compteursTrouves;
  }

  /**
   * Retrouver un lieu parmis tous les lieux sur base de son intitulé.
   * Remarque: Il peut y avoir plus d’une correspondance.
   */
  trouverLieu(sujet: GroupeNominal, prioriteLieuxAdjacents: boolean): Lieu[] {

    let lieuxTrouves: Lieu[] = null;
    const sujetNom = sujet.nom.toLowerCase();
    const sujetEpithete = sujet.epithete?.toLowerCase();

    // chercher parmis les objets présents
    const lieuxAdjacents = this.jeu.lieux.filter(x => x.etats.includes(this.jeu.etats.adjacentID) || this.curLieu.id == x.id);
    // console.warn("lieuxAdjacents=", lieuxAdjacents);
    lieuxTrouves = this.suiteTrouverLieu(lieuxAdjacents, sujetNom, sujetEpithete);
    // console.warn("lieuxTrouves=", lieuxTrouves);

    // si rien trouvé dans les objets présents ou si pas priorité présents, chercher dans les autres
    if (lieuxTrouves.length === 0 || !prioriteLieuxAdjacents) {
      const lieuxNonAdjacents = this.jeu.lieux.filter(x => !x.etats.includes(this.jeu.etats.adjacentID) && this.curLieu.id != x.id);
      lieuxTrouves = lieuxTrouves.concat(this.suiteTrouverLieu(lieuxNonAdjacents, sujetNom, sujetEpithete));
      // console.warn("lieuxTrouves=", lieuxTrouves);
    }

    return lieuxTrouves;
  }


  private suiteTrouverLieu(lieux: Lieu[], sujetNom: string, sujetEpithete: string): Lieu[] {

    let retVal: Lieu[] = [];

    lieux.forEach(li => {
      // A. regarder dans l'intitulé du lieu
      if (li.intitule.nom.toLowerCase() === sujetNom && (li.intitule.epithete?.toLowerCase() == sujetEpithete)) {
        retVal.push(li);
      } else {
        // B. Regarder dans les synonymes du lieu
        if (li.synonymes) {
          li.synonymes.forEach(synonyme => {
            if (synonyme.nom.toLowerCase() === sujetNom && (synonyme.epithete?.toLowerCase() == sujetEpithete)) {
              retVal.push(li);
            }
          });
        }
      }
    });

    return retVal;
  }

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  //  CONTENU
  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  /**
   * Renvoyer true si ceci contient au moins un objet.
   * TODO: tenir compte de la visibilité des objets.
   * @param ceci objet ou lieu.
   */
  public verifierContientObjet(ceci: ElementJeu): boolean {
    // console.warn("verifierContientObjet: ceci=", ceci);
    let retVal = false;

    // si on vérifier le contenu de l’inventaire, on veut en réaliter vérifier le contenu du joueur
    if (ceci.nom === 'inventaire') {
      ceci = this.jeu.joueur;
    }

    if (ceci) {
      let els: Objet[] = null;
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id);
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id);
      } else {
        console.error("verifierContientObjet: classe racine pas pris en charge:", ceci.classe);
      }
      if (els) {
        retVal = els.length !== 0;
      }
    } else {
      console.error("verifierContientObjet ceci est null.");
    }
    return retVal;
  }

  /**
 * 
 * Retrouver les objets contenus dans ceci.
 * En cas d’erreur null est retourné plutôt qu’on tableau d’objets.
 * @param ceci 
 * @param inclureObjetsCachesDeCeci 
 * @param preposition (dans, sur, sous)
 */
  public trouverContenu(ceci: ElementJeu, inclureObjetsCachesDeCeci: boolean, inclureObjetsNonVisibles: boolean, preposition: PrepositionSpatiale) {
    let objets: Objet[] = null;
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        // retrouver les objets {contenus dans/posés sur} cet objet
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.pre == preposition && x.position.cibleId === ceci.id);

        // si on ne doit pas lister les objets non visibles, garder uniquement les objets visibles.
        if (!inclureObjetsNonVisibles) {
          objets = objets.filter(x => this.jeu.etats.estVisible(x, this));
        }
        // si on ne doit pas lister les objets cachés, garder uniqument les objets non cachés
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci objet=", ceci);
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        // retrouver les objets présents dans le lieu
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id);

        // si on ne doit pas lister les objets non visibles, garder uniquement les objets visibles.
        if (!inclureObjetsNonVisibles) {
          objets = objets.filter(x => this.jeu.etats.estVisible(x, this));
        }
        // si on ne doit pas lister les objets cachés, garder uniqument les objets non cachés
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci lieu=", ceci);
      } else {
        console.error("executerAfficherContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return objets;
  }

  /**
   * Renvoyer le contenu d'un objet ou d'un lieu.
   */
  public obtenirContenu(ceci: ElementJeu, preposition: PrepositionSpatiale): Objet[] {
    let els: Objet[] = null;
    if (ceci) {
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position
          && x.position.pre == preposition
          && x.position.cibleType === EClasseRacine.objet
          && x.position.cibleId === ceci.id);
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position
          && x.position.cibleType === EClasseRacine.lieu
          && x.position.cibleId === ceci.id);
      } else {
        console.error("obtenirContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return els;
  }

  /**
 * Savoir si le contenant spécifié (lieu/contenant/support) contient déjà un exemplaire de l’objet.
 * @param objet objet à tester.
 * @param preposition position de l’objet par rapport au contenant (dans/sur/sous)
 * @param contenant contenant à tester.
 * @returns objet déjà contenu si trouvé.
 */
  public getExemplaireDejaContenu(objet: Objet, preposition: PrepositionSpatiale, contenant: ElementJeu): Objet {
    let retVal: Objet = null;

    let idOriginal = objet.idOriginal ?? objet.id;

    const contenuContenant = this.obtenirContenu(contenant, preposition);

    retVal = contenuContenant.find(x => x.id === idOriginal || x.idOriginal === idOriginal) ?? null;

    return retVal;
  }

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  //  COPIE D’OBJETS
  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  /**
   * Dupliquer l’objet.
   * 
   * Remarques:
   *  - L’objet n’est pas automatiquement ajouté aux objets du jeu.
   *  - L’id du nouvel objet est défini à 0 et l’ID de l’objet original est complété.
   *  - La quantité de la copie est définie à 1.
   *  - Les propriétés, capacités et états sont copiés égalements.
   *  - Le nombre d’affichage des description, aperçu et texte est copié également.
   *  - Les objets contenus ne sont PAS copiés.
   *  - La position de l’objet n’est PAS copiée.
   * 
   * @param original objet à dupliquer.
   * @returns copie de l’objet.
   */
  copierObjet(original: Objet) {
    let copie = new Objet(0, original.nom, original.intitule, original.classe, 1, original.genre, Nombre.s);
    copie.description = original.description;
    copie.apercu = original.apercu;
    copie.texte = original.texte;
    copie.intituleS = original.intituleS;
    copie.intituleP = original.intituleP;
    // retrouver id de l’objet original
    copie.idOriginal = original.idOriginal ? original.idOriginal : original.id;

    // copier le nombre d’affichage de la description
    copie.nbAffichageDescription = original.nbAffichageDescription;
    copie.nbAffichageApercu = original.nbAffichageApercu;
    copie.nbAffichageTexte = original.nbAffichageTexte;

    // copier les états
    original.etats.forEach(etat => {
      copie.etats.push(etat);
    });
    // enlever l’état illimité
    this.jeu.etats.retirerEtatElement(copie, EEtatsBase.illimite, false);

    // copier les capacités
    original.capacites.forEach(cap => {
      copie.capacites.push(new Capacite(cap.verbe, cap.complement));
    });

    // copier les propriétés
    original.proprietes.forEach(prop => {
      copie.proprietes.push(new Propriete(prop.nom, prop.type, prop.valeur));
    });


    // TODO: faut-il copier le contenu ?
    return copie;
  }

}