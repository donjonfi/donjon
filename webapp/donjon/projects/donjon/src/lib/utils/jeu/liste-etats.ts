import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';

import { ClasseUtils } from '../commun/classe-utils';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Etat } from '../../models/commun/etat';
import { Genre } from '../../models/commun/genre.enum';
import { LienCondition } from '../../models/compilateur/condition';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';

export class ListeEtats {

  public presentID = -1;
  public visiteID = -1;
  public intactID = -1;
  public deplaceID = -1;
  public modifieID = -1;
  public cacheID = -1;
  public couvertID = -1;
  public visibleID = -1;
  public invisibleID = -1;
  public accessibleID = -1;
  public inaccessibleID = -1;
  public possedeID = -1;
  public disponibleID = -1;
  public occupeID = -1;
  public porteID = -1;
  public ouvertID = -1;
  public ouvrableID = -1;
  public fermeID = -1;
  public verrouilleID = -1;
  public verrouillableID = -1;
  public opaqueID = -1;
  public transparentID = -1;
  public transportableID = -1;
  public adjacentID = -1;
  public fixeID = -1;
  public decoratifID = -1;
  public clairID = -1;
  public eclaireID = -1;
  public obscurID = -1;

  private etats: Etat[] = [];
  private nextEtat = 1;
  private nextGroupe = 1;

  constructor() {
    this.creerEtatsInitiaux();
  }

