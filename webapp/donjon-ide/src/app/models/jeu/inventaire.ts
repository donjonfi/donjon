import { Objet } from './objet';

export class Inventaire {

    /**
     * Objets de jeu présents dans l’inventaire.
     */
    objets: Objet[] = new Array<Objet>();

    /**
     * Capacité de l’inventaire.
     * > -1: illimité.
     */
    capacité = -1;

}
