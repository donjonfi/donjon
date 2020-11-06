import { ElementJeu } from 'src/app/models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Etat } from 'src/app/models/commun/etat';
import { Genre } from 'src/app/models/commun/genre.enum';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from 'src/app/models/commun/nombre.enum';

export class ListeEtats {

  private etats: Etat[] = [];

  private nextEtat = 1;
  private nextGroupe = 1;

  constructor() {

  }

  creerEtatsInitiaux() {
    this.creerBasculeEtats("présent", "absent");
    this.creerEtat("caché");
    this.creerEtat("couvert");
    this.creerEtat("invisible");
    this.creerBasculeEtats("accessible", "inaccessible");
    this.creerGroupeEtats(["possédé", "disponible", "occupé"]); // à changer ?
    this.creerEtat("porté");
    this.creerBasculeEtats("dénombrable", "indénombrable");
    this.creerEtat("mangeable");
    this.creerEtat("buvable");
    this.creerEtat("ouvrable");
    this.creerBasculeEtats("ouvert", "fermé");
    this.creerEtat("verrouillable");
    this.creerBasculeEtats("verrouillé", "déverrouillé");
    this.creerGroupeEtats(["lumineux", "clair", "sombre", "obscur"]);
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
    let groupe = this.nextGroupe++;
    nomEtats.forEach(nomEtat => {
      this.suiteCreerEtat(nomEtat, genre, nombre, groupe);
    });
  }

  /** Créer une nouvele bascule d'états */
  creerBasculeEtats(nomEtatA, nomEtatB, genre: Genre = Genre.m, nombre: Nombre = Nombre.s) {
    this.suiteCreerEtat(nomEtatA, genre, nombre, null, (this.nextEtat + 1));
    this.suiteCreerEtat(nomEtatA, genre, nombre, null, (this.nextEtat - 1));
  }

  /** Créer un nouvel état */
  creerEtat(nomEtat: string, genre: Genre = Genre.m, nombre: Nombre = Nombre.s): Etat {
    return this.suiteCreerEtat(nomEtat, genre, nombre, null, null);
  }

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

}