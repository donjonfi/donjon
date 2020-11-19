import { ClassesRacines } from '../commun/classes-racines';
import { ElementJeu } from './element-jeu';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Voisin } from './voisin';

export class Lieu extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal = null,
    public titre: string,
    classe = ClassesRacines.Lieu,
  ) {
    super(id, nom, intitule, classe);
  }

  voisins: Voisin[] = [];

  /** Le lieu a-t-il déjà été visité par le joueur */
  visite = false;

}
