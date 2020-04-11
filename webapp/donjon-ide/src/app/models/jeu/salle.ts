import { Genre } from '../commun/genre.enum';
import { Inventaire } from './inventaire';
import { Nombre } from '../commun/nombre.enum';
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

    description = "";

    inventaire = new Inventaire();

}