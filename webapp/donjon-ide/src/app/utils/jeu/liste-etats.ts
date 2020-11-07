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

  public presentID = -1;
  public intactID = -1;
  public deplaceID = -1;
  public modifieID = -1;
  public cacheID = -1;
  public couvertID = -1;
  public invisibleID = -1;
  public possedeID = -1;
  public ouvertID = -1;
  public ouvrableID = -1;
  public fermeID = -1;
  public verrouilleID = -1;
  public verrouillableID = -1;
  public opaqueID = -1;
  public transparentID = -1;
  public transportableID = -1;
  public fixeID = -1;
  public decoratifID = -1;

  private etats: Etat[] = [];
  private nextEtat = 1;
  private nextGroupe = 1;

  constructor() {
    this.creerEtatsInitiaux();
  }

  creerEtatsInitiaux() {
    // présent et absent
    const presAbs = this.creerBasculeEtats(EEtatsBase.present, EEtatsBase.absent);
    this.presentID = presAbs[0].id;
    // intact, déplacé et modifié
    this.intactID = this.creerEtat(EEtatsBase.intact).id;
    this.deplaceID = this.creerEtat(EEtatsBase.deplace).id;
    this.modifieID = this.creerEtat(EEtatsBase.modifie).id;
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.deplace);
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.modifie);
    // décoratif
    this.decoratifID = this.creerEtat(EEtatsBase.decoratif).id;
    // caché, couvert, invisible
    this.cacheID = this.creerEtat(EEtatsBase.cache).id;
    this.couvertID = this.creerEtat(EEtatsBase.couvert).id;
    this.invisibleID = this.creerEtat(EEtatsBase.invisible).id;
    // accessible, inaccessible
    this.creerBasculeEtats(EEtatsBase.accessible, EEtatsBase.inaccessible);
    // possédé, disponible et occupé
    // TODO: est-ce qu'on garde ça groupé ?
    const possDispOcc = this.creerGroupeEtats([EEtatsBase.possede, EEtatsBase.disponible, EEtatsBase.occupe]);
    this.possedeID = possDispOcc[0].id;
    // porté
    this.creerEtat(EEtatsBase.porte);
    this.ajouterImplication(EEtatsBase.porte, EEtatsBase.possede);
    // dénombrable et indénombrable
    this.creerBasculeEtats(EEtatsBase.denombrable, EEtatsBase.indenombrable);
    // mangeable et buvable
    this.creerEtat(EEtatsBase.mangeable);
    this.creerEtat(EEtatsBase.buvable);
    // ouvrable, ouvert, fermé
    this.ouvrableID = this.creerEtat(EEtatsBase.ouvrable).id;
    const ouvFer = this.creerBasculeEtats(EEtatsBase.ouvert, EEtatsBase.ferme);
    this.ouvertID = ouvFer[0].id;
    this.fermeID = ouvFer[1].id;
    // verrouillable, verrouillé, déverrouillé
    this.verrouillableID = this.creerEtat(EEtatsBase.verrouillable).id;
    const verrDeve = this.creerBasculeEtats(EEtatsBase.verrouille, EEtatsBase.deverrouille);
    this.verrouilleID = verrDeve[0].id;
    // transportable et fixe
    const transFixe = this.creerBasculeEtats(EEtatsBase.transportable, EEtatsBase.fixe);
    this.transportableID = transFixe[0].id;
    this.fixeID = transFixe[1].id;
    // opaque et transparent
    const opaTran = this.creerBasculeEtats(EEtatsBase.opaque, EEtatsBase.transparent);
    this.opaqueID = opaTran[0].id;
    this.transparentID = opaTran[1].id;
    // éclairé et obscur
    this.creerBasculeEtats(EEtatsBase.eclaire, EEtatsBase.obscur);
    // allumé et éteint
    this.creerBasculeEtats(EEtatsBase.allume, EEtatsBase.eteint);
    // marche et arrêt
    this.creerBasculeEtats(EEtatsBase.marche, EEtatsBase.arret);
    // parlant et muet
    this.creerBasculeEtats(EEtatsBase.parlant, EEtatsBase.muet);

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
    const nomTronque = nomEtat.replace(/^(.+?)(ble|que)?(e)?(s)?$/, "$1$2");
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
    // const groupe = this.nextGroupe++;
    const etatA = this.suiteCreerEtat(nomEtatA, genre, nombre, null, (this.nextEtat + 1));
    const etatB = this.suiteCreerEtat(nomEtatB, genre, nombre, null, (this.nextEtat - 1));
    return [etatA, etatB];
  }

  /** Créer un nouvel état */
  creerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s): Etat {
    return this.suiteCreerEtat(nomEtat, genre, nombre, null, null);
  }

  /**
   * spécifier que étatA implique étatB
   */
  ajouterImplication(nomEtatA: string, nomEtatB: string) {
    let etatA = this.trouverEtat(nomEtatA);
    let etatB = this.trouverEtat(nomEtatB);
    if (etatA && etatB) {
      // ajouter etatB aux implications de etatA
      if (!etatA.implications) {
        etatA.implications = [etatB.id];
      } else if (!etatA.implications.includes(etatB.id)) {
        etatA.implications.push(etatB.id);
      }
      // ajouter également toutes les implications de etatB à celles de etatA
      if (etatB.implications) {
        etatB.implications.forEach(implication => {
          if (!etatA.implications.includes(implication)) {
            etatA.implications.push(implication);
          }
        });
      }
      // modifier tous les éléments qui impliquent etatA: ils doivent impliquer les implications de étatA
      this.etats.forEach(autreEtat => {
        // si implique etatA
        if (autreEtat.implications && autreEtat.implications.includes(etatA.id)) {
          // ajouter les implication de etatA
          etatA.implications.forEach(implication => {
            if (!autreEtat.implications.includes(implication)) {
              autreEtat.implications.push(implication);
            }
          });
        }
      });

    } else {
      console.error("ajouterImplication >> pas trouvé au moins un des états:", nomEtatA, nomEtatB);
    }
  }

  ajouterContradiction(nomEtatA: string, nomEtatB: string) {
    let etatA = this.trouverEtat(nomEtatA);
    let etatB = this.trouverEtat(nomEtatB);
    if (etatA && etatB) {
      // ajouter la contradiction à l’état A
      if (!etatA.contradictions) {
        etatA.contradictions = [etatB.id];
      } else if (!etatA.contradictions.includes(etatB.id)) {
        etatA.contradictions.push(etatB.id);
      }
      // ajouter la contradiction à l’état B
      if (!etatB.contradictions) {
        etatB.contradictions = [etatA.id];
      } else if (!etatB.contradictions.includes(etatA.id)) {
        etatB.contradictions.push(etatA.id);
      }
    } else {
      console.error("ajouterContradiction >> pas trouvé au moins un des états:", nomEtatA, nomEtatB);
    }
  }

  /** Créer le nouvel état (avec arguments privés) */
  private suiteCreerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s, groupe: number = null, bascule: number = null): Etat {
    let newEtat = new Etat();
    newEtat.id = this.nextEtat++;
    newEtat.groupe = groupe;
    newEtat.bascule = bascule;
    newEtat.nomTronque = nomEtat.replace(/^(.+?)(ble|que)?(e)?(s)?$/, "$1$2");
    newEtat.nom = nomEtat;
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
    this.etats.push(newEtat);
    return newEtat;
  }

  /** Trouver un état sur base de son nom.
   * Si l'état n'a pas été trouvé, en créer un nouveau.
   */
  trouverOuCreerEtat(nomEtat: string, genre: Genre, nombre: Nombre): Etat {
    let etat = this.trouverEtat(nomEtat);
    // si l'état n'a pas été trouvé, l'ajouter à la liste
    if (!etat) {
      etat = this.creerEtat(nomEtat, genre, nombre);
    }
    return etat;
  }


  /** Ajouter un état à l'élément. */
  ajouterEtatElement(element: ElementJeu, nomEtat: string) {
    // console.log(">>>> +etat=", nomEtat, "ele=", element);

    let etat = this.trouverOuCreerEtat(nomEtat, element.genre, element.nombre);
    // s'il s'agit d'un état faisant partie d'un groupe
    if (etat.groupe !== null) {
      // retirer tous les états existants pour ce groupe
      const idsEtatsDuGroupe = this.etats.filter(x => x.groupe === etat.groupe).map(x => x.id);
      element.etats = element.etats.filter(x => !idsEtatsDuGroupe.includes(x));
      // ajouter le nouvel état
      element.etats.push(etat.id);
      // sinon, ajouter l'état s'il n'y est pas encore
    } else {
      if (!element.etats.includes(etat.id)) {
        element.etats.push(etat.id);
        // s’il s’agit d’une bascule, enlever l’autre état
        if (etat.bascule) {
          // ne garder que les autres états
          element.etats = element.etats.filter(x => x !== etat.bascule);
        }
      }
    }

    // si le nouvel état a des contradictions
    if (etat.contradictions) {
      // retirer les contradictions
      element.etats = element.etats.filter(x => !etat.contradictions.includes(x));
    }
  }

  /** Retirer un état à un élément */
  retirerEtatElement(element: ElementJeu, nomEtat: string) {
    // console.log(">>>> -etat=", nomEtat, "ele=", element);

    let etat = this.trouverEtat(nomEtat);
    // on ne peut le retirer que s'il existe...
    if (etat !== null) {
      // ne garder que les autres états
      element.etats = element.etats.filter(x => x !== etat.id);
      // s'il s'agit d'une bascule, il faut activer l'autre état
      // (mais vérifier que la bascule n’est pas déjà sur l’autre état avant…)
      if (etat.bascule && !element.etats.includes(etat.bascule)) {
        const etatBascule = this.obtenirEtat(etat.bascule);
        element.etats.push(etatBascule.id);
        // si l’état bascule a des contradictions, les retirer
        if (etatBascule.contradictions) {
          element.etats = element.etats.filter(x => !etatBascule.contradictions.includes(x));
        }
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
  possedeEtatIdElement(element: ElementJeu, etatID: number) {
    let retVal = false;
    if (element) {
      retVal = element.etats.includes(etatID);
    } else {
      console.warn("possedeEtatIdElement >> element null.");
    }
    return retVal;
  }

  /**
   * Est-ce que l'élément possède l'état ?
   * @param element 
   * @param nomEtat 
   */
  possedeEtatElement(element: ElementJeu, nomEtat: string, eju: ElementsJeuUtils) {
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
      let etat = this.trouverEtat(nomEtat);
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
    if (!objet.etats.includes(this.presentID)) {
      return false;
    }
    // si invisible => pas visible
    if (objet.etats.includes(this.invisibleID)) {
      return false;
    }
    // si couvert -> pas visible
    if (objet.etats.includes(this.couvertID)) {
      return false;
    }

    // s’il s’agit d’une PORTE, elle est visible
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.porte)) {
      return true;
      // s’il ne s’agit PAS d’une porte
    } else {
      // on objet non positionné n’est pas visible
      if (!objet.position) {
        return false;
      }

      // si dans un contenant fermé et opaque -> pas visible
      if (this.estObjetMasqueParUnContenantOpaqueFerme(objet, eju)) {
        return false;
      }

      // l’objet est visible
      return true;
    }


  }

  // l'objet est-il masqué par un contenant opaque et fermé ?
  estObjetMasqueParUnContenantOpaqueFerme(objet: Objet, eju: ElementsJeuUtils) {
    if (objet.position.cibleType === EClasseRacine.objet) {
      // récupérer le contenant
      const parent = eju.getObjet(objet.position.cibleId);
      if (parent) {
        // si l'objet est dans un contenant fermé et opaque
        if (ClasseUtils.heriteDe(parent.classe, EClasseRacine.contenant)) {
          if (objet.etats.includes(this.fermeID) && objet.etats.includes(this.opaqueID)) {
            return true;
          }
        }
        // vérifier également le parent éventuel de l'objet
        return this.estObjetMasqueParUnContenantOpaqueFerme(parent, eju);
      } else {
        console.error("estObjetMasqueParUnContenantOpaqueFerme > Pas trouvé le parent \n > obj=", objet, "\n > position=", objet.position);
        return false;
      }
    } else {
      return false;
    }
  }

  obtenirListeDesEtats() {
    return this.etats;
  }

  obtenirEtat(id: number) {
    return this.etats.find(x => x.id === id);
  }

  /** Obtenir les états liés à un élément du jeu. */
  obtenirEtatsElementJeu(el: ElementJeu) {
    let elEtats: Etat[] = [];
    el.etats.forEach(etatID => {
      let curEtat = this.obtenirEtat(etatID);
      if (curEtat) {
        elEtats.push(curEtat);
      } else {
        console.error("obtenirLesEtats > etat pas trouvé:\n >> id=", etatID, "\n >> el=", el, "\n >> etats=", this.etats);
      }
    });
    return elEtats;
  }

  obtenirIntitulesEtatsElementJeu(el: ElementJeu) {
    const elEtats = this.obtenirEtatsElementJeu(el);
    const feminin = el.genre === Genre.f;
    const pluriel = el.nombre === Nombre.p;
    const totalEtats = elEtats.length;
    let nbEtats = 0;
    let retVal = totalEtats === 0 ? "(aucun)" : "";
    elEtats.forEach(element => {
      let curNom: string;
      nbEtats++;
      if (feminin) {
        if (pluriel) {
          curNom = element.nomFP ?? element.nom;
        } else {
          curNom = element.nomFS ?? element.nom;
        }
      } else {
        if (pluriel) {
          curNom = element.nomMP ?? element.nom;
        } else {
          curNom = element.nomMS ?? element.nom;
        }
      }
      retVal += curNom + (nbEtats === totalEtats ? "." : (nbEtats === (totalEtats - 1) ? " et " : ", "));
    });
    return retVal;
  }

}
