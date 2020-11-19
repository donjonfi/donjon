import { ElementJeu } from './element-jeu';

export class Inventaire {

    /**
     * Objets de jeu présents dans l’inventaire.
     */
    objets: ElementJeu[] = new Array<ElementJeu>();

    /**
     * Capacité de l’inventaire.
     * > -1: illimité.
     */
    capacité = -1;

}
