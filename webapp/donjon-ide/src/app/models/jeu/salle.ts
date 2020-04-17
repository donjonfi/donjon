import { Genre } from '../commun/genre.enum';
import { Inventaire } from './inventaire';
import { Nombre } from '../commun/nombre.enum';
import { Porte } from './porte';
import { Voisin } from './voisin';

export class Salle {

  /**
   * Identifiant de la salle.
   */
  id: number;

  /**
   * Nom de la salle (sans le déterminant).
   */
  nom: string;

  /**
   * Intitulé de la salle.
   */
  intitule: string;

  /** Description de la salle. */
  description = "";

  /** Nombre d'affichages de la description */
  nbAffichageDescription = 0;

  /**
   * Déterminant qui précède l’intitulé de la salle.
   */
  determinant: string;

  /**
   * Genre de la salle.
   */
  genre: Genre;
  /**
   * Nombre de la salle :
   * - Singulier
   * - Pluriel
   * - Indéfini
   */
  nombre: Nombre;
  /**
   * État de l’objet (allumé, fermé, cassé, …)
   */
  etat: string[] = [];

  voisins: Voisin[] = [];

  inventaire = new Inventaire();

  /** La salle a-t-elle déjà été visitée par le joueur */
  visite = false;

}
