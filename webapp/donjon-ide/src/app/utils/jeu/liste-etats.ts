import { EClasseRacine, EEtatsBase } from 'src/app/models/commun/constantes';

import { ClasseUtils } from '../commun/classe-utils';
import { ElementJeu } from 'src/app/models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Etat } from 'src/app/models/commun/etat';
import { Genre } from 'src/app/models/commun/genre.enum';
import { LienCondition } from 'src/app/models/compilateur/condition';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from 'src/app/models/commun/nombre.enum';
import { Objet } from 'src/app/models/jeu/objet';

export class ListeEtats {


  private ID_PRESENT = -1;
  private ID_CACHE = -1;
  private ID_COUVERT = -1;
  private ID_INVISIBLE = -1;
  private ID_POSSEDE = -1;
  private ID_OUVERT = -1;
  private ID_FERME = -1;
  private ID_OPAQUE = -1;
  private ID_TRANSPARENT = -1;
  private ID_TRANSPORTABLE = -1;
  private ID_FIXE = -1;
  private ID_DECORATIF = -1;

  private etats: Etat[] = [];
  private nextEtat = 1;
  private nextGroupe = 1;

  constructor() {
    this.creerEtatsInitiaux();
  }

  creerEtatsInitiaux() {
    this.ID_PRESENT = this.creerBasculeEtats(EEtatsBase.PRESENT, EEtatsBase.ABSENT)[0].id;
    this.ID_DECORATIF = this.creerEtat(EEtatsBase.DECORATIF).id;
    this.ID_CACHE = this.creerEtat(EEtatsBase.CACHE).id;
    this.ID_COUVERT = this.creerEtat(EEtatsBase.COUVERT).id;
    this.ID_INVISIBLE = this.creerEtat(EEtatsBase.INVISIBLE).id;
    this.creerBasculeEtats(EEtatsBase.ACCESSIBLE, EEtatsBase.INACCESSIBLE);
    // TODO: est-ce qu'on garde ça groupé ?
    this.ID_POSSEDE = this.creerGroupeEtats([EEtatsBase.POSSEDE, EEtatsBase.DISPONIBLE, EEtatsBase.OCCUPE])[0].id;
    this.creerEtat(EEtatsBase.PORTE);
    this.creerBasculeEtats(EEtatsBase.DENOMBRABLE, EEtatsBase.INDENOMBRABLE);
    this.creerEtat(EEtatsBase.MANGEABLE);
    this.creerEtat(EEtatsBase.BUVABLE);
    this.creerEtat(EEtatsBase.OUVRABLE);
    const ouvFer = this.creerBasculeEtats(EEtatsBase.OUVERT, EEtatsBase.FERME);
    this.ID_OUVERT = ouvFer[0].id;
    this.ID_FERME = ouvFer[1].id;
    this.creerEtat(EEtatsBase.VERROUILLABLE);
    this.creerBasculeEtats(EEtatsBase.VERROUILLE, EEtatsBase.DEVERROUILLE);
    // this.creerGroupeEtats([EEtatsBase.LUMINEUX,EEtatsBase.CLAIR, EEtatsBase.SOMBRE, EEtatsBase.OBSCUR]);
    this.creerBasculeEtats(EEtatsBase.ECLAIRE, EEtatsBase.OBSCUR);
    this.creerBasculeEtats(EEtatsBase.ALLUME, EEtatsBase.ETEINT);
    this.creerBasculeEtats(EEtatsBase.MARCHE, EEtatsBase.ARRET);
    this.creerBasculeEtats(EEtatsBase.PARLANT, EEtatsBase.MUET);
    const transFixe = this.creerBasculeEtats(EEtatsBase.TRANSPORTABLE, EEtatsBase.FIXE);
    this.ID_TRANSPORTABLE = transFixe[0].id;
    this.ID_FIXE = transFixe[1].id;
    const opaTran = this.creerBasculeEtats(EEtatsBase.OPAQUE, EEtatsBase.TRANSPARENT);
    this.ID_OPAQUE = opaTran[0].id;
    this.ID_TRANSPARENT = opaTran[1].id;

  }

