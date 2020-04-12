import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';

export class Porte {

  /**
   * Identifiant de la porte.
   */
  id: number;

  /**
   * Nom de la porte (sans le déterminant).
   */
  nom: string;

  /**
   * Intitulé de la porte.
   */
  intitule: string;

  /** Description de la porte. */
  description = "";

  /**
   * Déterminant qui précède l’intitulé de la porte.
   */
  determinant: string;

  /**
   * Genre de la porte.
   */
  genre: Genre;
  /**
   * Nombre de la porte:
   * - Singulier
   * - Pluriel
   * - Indéfini
   */
  nombre: Nombre;

  /**
   * État de l’objet
   * - ouvrable
   * - verrouillable
   * - ouverte
   * - verrouillee
   */
  etat: string[] = [];

}
