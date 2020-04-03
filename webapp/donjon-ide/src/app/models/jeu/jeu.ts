import { Auditeur } from '../jouer/auditeur';
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

    /** Un auditeur écoute un évènement en particulier.
     * Lorsque l'évènement se déclanche, on exécute les actions
     * de l'auditeur.
     */
    auditeurs: Auditeur[] = [];

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