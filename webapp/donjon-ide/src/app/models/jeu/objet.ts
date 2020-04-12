import { Capacite } from '../compilateur/capacite';
import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';
import { TypeElement } from '../commun/type-element.enum';

export class Objet {

  id: number;

  type: TypeElement;

  intitule: string;
  intituleP: string;
  intituleS: string;
  intituleM: string;
  intituleF: string;
  determinant: string;
  /**
   * Quantité disponible de l’objet.
   * > -1: illimité.
   */
  quantite: number;
  /**
   * Féminin / Masculin / Neutre
   */
  genre: Genre;
  /**
   * Singulier / Pluriel / Indéfini
   */
  nombre: Nombre;
  /**
   * État de l’objet (allumé, fermé, cassé, …)
   */
  etat: string[];

  capacites: Capacite[];

  description: string;

}