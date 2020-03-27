import { Inventaire } from './inventaire';
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
    salles: Salle[] = [];

    /**
     * Objets du jeu en possession du joueur.
     */
    inventaire: Inventaire = new Inventaire();

    /**
     * Position du joueur.
     * ID d’une Salle du jeu.
     */
    position: number;
}