import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';

import { Etat } from '../../models/commun/etat';
import { Genre } from '../../models/commun/genre.enum';
import { Nombre } from '../../models/commun/nombre.enum';
import { Concept } from '../../models/compilateur/concept';
import { ContexteGeneration } from '../../models/compilateur/contexte-generation';
import { LienCondition } from '../../models/compilateur/lien-condition';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';
import { ClasseUtils } from '../commun/classe-utils';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { MotUtils } from '../commun/mot-utils';

export class ListeEtats {

  public mentionneID = -1;
  public vuID = -1;
  public familierID = -1;

  public presentID = -1;
  public visiteID = -1;
  public intactID = -1;
  public deplaceID = -1;
  public modifieID = -1;
  public cacheID = -1;
  public discretID = -1;
  public couvrantID = -1;
  public couvertID = -1;
  public visibleID = -1;
  public invisibleID = -1;
  public secretID = -1;
  public accessibleID = -1;
  public inaccessibleID = -1;
  public possedeID = -1;
  public disponibleID = -1;
  public occupeID = -1;
  public porteID = -1;
  public enfileID = -1;
  public chausseID = -1;
  public equipeID = -1;
  public ouvertID = -1;
  public ouvrableID = -1;
  public fermeID = -1;
  public verrouilleID = -1;
  public verrouillableID = -1;
  public lisibleID = -1;
  public opaqueID = -1;
  public transparentID = -1;
  public transportableID = -1;
  public adjacentID = -1;
  public fixeID = -1;
  public decoratifID = -1;
  public clairID = -1;
  public eclaireID = -1;
  public obscurID = -1;
  public videID = -1;
  public indenombrableID = -1;
  public solideID = -1;
  public liquideID = -1;
  public gazeuxID = -1;
  public permeableID = -1;
  public impermeableID = -1;

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
    // mentionné (concept), vu (élément jeu) et familier (élément jeu)
    this.mentionneID = this.creerEtat(EEtatsBase.mentionne).id;
    this.vuID = this.creerEtat(EEtatsBase.vu).id;
    this.ajouterImplication(EEtatsBase.vu, EEtatsBase.mentionne);
    this.familierID = this.creerEtat(EEtatsBase.familier).id;
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
    // secret, caché, couvert, couvrant, invisible (objet)
    this.discretID = this.creerEtat(EEtatsBase.discret).id;
    this.cacheID = this.creerEtat(EEtatsBase.cache).id;
    this.ajouterContradiction(EEtatsBase.cache, EEtatsBase.vu);
    this.secretID = this.creerEtat(EEtatsBase.secret).id;
    this.ajouterImplication(EEtatsBase.secret, EEtatsBase.cache);
    this.ajouterContradiction(EEtatsBase.secret, EEtatsBase.mentionne);
    this.ajouterContradiction(EEtatsBase.secret, EEtatsBase.vu);
    this.couvertID = this.creerEtat(EEtatsBase.couvert).id;
    this.couvrantID = this.creerEtat(EEtatsBase.couvrant).id;
    this.invisibleID = this.creerEtat(EEtatsBase.invisible).id;
    this.visibleID = this.creerEtat(EEtatsBase.visible, Genre.m, Nombre.s, true).id;
    // accessible, inaccessible (objet)
    this.accessibleID = this.creerEtat(EEtatsBase.accessible, Genre.m, Nombre.s, true).id;
    this.inaccessibleID = this.creerEtat(EEtatsBase.inaccessible).id;
    // possédé, disponible et occupé (objet)
    const poDiOc = this.creerGroupeEtats([EEtatsBase.possede, EEtatsBase.disponible, EEtatsBase.occupe], Genre.m, Nombre.s);
    this.possedeID = poDiOc[0].id;
    this.disponibleID = poDiOc[1].id;
    this.occupeID = poDiOc[2].id;
    // porté (objet)
    this.porteID = this.creerEtat(EEtatsBase.porte, Genre.m, Nombre.s, true).id;
    this.enfileID = this.creerEtat(EEtatsBase.enfile, Genre.m, Nombre.s, true).id;
    this.chausseID = this.creerEtat(EEtatsBase.chausse, Genre.m, Nombre.s, true).id;
    this.equipeID = this.creerEtat(EEtatsBase.equipe, Genre.m, Nombre.s, true).id;
    // this.ajouterImplication(EEtatsBase.porte, EEtatsBase.possede);
    // dénombrable et indénombrable (objet)
    const denInden = this.creerBasculeEtats(EEtatsBase.denombrable, EEtatsBase.indenombrable);
    this.indenombrableID = denInden[1].id;
    // unique, multiple, illimité
    this.creerBasculeEtats(EEtatsBase.unique, EEtatsBase.multiple);
    this.creerEtat(EEtatsBase.illimite);
    this.ajouterContradiction(EEtatsBase.unique, EEtatsBase.illimite);
    // mangeable, buvable
    this.creerEtat(EEtatsBase.mangeable);
    this.creerEtat(EEtatsBase.buvable);
    // portable, enfilable, équipable, chaussable (vêtements, armes, bijoux, …)
    this.creerEtat(EEtatsBase.portable);
    this.creerEtat(EEtatsBase.enfilable);
    this.creerEtat(EEtatsBase.equipable);
    this.creerEtat(EEtatsBase.chaussable);
    // ouvrable, ouvert, fermé (porte, contenant)
    this.ouvrableID = this.creerEtat(EEtatsBase.ouvrable).id;
    const ouvFer = this.creerBasculeEtats(EEtatsBase.ouvert, EEtatsBase.ferme);
    this.ouvertID = ouvFer[0].id;
    this.fermeID = ouvFer[1].id;
    // verrouillable, verrouillé, déverrouillé (porte, contenant)
    this.verrouillableID = this.creerEtat(EEtatsBase.verrouillable).id;
    const verrDeve = this.creerBasculeEtats(EEtatsBase.verrouille, EEtatsBase.deverrouille);
    this.verrouilleID = verrDeve[0].id;
    // lisible (objet que l’on peut lire)
    this.lisibleID = this.creerEtat(EEtatsBase.lisible).id;
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
    this.creerEtat(EEtatsBase.lu, Genre.m, Nombre.s, false);
    this.ajouterContradiction(EEtatsBase.intact, EEtatsBase.lu); // est-ce une bonne idée ?
    // vide (contenant)
    this.videID = this.creerEtat(EEtatsBase.vide, Genre.m, Nombre.s, true).id;
    // solide, liquide et gazeux (objet)
    const soLiGa = this.creerGroupeEtats([EEtatsBase.solide, EEtatsBase.liquide, EEtatsBase.gazeux]);
    this.solideID = soLiGa[0].id;
    this.liquideID = soLiGa[1].id;
    this.gazeuxID = soLiGa[2].id;
    // perméable et imperméable (contenant)
    const permImperm = this.creerBasculeEtats(EEtatsBase.permeable, EEtatsBase.impermeable);
    this.permeableID = permImperm[0].id;
    this.impermeableID = permImperm[1].id;
  }

  /**
   * Trouver un état sur base de son nom.
   * @returns l'état correspondant ou null si pas trouvé.
   */
  trouverEtat(nomEtat: string): Etat | null {
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

    if (!retVal) {
      console.log(`Pas trouvé état: ${nomEtat} \nétats:`, this.etats.join(", "));
    }

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

  /**
   * spécifier que étatImpliquant implique étatImpliqué
   */
  ajouterImplication(nomEtatImpliquant: string, nomEtatImplique: string) {
    let etatImpliquant = this.trouverEtat(nomEtatImpliquant);
    let etatImplique = this.trouverEtat(nomEtatImplique);
    if (etatImpliquant && etatImplique) {      
      // ajouter nomEtatImplique aux implications de nomEtatImpliquant
      if (!etatImpliquant.implications) {
        etatImpliquant.implications = [etatImplique.id];
      } else if (!etatImpliquant.implications.includes(etatImplique.id)) {
        etatImpliquant.implications.push(etatImplique.id);
      }
      // ajouter également toutes les implications de nomEtatImplique à celles de nomEtatImpliquant
      if (etatImplique.implications) {
        etatImplique.implications.forEach(implication => {
          if (!etatImpliquant.implications.includes(implication)) {
            etatImpliquant.implications.push(implication);
          }
        });
      }

      // console.warn(`Implications de ${etatImpliquant.nom}: ${etatImpliquant.implications.join(',')}`);

      // modifier tous les éléments qui impliquent nomEtatImpliquant: ils doivent impliquer les implications de étatA
      this.etats.forEach(autreEtat => {
        // si implique nomEtatImpliquant
        if (autreEtat.implications && autreEtat.implications.includes(etatImpliquant.id)) {
          // ajouter les implication de nomEtatImpliquant
          etatImpliquant.implications.forEach(implication => {
            if (!autreEtat.implications.includes(implication)) {
              autreEtat.implications.push(implication);
            }
          });
        }
      });

    } else {
      if (!nomEtatImpliquant) {
        console.error(`ajouterImplication >> pas trouvé état impliquant ${nomEtatImpliquant}`);
      }
      if (!nomEtatImplique) {
        console.error(`ajouterImplication >> pas trouvé état impliqué ${nomEtatImplique}`);
      }
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

  /** Ajouter un état à l'élément (évite les doublons mais PAS de contrôle des états calculés ni des bascules ni des groupes ni des contradictions ni des implications). */
  ajouterEtatIdElement(element: Concept, etatID: number, eju: ElementsJeuUtils) {
    if (!this.possedeEtatIdElement(element, etatID, eju)) {
      element.etats.push(etatID);
    }
  }

  /** Ajouter un état à l'élément (contrôle des doublons, des états calculés, des bascules, des groupes et des contradictions). */
  ajouterEtatElement(conceptCible: Concept, nomEtat: string, ejuOuCtxGen: ElementsJeuUtils | ContexteGeneration, forcerCalcul: boolean = false) {

    const etatAjoute = this.trouverOuCreerEtat(nomEtat, conceptCible.genre, conceptCible.nombre);

    if (etatAjoute.calcule && !forcerCalcul) {
      ejuOuCtxGen.ajouterErreur("ajouterEtatElement >> L’état « " + etatAjoute.nom + " » est un état calculé. Cela signifie qu’on ne peut pas le modifier directement.");
      // état classique
    } else {
      // s'il s'agit d'un état faisant partie d'un groupe
      if (etatAjoute.groupe !== null) {
        // retirer tous les états existants pour ce groupe
        const idsEtatsDuGroupe = this.etats.filter(x => x.groupe === etatAjoute.groupe).map(x => x.id);
        conceptCible.etats = conceptCible.etats.filter(x => !idsEtatsDuGroupe.includes(x));
        // ajouter le nouvel état
        conceptCible.etats.push(etatAjoute.id);
        // sinon, ajouter l'état s'il n'y est pas encore
      } else {
        if (!conceptCible.etats.includes(etatAjoute.id)) {
          conceptCible.etats.push(etatAjoute.id);
          // s’il s’agit d’une bascule, enlever l’autre état
          if (etatAjoute.bascule) {
            // ne garder que les autres états
            conceptCible.etats = conceptCible.etats.filter(x => x !== etatAjoute.bascule);
          }
        }
      }
      // si le nouvel état a des implications
      if (etatAjoute.implications?.length) {
        this.appliquerImplications(conceptCible, etatAjoute.implications)
      }
      // si le nouvel état a des contradictions
      if (etatAjoute.contradictions?.length) {
        // retirer les contradictions
        conceptCible.etats = conceptCible.etats.filter(x => !etatAjoute.contradictions.includes(x));
      }
    }
  }

  /**
   * Ajouter les nouvelles implications à l’état cible s’il ne les a pas encore
   * @param etatCible 
   * @param implicationsNouvelEtat 
   */
  private appliquerImplications(conceptCible: Concept, implicationsNouvelEtat: number[]) {
    let implicationsManquantes = implicationsNouvelEtat.filter(x => !conceptCible.etats.includes(x));
    conceptCible.etats.push(...implicationsManquantes);
  }

  /** Retirer un état à un élément */
  retirerEtatElement(element: Concept, nomEtat: string, ejuOuCtxGen: ElementsJeuUtils | ContexteGeneration, forcerCalcul: boolean = false) {
    const etat = this.trouverEtat(nomEtat);
    // on ne peut le retirer que s'il existe...
    if (etat !== null) {
      // vérifier s’il s’agit d’un état calculé
      if (etat.calcule && !forcerCalcul) {
        ejuOuCtxGen.ajouterErreur("retirerEtatElement >> L’état « " + etat.nom + " » est un état calculé. Cela signifie qu’on ne peut pas le modifier directement.");
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
  possedeEtatIdElement(element: Concept, etatID: number, eju: ElementsJeuUtils = null) {
    let retVal = false;
    if (element) {
      // A. VISIBLE
      if (etatID === this.visibleID) {
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return element.id == eju.curLieu.id;
          // objet
        } else if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return this.estVisible((element as Objet), eju);
        } else {
          return false;
        }
        // B. ACCESSIBLE
      } else if (etatID === this.accessibleID) {
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return this.estAccessible((element as Objet), eju);
        } else {
          return false;
        }
        // C. VIDE
      } else if (etatID === this.videID) {
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.support) || ClasseUtils.heriteDe(element.classe, EClasseRacine.contenant) || ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return this.estVide(element as ElementJeu, eju);
        } else {
          return false;
        }
        // D. DIVERS
      } else {
        retVal = element.etats.includes(etatID);
      }
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
  possedeEtatElement(element: Concept, nomEtat: string, eju: ElementsJeuUtils) {
    let retVal = false;
    if (element) {
      if (nomEtat === 'visible' || nomEtat === 'visibles') {
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          // lieu visible si lieu courant ou adjacent et pas invisible
          return (element.id == eju.curLieu.id || (this.possedeEtatIdElement(element, this.adjacentID, eju) && !this.possedeEtatIdElement(element, this.invisibleID, eju))); ;
          // objet
        } else if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return this.estVisible((element as Objet), eju);
          // simple concept
        } else {
          return false;
        }

      } else if (nomEtat.match(/^accessible(s)?$/)) {
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return eju.estLieuAccessible(element as Lieu);
          // objet
        } else if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return this.estAccessible((element as Objet), eju);
          // simple concept
        } else {
          return false;
        }
      } else if (nomEtat.match(/^vide(s)?$/)) {
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return eju.estLieuAccessible(element as Lieu);
          // objet
        } else if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return this.estVide((element as Objet), eju);
          // simple concept
        } else {
          return false;
        }
      } else if (nomEtat.match(/^obstrué(e)?(s)?$/)) {
        // lieu
        if (ClasseUtils.heriteDe(element.classe, EClasseRacine.lieu)) {
          return !eju.estLieuAccessible(element as Lieu);
          // objet
        } else if (ClasseUtils.heriteDe(element.classe, EClasseRacine.objet)) {
          return !this.estAccessible((element as Objet), eju);
          // simple concept
        } else {
          return false;
        }
      } else {
        let etat = this.trouverEtat(nomEtat);
        if (etat) {

          // conseil inaccessible
          if (nomEtat.match(/^inaccessible(s)?$/)) {
            eju.ajouterConseil("L’état « inaccessible » n’est PAS l’inverse de « accessible ». Pour tester si un élément est accessible faites vos tests sur l’état « accessible ».");
            // conseil invisible
          } else if (nomEtat.match(/^invisible(s)?$/)) {
            eju.ajouterConseil("L’état « invisible » n’est PAS l’inverse de « visible ». Pour tester si un élément est visible faites vos tests sur l’état « visible ».");
          }

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
   * @todo déclencher re-calcul lorsqu'on change un élément qui influence visible.
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

    // si secret -> pas visible
    if (objet.etats.includes(this.secretID)) {
      return false;
    }

    // s’il s’agit d’un OBSTACLE (dont portes), il est visible (car jamais dans un contenant et présente, visible, non couverte)
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.obstacle)) {
      return true;
      // s’il ne s’agit PAS d’un obstacle
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
   * @todo déclencher re-calcul lorsqu'on change un élément qui influence visible.
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
    // si secret -> pas accessible
    if (objet.etats.includes(this.secretID)) {
      return false;
    }
    // si inaccessible -> pas accessible
    if (objet.etats.includes(this.inaccessibleID)) {
      return false;
    }

    // s’il s’agit d’un OBSTACLE (dont portes), il est accessible (car jamais dans un contenant et présente, visible, non couverte)
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.obstacle)) {
      return true;
      // s’il ne s’agit PAS d’un obstacle
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

  estVide(objet: ElementJeu, eju: ElementsJeuUtils) {
    if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.support) || ClasseUtils.heriteDe(objet.classe, EClasseRacine.lieu)) {
      return eju.obtenirContenu(objet, PrepositionSpatiale.sur).length == 0;
    } else if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.contenant)) {
      return eju.obtenirContenu(objet, PrepositionSpatiale.dans).length == 0;
    } else {
      console.warn("estVide: l'élément n'est ni un support ni un contenant ni un lieu:", objet);
      return false;
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

        if (parent.id === objet.id) {
          throw new Error("estObjetDansUnContenantFermeEtOpaque >>> l’objet est positionné sur lui même !\n" + JSON.stringify(objet));
        } else {
          // si l'objet est dans un contenant
          if (ClasseUtils.heriteDe(parent.classe, EClasseRacine.contenant)) {
            // si le contenant est fermé
            if (parent.etats.includes(this.fermeID)) {
              // tester également s’il est opaque
              if (testerOpaque) {
                if (parent.etats.includes(this.opaqueID)) {
                  // on s’arrête, il y a un contenant opaque et fermé
                  return true;
                } else {
                  // on continue, le contenant est fermé mais transparent
                }
                // se contenter de fermé
              } else {
                return true; // on s’arrête, il y a un contenant fermé
              }
            }
          }
          // vérifier également le parent éventuel de l'objet
          return this.estObjetDansUnContenantFermeEtOpaque(parent, eju, testerOpaque);
        }
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
  obtenirEtatsElementJeu(el: Concept) {
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

  /** Récupérer la liste des intitulés des états de l’élément spécifié. */
  obtenirIntitulesEtatsElementJeu(el: Concept) {
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
