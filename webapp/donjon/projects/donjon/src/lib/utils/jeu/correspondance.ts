import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { Compteur } from '../../models/compilateur/compteur';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { Intitule } from '../../models/jeu/intitule';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';

export class Correspondance {

  intitule: Intitule = null;
  localisation: Localisation = null;
  lieux: Lieu[] = [];
  objets: Objet[] = [];
  compteurs: Compteur[] = [];
  /** Reprend les lieux et les objets trouvés */
  elements: ElementJeu[] = [];

  nbCor = 0;

}
