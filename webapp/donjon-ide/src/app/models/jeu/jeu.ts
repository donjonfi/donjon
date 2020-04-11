import { Auditeur } from '../jouer/auditeur';
import { Inventaire } from './inventaire';
import { Objet } from './objet';
import { Regle } from '../compilateur/regle';
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
      * Tous les objets du jeu, quelque soit leur emplacement actuel.
      */
    objets: Objet[] = [];

    /** Un auditeur écoute un évènement en particulier.
     * Lorsque l'évènement se déclanche, on exécute les actions
     * de l'auditeur.
     */
    auditeurs: Auditeur[] = [];

    regles: Regle[] = [];

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