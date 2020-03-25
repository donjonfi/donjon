import { Objet } from './objet';

export class Inventaire {

    /**
     * Objets de jeu présents dans l’inventaire.
     */
    ojbets: Objet[] = [];

    /**
     * Capacité de l’inventaire.
     * > -1: illimité.
     */
    capacité = -1;

}
