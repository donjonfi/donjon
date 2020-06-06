import { ClasseRacine } from '../commun/classe';
import { ElementJeu } from './element-jeu';
import { Voisin } from './voisin';

export class Lieu extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    public titre: string,
    // intitule: GroupeNominal = null,
    classe: string = ClasseRacine.lieu,
  ) {
    super(id, nom, classe);
  }

  voisins: Voisin[] = [];

  /** Le lieu a-t-il déjà été visité par le joueur */
  visite = false;

}
