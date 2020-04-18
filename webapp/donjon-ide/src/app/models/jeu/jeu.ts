import { Auditeur } from '../jouer/auditeur';
import { ElementJeu } from './element-jeu';
import { Inventaire } from './inventaire';
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

  // /**
  //  * Portes qui séparent les salles.
  //  */
  // portes: Porte[] = [];

  /**
   * Tous les éléments du jeu excepté les salles.
   */
  elements: ElementJeu[] = [];

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