  creerEtatsInitiaux(): void {
    // présent et absent (objet)
    const presAbs = this.creerBasculeEtats(EEtatsBase.present, EEtatsBase.absent);
    this.presentID = presAbs[0].id;
    // visité (lieu)
    this.visiteID = this.creerEtat(EEtatsBase.visite).id;
    // intact, déplacé et modifié (objet, lieu)
    this.intactID = this.creerEtat(EEtatsBase.intact).id;
    this.deplaceID = this.creerEtat(EEtatsBase.deplace).id;
    this.modifieID = this.creerEtat(EEtatsBase.modifie).id;
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.deplace);
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.modifie);
    // décoratif (objet)
    this.decoratifID = this.creerEtat(EEtatsBase.decoratif).id;
    // caché, couvert, invisible (objet)
    this.cacheID = this.creerEtat(EEtatsBase.cache).id;
    this.couvertID = this.creerEtat(EEtatsBase.couvert).id;
    this.visibleID = this.creerEtat(EEtatsBase.visible, Genre.m, Nombre.s, true).id;
    this.invisibleID = this.creerEtat(EEtatsBase.invisible).id;
    // accessible, inaccessible (objet)
    this.accessibleID = this.creerEtat(EEtatsBase.accessible, Genre.m, Nombre.s, true).id;
    this.inaccessibleID = this.creerEtat(EEtatsBase.inaccessible).id;
    // possédé, disponible et occupé (objet)
    this.possedeID = this.creerEtat(EEtatsBase.possede, Genre.m, Nombre.s, true).id;
    this.disponibleID = this.creerEtat(EEtatsBase.disponible, Genre.m, Nombre.s, true).id;
    this.occupeID = this.creerEtat(EEtatsBase.occupe, Genre.m, Nombre.s, true).id;
    // porté (objet)
    this.porteID = this.creerEtat(EEtatsBase.porte, Genre.m, Nombre.s, true).id;
    // this.ajouterImplication(EEtatsBase.porte, EEtatsBase.possede);
    // dénombrable et indénombrable (objet)
    this.creerBasculeEtats(EEtatsBase.denombrable, EEtatsBase.indenombrable);
    // unique, multiple, illimité
    this.creerBasculeEtats(EEtatsBase.unique, EEtatsBase.multiple);
    this.creerEtat(EEtatsBase.illimite);
    this.ajouterContradiction(EEtatsBase.unique, EEtatsBase.illimite);

    // mangeable, buvable, portable (objet)
    this.creerEtat(EEtatsBase.mangeable);
    this.creerEtat(EEtatsBase.buvable);
    this.creerEtat(EEtatsBase.portable);
    // ouvrable, ouvert, fermé (porte, contenant)
    this.ouvrableID = this.creerEtat(EEtatsBase.ouvrable).id;
    const ouvFer = this.creerBasculeEtats(EEtatsBase.ouvert, EEtatsBase.ferme);
    this.ouvertID = ouvFer[0].id;
    this.fermeID = ouvFer[1].id;
    // verrouillable, verrouillé, déverrouillé (porte, contenant)
    this.verrouillableID = this.creerEtat(EEtatsBase.verrouillable).id;
    const verrDeve = this.creerBasculeEtats(EEtatsBase.verrouille, EEtatsBase.deverrouille);
    this.verrouilleID = verrDeve[0].id;
    // transportable et fixe (objet)
    const transFixe = this.creerBasculeEtats(EEtatsBase.transportable, EEtatsBase.fixe);
    this.transportableID = transFixe[0].id;
    this.fixeID = transFixe[1].id;
    // opaque et transparent (contenant, objet)
    const opaTran = this.creerBasculeEtats(EEtatsBase.opaque, EEtatsBase.transparent);
    this.opaqueID = opaTran[0].id;
    this.transparentID = opaTran[1].id;
    // clair, obscur et éclairé (lieu)
    const claiObsc = this.creerBasculeEtats(EEtatsBase.clair, EEtatsBase.obscur);
    this.clairID = claiObsc[0].id;
    this.obscurID = claiObsc[1].id;
    this.eclaireID = this.creerEtat(EEtatsBase.eclaire).id;
    // allumé et éteint (lampe/bougie)
    this.creerBasculeEtats(EEtatsBase.allume, EEtatsBase.eteint);
    // actionné et arrêté (appareil/machine)
    this.creerBasculeEtats(EEtatsBase.actionne, EEtatsBase.arrete);
    // parlant et muet (personne)
    this.creerBasculeEtats(EEtatsBase.parlant, EEtatsBase.muet);
    // adjacent (lieu)
    this.adjacentID = this.creerEtat(EEtatsBase.adjacent, Genre.m, Nombre.s, true).id;
    // lu (objet)
    this.creerEtat(EEtatsBase.lu, Genre.m, Nombre.s, false).id;
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.lu); // est-ce une bonne idée ?
  }

  /**
   * Trouver un état sur base de son nom.
   * @returns l'état correspondant ou null si pas touvé.
   */
  trouverEtat(nomEtat: string): Etat {
    // retirer le e et le s final
    // - cas particulier: si terminaison "ble"|"que" on retire pas le e final.
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
      nouveauxEtats.push(this.suiteCreerEtat(nomEtat, genre, nombre, groupe, null, false));
    });
    return nouveauxEtats;
  }

  /** Créer une nouvele bascule d'états */
  creerBasculeEtats(nomEtatA, nomEtatB, genre: Genre = Genre.m, nombre: Nombre = Nombre.s) {
    // const groupe = this.nextGroupe++;
    const etatA = this.suiteCreerEtat(nomEtatA, genre, nombre, null, (this.nextEtat + 1), false);
    const etatB = this.suiteCreerEtat(nomEtatB, genre, nombre, null, (this.nextEtat - 1), false);
    return [etatA, etatB];
  }

  /**
   * Créer un nouvel état.
   * @argument nomEtat: nom du nouvel état.
   * @argument genre: genre du nom (pour pouvoir deviner le féminin à partir du masculin).
   * @argument nombre: nombre du nom (pour pouvoir deviner le pluriel à partir du singulier).
   * @argument calcule: s’agit-il d’un attribut calculé (et donc pas modifiable directement).
   */
  creerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s, calcule: boolean = false): Etat {
    return this.suiteCreerEtat(nomEtat, genre, nombre, null, null, calcule);
  }

  // /**
  //  * spécifier que étatA implique étatB
  //  */
  // ajouterImplication(nomEtatA: string, nomEtatB: string) {
  //   let etatA = this.trouverEtat(nomEtatA);
  //   let etatB = this.trouverEtat(nomEtatB);
  //   if (etatA && etatB) {
  //     // ajouter etatB aux implications de etatA
  //     if (!etatA.implications) {
  //       etatA.implications = [etatB.id];
  //     } else if (!etatA.implications.includes(etatB.id)) {
  //       etatA.implications.push(etatB.id);
  //     }
  //     // ajouter également toutes les implications de etatB à celles de etatA
  //     if (etatB.implications) {
  //       etatB.implications.forEach(implication => {
  //         if (!etatA.implications.includes(implication)) {
  //           etatA.implications.push(implication);
  //         }
  //       });
  //     }
  //     // modifier tous les éléments qui impliquent etatA: ils doivent impliquer les implications de étatA
  //     this.etats.forEach(autreEtat => {
  //       // si implique etatA
  //       if (autreEtat.implications && autreEtat.implications.includes(etatA.id)) {
  //         // ajouter les implication de etatA
  //         etatA.implications.forEach(implication => {
  //           if (!autreEtat.implications.includes(implication)) {
  //             autreEtat.implications.push(implication);
  //           }
  //         });
  //       }
  //     });

  //   } else {
  //     console.error("ajouterImplication >> pas trouvé au moins un des états:", nomEtatA, nomEtatB);
  //   }
  // }

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
  private suiteCreerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s, groupe: number = null, bascule: number = null, calcule: boolean = false): Etat {
    let newEtat = new Etat();
    newEtat.id = this.nextEtat++;
    newEtat.groupe = groupe;
    newEtat.bascule = bascule;
    newEtat.nomTronque = nomEtat.replace(/^(.+?)(ble|que)?(e)?(s)?$/, "$1$2");
    newEtat.nom = nomEtat;
    newEtat.calcule = calcule;
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
   * /!\ Les états interdits ne sont pas contrôlés ici : visible, accessible, possédé et porté.
   */
  private trouverOuCreerEtat(nomEtat: string, genre: Genre, nombre: Nombre): Etat {
    let etat = this.trouverEtat(nomEtat);
    // si l'état n'a pas été trouvé, l'ajouter à la liste
    if (!etat) {
      etat = this.creerEtat(nomEtat, genre, nombre);
    }
    return etat;
  }

  /** Ajouter un état à l'élément. */
  ajouterEtatElement(element: ElementJeu, nomEtat: string, forcerCalcul: boolean = false) {

    const etat = this.trouverOuCreerEtat(nomEtat, element.genre, element.nombre);

    if (etat.calcule && !forcerCalcul) {
      console.error("ajouterEtatElement >> L’état « " + etat.nom + " » est un état calculé. Cela signifie qu’on ne peut pas le modifier directement.");
      // état classique
    } else {
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
  }

  /** Retirer un état à un élément */
  retirerEtatElement(element: ElementJeu, nomEtat: string, forcerCalcul: boolean = false) {
    const etat = this.trouverEtat(nomEtat);
    // on ne peut le retirer que s'il existe...
    if (etat !== null) {
      // vérifier s’il s’agit d’un état calculé
      if (etat.calcule && !forcerCalcul) {
        console.error("retirerEtatElement >> L’état « " + etat.nom + " » est un état calculé. Cela signifie qu’on ne peut pas le modifier directement.");
        // état classique
      } else {
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
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return element.id == eju.curLieu.id;
          // objet
        } else {
          return this.estVisible((element as Objet), eju);
        }

      } else if (nomEtat === 'accessible' || nomEtat === 'accessibles') {
        return this.estAccessible((element as Objet), eju);
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
  possedeCesEtatsElement(element: ElementJeu, nomEtatA: string, nomEtatB: string, lien: LienCondition, eju: ElementsJeuUtils) {
    let retVal = false;
    const etatA = this.trouverEtat(nomEtatA);
    const etatB = this.trouverEtat(nomEtatB);
    if (etatA && etatB) {
      switch (lien) {
        case LienCondition.et:
          retVal = (this.possedeEtatElement(element, nomEtatA, eju)) && (this.possedeEtatElement(element, nomEtatB, eju));
          break;

        case LienCondition.ou:
          retVal = (this.possedeEtatElement(element, nomEtatA, eju)) || (this.possedeEtatElement(element, nomEtatB, eju));
          break;

        case LienCondition.soit:
          retVal = (this.possedeEtatElement(element, nomEtatA, eju)) !== (this.possedeEtatElement(element, nomEtatB, eju));
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
   * @param elements éléments à tester
   * @param nomEtat état à vérifier
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

    // s’il s’agit d’une PORTE, elle est visible (car jamais dans un contentant et présente, visible, non couverte)
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.porte)) {
      return true;
      // s’il ne s’agit PAS d’une porte
    } else {
      // on objet non positionné n’est pas visible
      if (!objet.position) {
        return false;
      }

      // si dans un contenant fermé et opaque -> pas visible
      if (this.estObjetDansUnContenantFermeEtOpaque(objet, eju, true)) {
        return false;
      }

      // l’objet est visible
      return true;
    }

  }

  /**
   * Savoir si l'élément est actuellement accessible.
   * @todo utliser un cache pour ne pas re-calculer quand pas nécessaire.
   * @todo déclancher re-calcul lorsqu'on change un élément qui influence visible.
   * @param element 
   */
  estAccessible(objet: Objet, eju: ElementsJeuUtils) {
    // si pas dans la pièce -> pas visible
    if (!objet.etats.includes(this.presentID)) {
      return false;
    }
    // si invisible => pas accessible
    if (objet.etats.includes(this.invisibleID)) {
      return false;
    }
    // si couvert -> pas accessible
    if (objet.etats.includes(this.couvertID)) {
      return false;
    }
    // si inaccessible -> pas accessible
    if (objet.etats.includes(this.inaccessibleID)) {
      return false;
    }

    // s’il s’agit d’une PORTE, elle est accessible (car jamais dans un contenant et présente, visible, non couverte)
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.porte)) {
      return true;
      // s’il ne s’agit PAS d’une porte
    } else {
      // on objet non positionné n’est pas accessible
      if (!objet.position) {
        return false;
      }

      // si dans un contenant fermé -> pas accessible
      if (this.estObjetDansUnContenantFermeEtOpaque(objet, eju, false)) {
        return false;
      }

      // l’objet est accessible
      return true;
    }

  }

  /**
   * L’objet est-il dans un contenant fermé et opaque.
   */
  estObjetDansUnContenantFermeEtOpaque(objet: Objet, eju: ElementsJeuUtils, testerOpaque: boolean) {
    if (objet.position.cibleType === EClasseRacine.objet) {
      // récupérer le contenant
      const parent = eju.getObjet(objet.position.cibleId);
      if (parent) {
        // si l'objet est dans un contenant
        if (ClasseUtils.heriteDe(parent.classe, EClasseRacine.contenant)) {
          // si le contenant est fermé
          if (parent.etats.includes(this.fermeID)) {
            // tester également s’il est opaque
            if (testerOpaque && parent.etats.includes(this.opaqueID)) {
              return true; // on s’arrête, il y a un contenant opaque et fermé
              // se contenter de fermé
            } else {
              return true; // on s’arrête, il y a un contenant fermé
            }
          }
        }
        // vérifier également le parent éventuel de l'objet
        return this.estObjetDansUnContenantFermeEtOpaque(parent, eju, testerOpaque);
      } else {
        console.error("estObjetMasqueParUnContenantOpaqueFerme > Pas trouvé le parent \n > obj=", objet, "\n > position=", objet.position);
        return false;
      }
    } else {
      return false;
    }
  }

  /** Récupérer la liste des états */
  obtenirListeDesEtats() {
    return this.etats;
  }

  /** Récupérer un état particulier */
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

  obtenirIntituleEtatPourElementJeu(el: ElementJeu, etatID: number) {

    const feminin = el.genre === Genre.f;
    const pluriel = el.nombre === Nombre.p;
    let retVal: string;

    let etat = this.obtenirEtat(etatID);

    if (feminin) {
      if (pluriel) {
        retVal = etat.nomFP ?? etat.nom;
      } else {
        retVal = etat.nomFS ?? etat.nom;
      }
    } else {
      if (pluriel) {
        retVal = etat.nomMP ?? etat.nom;
      } else {
        retVal = etat.nomMS ?? etat.nom;
      }
    }

    return retVal;
  }

  /** Récupérer la liste des intitulés des états de l’élément spécéfié. */
  obtenirIntitulesEtatsElementJeu(el: ElementJeu) {
    const elEtats = this.obtenirEtatsElementJeu(el);
    const feminin = el.genre === Genre.f;
    const pluriel = el.nombre === Nombre.p;
    const totalEtats = elEtats.length;
    let nbEtats = 0;
    let retVal = totalEtats === 0 ? "(aucun)" : "";
    elEtats.forEach(etat => {
      let curNom: string;
      nbEtats++;
      if (feminin) {
        if (pluriel) {
          curNom = etat.nomFP ?? etat.nom;
        } else {
          curNom = etat.nomFS ?? etat.nom;
        }
      } else {
        if (pluriel) {
          curNom = etat.nomMP ?? etat.nom;
        } else {
          curNom = etat.nomMS ?? etat.nom;
        }
      }
      retVal += curNom + (nbEtats === totalEtats ? "." : (nbEtats === (totalEtats - 1) ? " et " : ", "));
    });
    return retVal;
  }

}
