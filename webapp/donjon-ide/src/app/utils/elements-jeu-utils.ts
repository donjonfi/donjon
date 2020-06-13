import { Classe, EClasseRacine } from '../models/commun/classe';

import { Correspondance } from './correspondance';
import { ElementJeu } from '../models/jeu/element-jeu';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Jeu } from '../models/jeu/jeu';
import { Lieu } from '../models/jeu/lieu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { PositionObjet } from '../models/jeu/position-objet';
import { StringUtils } from './string.utils';

export class ElementsJeuUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) { }

  static possedeCetEtat(ej: ElementJeu, etatA: string): boolean {
    if (ej) {
      var retVal = false;
      ej.etats.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        if (curEt === etatA.toLocaleLowerCase().trim()) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("possedeCetEtat >> ElementJeu pas défini.");
    }
  }

  static possedeUnDeCesEtats(ej: ElementJeu, etatA: string, etatB: string = null /*, etatC: string = null, etatD: string = null*/): boolean {
    if (ej) {
      var retVal = false;
      ej.etats.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        if (curEt === etatA.toLocaleLowerCase().trim()) {
          retVal = true;
        } else if (etatB && curEt === etatB.toLocaleLowerCase().trim()) {
          retVal = true;
          // } else if (etatC && curEt === etatC.toLocaleLowerCase().trim()) {
          //   retVal = true;
          // } else if (etatD && curEt === etatD.toLocaleLowerCase().trim()) {
          //   retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("possedeUnDeCesEtats >> ElementJeu pas défini.");
    }
  }

  /**
   * On teste aussi en ajoutant e à la fin (féminin).
   * @param ej 
   * @param etatA trim() et toLowerCase() doivent déjà être faits pour cet argument.
   * @param etatB trim() et toLowerCase() doivent déjà être faits pour cet argument.
   */
  static possedeCetEtatAutoF(ej: ElementJeu, etatA: string): boolean {
    if (ej) {
      var retVal = false;
      ej.etats.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        // premier état + féminin
        if (curEt === etatA || curEt === (etatA + 'e')) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("possedeCetEtatFemininAuto >> ElementJeu pas défini.");
    }
  }

  /**
   * On teste aussi en ajoutant e à la fin (féminin).
   * @param ej 
   * @param etatA trim() et toLowerCase() doivent déjà être faits pour cet argument.
   * @param etatB trim() et toLowerCase() doivent déjà être faits pour cet argument.
   */
  static possedeUnDeCesEtatsAutoF(ej: ElementJeu, etatA: string, etatB: string = null): boolean {
    if (ej) {
      var retVal = false;
      ej.etats.forEach(et => {
        const curEt = et.toLocaleLowerCase().trim();
        // premier état + féminin
        if (curEt === etatA || curEt === (etatA + 'e')) {
          retVal = true;
          // autre état + féminin
        } else if (etatB && (curEt === etatB || curEt === (etatB + 'e'))) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("possedeUnDeCesEtatsFemininAuto >> ElementJeu pas défini.");
    }
  }

  static retirerEtat(eleJeu: ElementJeu, etatA: string, etatB: string) {
    // retirer l’état verrouillé
    let indexEtat = -1;
    if (ElementsJeuUtils.possedeCetEtat(eleJeu, etatA)) {
      indexEtat = eleJeu.etats.findIndex(x => x === etatA);
      if (indexEtat !== -1) {
        eleJeu.etats.splice(indexEtat, 1);
      } else {
        console.error("Pas pu retirer l'état");
      }
    } else if (ElementsJeuUtils.possedeCetEtat(eleJeu, etatB)) {
      indexEtat = eleJeu.etats.findIndex(x => x === etatB);
      if (indexEtat !== -1) {
        eleJeu.etats.splice(indexEtat, 1);
      } else {
        console.error("Pas pu retirer l'état");
      }
    } else {
      console.log("retirerEtat >> Rien à retirer.");
    }
  }

  /** Ajoute l'état à l'objet si celui-ci ne possède pas déjà cet état (accordé de la même façon) */
  static ajouterEtat(eleJeu: ElementJeu, etat: string) {
    if (!ElementsJeuUtils.possedeCetEtat(eleJeu, etat)) {
      eleJeu.etats.push(etat);
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

  static copierObjet(original: Objet) {
    // Rem: La quantité est toujours à 1, et le nombre est donc toujours singulier.
    // Rem: L’id reste le même que celui de l’original.
    // TODO: attribuer un nouvel id aux clones ?
    let retVal = new Objet(original.id, original.nom, original.intitule, original.classe, 1, original.genre);
    retVal.description = original.description;
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

  getLieuObjet(obj: Objet) {
    if (obj.position == null) {
      return null;
    } else if (obj.position.cibleType === EClasseRacine.lieu) {
      return obj.position.cibleId;
    } else {
      const contenant = this.jeu.objets.find(x => x.id === obj.position.cibleId);
      return this.getLieuObjet(contenant);
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

    console.log(" >>>> objets du jeu:", this.jeu.objets);
    console.log(" >>>> lieux du jeu:", this.jeu.lieux);

    if (sujet) {
      cor = new Correspondance();
      console.warn("trouverCorrespondance sujet:", sujet);

      // 1. Chercher dans les directions.
      cor.localisation = this.trouverLocalisation(sujet);

      // 2. Chercher dans la liste des lieux.
      cor.lieux = this.trouverLieu(sujet);

      // 3. Chercher parmis les objets
      cor.objets = this.trouverObjet(sujet);

      cor.elements = [];
      // ajouter les objets aux éléments
      if (cor.objets && cor.objets.length > 0) {
        cor.elements = cor.elements.concat(cor.objets);
      }
      // ajouter les lieux aux éléments
      if (cor.lieux && cor.lieux.length > 0) {
        cor.elements = cor.elements.concat(cor.lieux);
      }

      console.log(" >>>> éléments trouvés:", cor.elements);
      console.log(" >>>> objets trouvés:", cor.objets);
      console.log(" >>>> lieux trouvés:", cor.lieux);

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

  trouverObjet(sujet: GroupeNominal): Objet[] {

    let retVal: Objet[] = [];

    this.jeu.objets.forEach(obj => {
      if (obj.intitule.nom === sujet.nom && (!sujet.epithete || obj.intitule.epithete === sujet.epithete)) {
        retVal.push(obj);
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

  // trouverElementJeu(sujet: GroupeNominal, emplacement: EmplacementElement, inclureContenu: boolean, inclurePortes: boolean): ElementJeu | -1 {

  //   let listeEleJeu: ElementJeu[] = new Array<ElementJeu>();

  //   switch (emplacement) {

  //     // chercher dans le lieu actuel
  //     case EmplacementElement.ici:
  //       // inventaire de le lieu actuel
  //       listeEleJeu = listeEleJeu.concat(this.curLieu.inventaire.objets);
  //       // ajouter les portes adjacentes
  //       if (inclurePortes) {
  //         const portesVisiblesID = this.curLieu.voisins.filter(x => x.type === ClasseRacine.porte).map(x => x.id);
  //         portesVisiblesID.forEach(porteID => {
  //           listeEleJeu.push(this.getPorte(porteID));
  //         });
  //       }
  //       break;

  //     // chercher dans l’inventaire du joueur
  //     case EmplacementElement.inventaire:
  //       listeEleJeu = this.jeu.inventaire.objets;
  //       break;

  //     // chercher dans le lieu actuel et dans l’inventaire du joueur
  //     case EmplacementElement.iciEtInventaire:
  //       listeEleJeu = listeEleJeu.concat(this.curLieu.inventaire.objets);
  //       // ajouter les portes adjacentes
  //       if (inclurePortes) {
  //         const portesVisiblesID = this.curLieu.voisins.filter(x => x.type === ClasseRacine.porte).map(x => x.id);
  //         portesVisiblesID.forEach(porteID => {
  //           listeEleJeu.push(this.getPorte(porteID));
  //         });
  //       }
  //       // ajouter l'inventaire du joueur
  //       listeEleJeu = listeEleJeu.concat(this.jeu.inventaire.objets);
  //       break;

  //     // chercher dans l’ensemble des éléments du jeu
  //     case EmplacementElement.partout:
  //       // inclure les portes
  //       if (inclurePortes) {
  //         listeEleJeu = listeEleJeu.concat(this.jeu.elements);
  //         // ne pas inclure les portes
  //       } else {
  //         listeEleJeu = this.jeu.elements.filter(x => x.type !== ClasseRacine.porte);
  //       }
  //       break;

  //     case EmplacementElement.portes:
  //       listeEleJeu = new Array<ElementJeu>();
  //       const portesVisiblesID = this.curLieu.voisins.filter(x => x.type === ClasseRacine.porte).map(x => x.id);
  //       portesVisiblesID.forEach(porteID => {
  //         listeEleJeu.push(this.getPorte(porteID));
  //       });
  //       break;

  //     default:
  //       break;
  //   }

  //   // ajouter le contenu des supports et des contenants ouverts
  //   if (inclureContenu && emplacement != EmplacementElement.partout && listeEleJeu.length > 0) {
  //     let elementsEnPlus: ElementJeu[] = [];
  //     listeEleJeu.forEach(el => {

  //       if (el.type == ClasseRacine.support) {
  //         elementsEnPlus = elementsEnPlus.concat(el.inventaire.objets);
  //       } else if (el.type == ClasseRacine.contenant && (!ElementsJeuUtils.possedeUnDeCesEtatsAutoF(el, "fermé", "verrouillé"))) {
  //         elementsEnPlus = elementsEnPlus.concat(el.inventaire.objets);
  //       }
  //     });
  //     // si on a trouvé des éléments en plus
  //     if (elementsEnPlus.length > 0) {
  //       listeEleJeu = listeEleJeu.concat(elementsEnPlus);
  //     }
  //   }

  //   console.log("trouverElementJeu >>> listeEleJeu=", listeEleJeu);


  //   let retVal: ElementJeu | -1 = null;


  //   // remplacer les caractères doubles et les accents
  //   let premierMot = StringUtils.normaliserMot(sujet.nom);
  //   let deuxiemeMot = StringUtils.normaliserMot(sujet.epithete);
  //   console.log("trouverElementJeu >>> premierMot=", premierMot, "deuxiemeMot=", deuxiemeMot);

  //   // ON CHERCHE DANS L'INTITULÉ SINGULIER (si il y en a un...)
  //   let eleJeuTrouves = listeEleJeu.filter(x => StringUtils.normaliserMot(x.intituleS).startsWith(premierMot) && x.quantite !== 0);
  //   // SI RIEN TROUVE, ON CHERCHE DANS L'INTITULÉ PAR DÉFAUT
  //   if (eleJeuTrouves.length == 0) {
  //     eleJeuTrouves = listeEleJeu.filter(x => StringUtils.normaliserMot(x.intitule).startsWith(premierMot) && x.quantite !== 0);
  //   }
  //   // si on a trouvé un objet
  //   if (eleJeuTrouves.length == 1) {
  //     retVal = eleJeuTrouves[0];
  //     // si on a trouvé plusiers objets différents
  //   } else if (eleJeuTrouves.length > 1) {
  //     // TODO: ajouter des mots en plus
  //     retVal = -1;
  //   }

  //   if (this.verbeux) {
  //     console.log("trouverElementJeu >>> mot=", premierMot, "retVal=", retVal);
  //   }
  //   return retVal;
  // }

  // prendreElementJeu(eleJeuID) {
  //   let retVal: ElementJeu = null;
  //   let listeObjets: ElementJeu[] = null;
  //   let indexEleJeu = -1;
  //   // on recherche en priorité l'objet dans le lieu actuel
  //   if (this.curLieu) {
  //     listeObjets = this.curLieu.inventaire.objets;
  //     indexEleJeu = listeObjets.findIndex(x => x.id == eleJeuID);

  //     // si pas trouvé dans l’inventaire du lieu, regarder dans d’inventaire des contenants de le lieu
  //     if (indexEleJeu == -1) {
  //       let supportsEtContenants: ElementJeu[] = [];
  //       listeObjets.forEach(el => {
  //         // pas besoin de continuer à chercher si déjà trouvé
  //         if (indexEleJeu == -1) {
  //           // si on à affaire à un support ou un contenant, regarder leur inventaire
  //           if ((el.type == ClasseRacine.support) ||
  //             (el.type == ClasseRacine.contenant && (!ElementsJeuUtils.possedeUnDeCesEtatsAutoF(el, "fermé", "verrouillé")))) {
  //             indexEleJeu = el.inventaire.objets.findIndex(x => x.id == eleJeuID);
  //             // trouvé
  //             if (indexEleJeu != -1) {
  //               listeObjets = el.inventaire.objets;
  //             }
  //           }
  //         }
  //       });
  //     }
  //   }

  //   // si pas trouvé, on recherche dans la liste globale
  //   if (indexEleJeu == -1) {
  //     listeObjets = this.jeu.elements;
  //     indexEleJeu = listeObjets.findIndex(x => x.id == eleJeuID);
  //   }

  //   if (indexEleJeu !== -1) {
  //     let eleJeu = listeObjets[indexEleJeu];
  //     // un seul exemplaire : on le retire de l'inventaire et on le retourne.
  //     if (eleJeu.quantite == 1) {
  //       retVal = listeObjets.splice(indexEleJeu, 1)[0];
  //       // plusieurs exemplaires : on le clone
  //     } else {
  //       // décrémenter quantité si pas infini
  //       if (eleJeu.quantite != -1) {
  //         eleJeu.quantite -= 1;
  //       }
  //       // faire une copie
  //       retVal = ElementsJeuUtils.copierObjet(eleJeu);
  //     }
  //   } else {
  //     console.error("prendreElementJeu >>> élément pas trouvé !");
  //   }
  //   return retVal;
  // }
}