  /**
   * Trouver un état sur base de son nom.
   * @returns l'état correspondant ou null si pas touvé.
   */
  trouverEtat(nomEtat: string): Etat {
    // retirer le e et le s final
    // - cas particulié: si terminaison "ble" on retire pas le e final.
    const trouve = false;
    let retVal: Etat = null;
    // comparer sur le nom tronqué en espérant le trouver rapidement
    const nomTronque = nomEtat.replace(/^(.+?)(ble)?(e)?(s)?$/, "$1$2");
    this.etats.forEach(etat => {
      if (!trouve && etat.nomTronque === nomTronque) {
        retVal = etat;
      }
    });
    // si pas trouvé, comparer sur les formes complètes
    this.etats.forEach(etat => {
      if (!trouve &&
        (etat.nomMS === nomEtat ||
          etat.nomFS === nomEtat ||
          etat.nomMP === nomEtat ||
          etat.nomFP === nomEtat)) {
        retVal = etat;
      }
    });
    return retVal;
  }

  /** Créer un goupe d'états. */
  creerGroupeEtats(nomEtats: string[], genre: Genre = Genre.m, nombre: Nombre = Nombre.s) {
    const groupe = this.nextGroupe++;
    let nouveauxEtats: Etat[] = [];
    nomEtats.forEach(nomEtat => {
      nouveauxEtats.push(this.suiteCreerEtat(nomEtat, genre, nombre, groupe));
    });
    return nouveauxEtats;
  }

  /** Créer une nouvele bascule d'états */
  creerBasculeEtats(nomEtatA, nomEtatB, genre: Genre = Genre.m, nombre: Nombre = Nombre.s) {
    const etatA = this.suiteCreerEtat(nomEtatA, genre, nombre, null, (this.nextEtat + 1));
    const etatB = this.suiteCreerEtat(nomEtatB, genre, nombre, null, (this.nextEtat - 1));
    return [etatA, etatB];
  }

