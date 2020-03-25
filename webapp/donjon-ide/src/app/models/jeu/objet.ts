import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';

export class Objet {

    intitulé: string;
    déterminant: string;
    /**
     * Quantité disponible de l’objet.
     * > -1: illimité.
     */
    quantité: number;
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

}