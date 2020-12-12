import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';

import { ClasseUtils } from './classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Correspondance } from '../jeu/correspondance';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Localisation } from '../../models/jeu/localisation';
import { MotUtils } from './mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';

export class ElementsJeuUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) { }

  static calculerIntitule(ceci: Intitule) {
    let retVal = ceci?.nom ?? "???";
    if (ceci.intitule) {
      retVal = (ceci.intitule.determinant ? ceci.intitule.determinant : "") + ceci.intitule.nom + (ceci.intitule.epithete ? (" " + ceci.intitule.epithete) : "");
    }
    return retVal;
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

  static copierObjet(original: Objet) {
    // Rem: La quantité est toujours à 1, et le nombre est donc toujours singulier.
    // Rem: L’id reste le même que celui de l’original.
    // TODO: attribuer un nouvel id aux clones ?
    let retVal = new Objet(original.id, original.nom, original.intitule, original.classe, 1, original.genre);
    retVal.description = original.description;
    retVal.apercu = original.apercu;
    // retVal.intituleF = original.intituleF;
    // retVal.intituleM = original.intituleM;
    retVal.intituleS = original.intituleS;
    retVal.intituleP = original.intituleP;

    // TODO: faut-il copier le nombre d’affichage de la description ?
    retVal.nbAffichageDescription = original.nbAffichageDescription;
    retVal.nbAffichageApercu = original.nbAffichageApercu;

    // TODO: copier les états
    // TODO: copier les capacités
    // TODO: copier les propriétés
    // TODO: faut-il copier l’inventaire ?
    return retVal;
  }

  get curLieu() {
    // TODO: retenir le lieu
    const lieuID = this.getLieuObjet(this.jeu.joueur);
    const retVal = this.jeu.lieux.find(x => x.id === lieuID);
    if (retVal) {
      // le lieu a été visité par le joueur
      retVal.visite = true;
    } else {
      console.warn("Pas trouvé la curLieu:", lieuID);
    }
    return retVal;
  }

  majPresenceDesObjets() {
    this.jeu.objets.forEach(obj => {
      this.majPresenceObjet(obj);
    });
  }

  majPresenceObjet(obj: Objet) {
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
      // objet contenu dans un autre objet
      return null;
    } else {
      // objet dans un contenant qui est dans un lieu
      const contenant = this.jeu.objets.find(x => x.id === obj.position.cibleId);
      if (contenant) {
        return this.getLieuObjet(contenant);
        // objet porté par le joueur => pas de lieu
      } else {
        console.error("getLieuObjet: contenant pas trouvé pour", obj);
        return null;
      }
    }
  }

  getLieu(id: number) {
    return this.jeu.lieux.find(x => x.id === id);
  }

  getVoisins(loc: Localisation, type: EClasseRacine) {
    let found = this.curLieu.voisins.find(x => x.type === type && x.localisation === loc);
    return found ? found.id : -1;
  }

  getObjet(id: number) {
    return this.jeu.objets.find(x => x.id === id);
  }

  getPrecisionTypeElement(typeElement: string) {

  }

  getObjetsQuiSeTrouventLa(position: string): Objet[] {
    let retVal: Objet[] = [];

    if (position === 'ici') {
      this.jeu.objets.forEach(obj => {
        if (obj.position && obj.position.cibleType === EClasseRacine.lieu && obj.position.cibleId === this.curLieu.id) {
          retVal.push(obj);
        }
      });
    } else {
      console.warn("getObjetsQuiSeTrouventLa >>> position pas encore gérée:", position);
    }
    return retVal;
  }

  trouverCorrespondance(sujet: GroupeNominal): Correspondance {
    let cor: Correspondance = null;
    if (sujet) {
      cor = new Correspondance();
      cor.intitule = new Intitule(sujet.nom, sujet, ClassesRacines.Intitule);
      // 1. Chercher dans les directions.
      cor.localisation = this.trouverLocalisation(sujet);

      if (cor.localisation !== Localisation.inconnu) {
        cor.nbCor = 1;
      } else {
        // 2. Chercher dans la liste des lieux.
        cor.lieux = this.trouverLieu(sujet);
        // ajouter les lieux aux éléments
        if (cor.lieux.length > 0) {
          cor.elements = cor.elements.concat(cor.lieux);
          cor.nbCor += cor.lieux.length;
        }

        // 3. Chercher parmis les objets
        const nombre = sujet.determinant ? MotUtils.getNombre(sujet.determinant) : Nombre.i;
        cor.objets = this.trouverObjet(sujet, nombre);
        // ajouter les objets aux éléments
        if (cor.objets.length > 0) {
          cor.elements = cor.elements.concat(cor.objets);
          cor.nbCor += cor.objets.length;
        }
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

  trouverLocalisation(sujet: GroupeNominal) {

    switch (sujet.nom) {
      case 'sud':
        return Localisation.sud;

      case 'nord':
        return Localisation.nord;

      case 'est':
        return Localisation.est;

      case 'ouest':
        return Localisation.ouest;

      case 'bas':
        return Localisation.bas;

      case 'haut':
        return Localisation.haut;

      case 'dessus':
        return Localisation.dessus;

      case 'dessous':
        return Localisation.dessous;

      case 'exterieur':
        return Localisation.exterieur;

      case 'interieur':
        return Localisation.interieur;

      default:
        return Localisation.inconnu;
        break;
    }

  }


  /**
   * Retrouver un objet parmis tous les objets sur base de son intitulé.
   * Si pas d’épithète précisé, on ne regarde que le nom.
   * Remarque: Il peut y avoir plus d’une correspondance.
   * @param nombre: Si indéfini on recherche dans intitulé par défaut, sinon on tient compte du genre pour recherche l’intitulé.
   */
  trouverObjet(sujet: GroupeNominal, nombre: Nombre = Nombre.i): Objet[] {

    let retVal: Objet[] = [];

    this.jeu.objets.forEach(obj => {
      let dejaAjoute = false;
      // A. regarder dans l'intitulé
      switch (nombre) {
        case Nombre.i:
          if (obj.intitule.nom === sujet.nom && (!sujet.epithete || sujet.epithete === obj.intitule.epithete)) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;
        case Nombre.s:
          if (obj.intituleS.nom === sujet.nom && (!sujet.epithete || sujet.epithete === obj.intituleS.epithete)) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;

        case Nombre.p:
          if (obj.intituleP.nom === sujet.nom && (!sujet.epithete || sujet.epithete === obj.intituleP.epithete)) {
            retVal.push(obj);
            dejaAjoute = true;
          }
          break;
      }

      // B. Regarder dans les synonymes (si pas déjà ajouté)
      if (!dejaAjoute && obj.synonymes) {
        obj.synonymes.forEach(synonyme => {
          if (synonyme.nom === sujet.nom && (!sujet.epithete || sujet.epithete === synonyme.epithete)) {
            retVal.push(obj);
          }
        });
      }

    });

    return retVal;
  }


  trouverLieu(sujet: GroupeNominal): Lieu[] {

    let retVal: Lieu[] = [];

    this.jeu.lieux.forEach(li => {
      if (li.intitule.nom === sujet.nom && (!sujet.epithete || li.intitule.epithete === sujet.epithete)) {
        retVal.push(li);
      }
    });

    return retVal;
  }


  /**
   * Renvoyer true si ceci contient au moins un objet.
   * TODO: tenir compte de la visibilité des objets.
   * @param ceci objet ou lieu.
   */
  public verifierContientObjet(ceci: ElementJeu): boolean {
    console.warn("verifierContientObjet: ceci=", ceci);
    let retVal = false;
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

}