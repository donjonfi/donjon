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

  /**
   * Ajouter le voisin s’il n’existe pas encore (afin d’éviter les doublons)
   * @param newVoisin 
   */
  ajouterVoisin(newVoisin: Voisin) {
    let existeDeja = false;
    this.voisins.forEach(curVoisin => {
      if (curVoisin.id == newVoisin.id && curVoisin.localisation == newVoisin.localisation && curVoisin.type == newVoisin.type) {
        existeDeja = true;
      }
    });
    if (!existeDeja) {
      this.voisins.push(newVoisin);
    }
  }

}