  /** Créer un nouvel état */
  creerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s): Etat {
    return this.suiteCreerEtat(nomEtat, genre, nombre, null, null);
  }

  /** Créer le nouvel état (avec arguments privés) */
  private suiteCreerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s, groupe: number = null, bascule: number = null): Etat {
    let newEtat = new Etat();
    newEtat.id = this.nextEtat++;
    newEtat.groupe = groupe;
    newEtat.groupe = bascule;
    newEtat.nomTronque = nomEtat.replace(/^(.+?)(ble)?(e)?(s)?$/, "$1$2");
    // féminin
    if (genre === Genre.f) {
      // f - pluriel
      if (nombre === Nombre.p) {
        newEtat.nomFP = nomEtat;
        // f - singulier
      } else {
        newEtat.nomFS = nomEtat;
        // deviner le pluriel
        newEtat.nomFP = MotUtils.getPluriel(newEtat.nomFS);
      }
      // masculin
    } else {
      // m - pluriel
      if (nombre === Nombre.p) {
        newEtat.nomMP = nomEtat;
        // m - singulier
      } else {
        newEtat.nomMS = nomEtat;
        // deviner le féminin
        newEtat.nomFS = MotUtils.getFeminin(nomEtat);
        // deviner le pluriel
        newEtat.nomMP = MotUtils.getPluriel(nomEtat);
        newEtat.nomFP = MotUtils.getPluriel(newEtat.nomFS);
      }
    }
    return newEtat;
  }

  /** Trouver un état sur base de son nom.
   * Si l'état n'a pas été trouvé, en créer un nouveau.
   */
  trouverOuCreerEtat(nomEtat: string, genre: Genre, nombre: Nombre): Etat {
    let etat = this.trouverEtat(nomEtat);
    // si l'état n'a pas été trouvé, l'ajouter à la liste
    if (!etat) {
      this.creerEtat(nomEtat, genre, nombre);
    }
    return etat;
  }


  /** Ajouter un état à l'élément. */
  ajouterEtatElement(element: ElementJeu, nomEtat: string) {
    let etat = this.trouverOuCreerEtat(nomEtat, element.genre, element.nombre);
    // s'il s'agit d'un état faisant partie d'un groupe
    if (etat.groupe !== null) {
      const idsEtatsDuGroupe = this.etats.filter(x => x.groupe === etat.groupe).map(x => x.id);
      // retirer tous les étas existants pour ce groupe
      element.etats = element.etats.filter(x => !idsEtatsDuGroupe.includes(x));
      // ajouter l'état
      element.etats.push(etat.id);
      // sinon, simplement ajouter l'état s'il n'y est pas encore
    } else {
      if (!element.etats.includes(etat.id)) {
        element.etats.push(etat.id);
      }
    }
  }

  /** Retirer un état à un élément */
  retirerEtatElement(element: ElementJeu, nomEtat: string) {
    let etat = this.trouverEtat(nomEtat);
    // on ne peut le retirer que s'il existe...
    if (etat !== null) {
      // ne garder que les autres états
      element.etats = element.etats.filter(x => x !== etat.id);
      // s'il s'agit d'une bascule, il faut activer l'autre état
      // (on part du postula que l'autre état n'est pas actif puisqu'il s'agit d'une bascule...)
      if (etat.bascule) {
        element.etats.push(etat.bascule);
      }
    } else {
      console.warn("retirerEtatElement >>> état pas trouvé:", nomEtat);
    }
  }

  /**
   * Est-ce que l'élément possède l'état ?
   * @param element 
   * @param nomEtat 
   */
  possedeCetEtatElement(element: ElementJeu, nomEtat: string, eju: ElementsJeuUtils) {
    let retVal = false;
    if (element) {
      if (nomEtat === 'visible' || nomEtat === 'visibles') {
        return this.estVisible((element as Objet), eju);
      } else {
        let etat = this.trouverEtat(nomEtat);
        if (etat) {
          retVal = element.etats.includes(etat.id);
        } else {
          console.warn("possedeCetEtatElement >> état introuvable:", nomEtat);
        }
      }
    } else {
      console.warn("possedeCetEtatElement >> element null.");
    }
    return retVal;
  }

  /** Est-ce que l'élément possède ces états (et/ou/soit) */
  possedeCesEtatsElement(element: ElementJeu, nomEtatA: string, nomEtatB: string, lien: LienCondition) {
    let retVal = false;
    let etatA = this.trouverOuCreerEtat(nomEtatA, element.genre, element.nombre);
    let etatB = this.trouverOuCreerEtat(nomEtatB, element.genre, element.nombre);
    if (etatA && etatB) {
      switch (lien) {
        case LienCondition.et:
          retVal = element.etats.includes(etatA.id) && element.etats.includes(etatB.id);
          break;

        case LienCondition.ou:
          retVal = element.etats.includes(etatA.id) || element.etats.includes(etatB.id);
          break;

        case LienCondition.soit:
          retVal = element.etats.includes(etatA.id) !== element.etats.includes(etatB.id);
          break;

        default:
          console.error("possedeCesEtatsElement >> lien pas pris en charge:", lien);
          break;
      }
    } else {
      console.warn("possedeCetEtatElement >> au moins un des états est introuvable:", nomEtatA, nomEtatB);
    }
    return retVal;
  }

  /**
   * Est-ce que les éléments possèdent tous l'état renseigné ?
   * @param elements 
   * @param nomEtat 
   */
  possedentTousCetEtatElements(elements: ElementJeu[], nomEtat: string) {
    let retVal = false;
    if (elements?.length) {
      let etat = this.trouverOuCreerEtat(nomEtat, Genre.m, Nombre.s);
      if (etat) {
        retVal = true;
        elements.forEach(element => {
          if (retVal && !element.etats.includes(etat.id)) {
            retVal = false;
          }
        });
      } else {
        console.warn("possedeCetEtatElement >> état introuvable:", nomEtat);
      }
    }
    return retVal;
  }

  /**
   * Savoir si l'élément est actuellement visible.
   * @todo utliser un cache pour ne pas re-calculer quand pas nécessaire.
   * @todo déclancher re-calcul lorsqu'on change un élément qui influence visible.
   * @param element 
   */
  estVisible(objet: Objet, eju: ElementsJeuUtils) {
    // si pas dans la pièce -> pas visible
    if (objet.etats.includes(this.ID_PRESENT)) {
      return false;
    }
    // si invisible => pas visible
    if (objet.etats.includes(this.ID_INVISIBLE)) {
      return false;
    }
    // si couvert -> pas visible
    if (objet.etats.includes(this.ID_COUVERT)) {
      return false;
    }
    // si dans un contenant fermé et opaque -> pas visible
    if (this.estObjetMasqueParUnContenantOpaqueFerme(objet, eju)) {
      return false;
    }
  }

  // l'objet est-il masqué par un contenant opaque et fermé ?
  estObjetMasqueParUnContenantOpaqueFerme(objet: Objet, eju: ElementsJeuUtils) {
    if (objet.position.cibleType === EClasseRacine.objet) {
      // récupérer le contenant
      const parent = eju.getObjet(objet.position.cibleId);
      // si l'objet est dans un contenant fermé et opaque
      if (ClasseUtils.heriteDe(parent.classe, EClasseRacine.contenant)) {
        if (objet.etats.includes(this.ID_FERME) && objet.etats.includes(this.ID_OPAQUE)) {
          return true;
        }
      }
      // vérifier également le parent éventuel de l'objet
      return this.estObjetMasqueParUnContenantOpaqueFerme(parent, eju);
    } else {
      return false;
    }
  }

}