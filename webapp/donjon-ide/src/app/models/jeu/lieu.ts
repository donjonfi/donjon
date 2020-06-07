import { Classe, ClassesRacines, EClasseRacine } from '../commun/classe';

import { ElementJeu } from './element-jeu';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Voisin } from './voisin';

export class Lieu extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal = null,
    public titre: string,
    classe: Classe = ClassesRacines.Lieu,
  ) {
    super(id, nom, intitule, classe);
  }

  voisins: Voisin[] = [];

  /** Le lieu a-t-il déjà été visité par le joueur */
  visite = false;

}
