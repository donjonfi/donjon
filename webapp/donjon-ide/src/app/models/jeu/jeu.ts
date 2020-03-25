import { Objet } from './objet';
import { Salle } from './salle';

export class Jeu {

    /**
     * Titre du jeu.
     */
    titre: string;

    /**
     * Salles qui constituent le jeu.
     */
    salles: Salle[];

    /**
     * Objets du jeu en possession du joueur.
     */
    inventaire: Objet[];

    /**
     * Position du joueur.
     * ID d’une Salle du jeu.
     */
    position: number;
}