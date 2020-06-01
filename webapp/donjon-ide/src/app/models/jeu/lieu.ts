import { ElementJeu } from './element-jeu';
import { Voisin } from './voisin';

export class Lieu extends ElementJeu {

  voisins: Voisin[] = [];

  /** Le lieu a-t-il déjà été visité par le joueur */
  visite = false;

}
