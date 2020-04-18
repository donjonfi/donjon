import { ElementJeu } from './element-jeu';
import { Voisin } from './voisin';

export class Salle extends ElementJeu {

  voisins: Voisin[] = [];

  /** La salle a-t-elle déjà été visitée par le joueur */
  visite = false;

}
