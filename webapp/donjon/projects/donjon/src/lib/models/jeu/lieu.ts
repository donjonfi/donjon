import { ClassesRacines } from '../commun/classes-racines';
import { ElementJeu } from './element-jeu';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Voisin } from './voisin';

export class Lieu extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal = null,
    titre: string,
    classe = ClassesRacines.Lieu,
  ) {
    super(id, nom, intitule, classe);
    this.titre = titre;
  }

  voisins: Voisin[] = [];

}
