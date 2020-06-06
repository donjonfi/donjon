import { ElementJeu } from '../models/jeu/element-jeu';
import { Lieu } from '../models/jeu/lieu';
import { Localisation } from '../models/jeu/localisation';
import { Objet } from '../models/jeu/objet';

export class Correspondance {

  localisation: Localisation = null;
  lieux: Lieu[] = [];
  // joueur: Objet[] = [];
  objets: Objet[] = [];

  /** Reprend les lieux et les objets trouvés */
  elements: ElementJeu[] = [];

}
