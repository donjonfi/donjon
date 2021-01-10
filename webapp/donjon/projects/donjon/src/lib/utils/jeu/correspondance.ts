import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { ElementJeu } from '../../models/jeu/element-jeu';
import { Intitule } from '../../models/jeu/intitule';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';

export class Correspondance {

  localisation: Localisation = null;
  lieux: Lieu[] = [];
  // joueur: Objet[] = [];
  objets: Objet[] = [];

  /** Reprend les lieux et les objets trouvés */
  elements: ElementJeu[] = [];

  intitule: Intitule = null;

  nbCor = 0;

}
