import { Compteur } from '../../models/compilateur/compteur';
import { Concept } from '../../models/compilateur/concept';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { Intitule } from '../../models/jeu/intitule';
import { Lieu } from '../../models/jeu/lieu';
import { Liste } from '../../models/jeu/liste';
import { Localisation } from '../../models/jeu/localisation';
import { Objet } from '../../models/jeu/objet';

export class Correspondance {

  intitule: Intitule = null;
  localisation: Localisation = null;
  lieux: Lieu[] = [];
  objets: Objet[] = [];
  compteurs: Compteur[] = [];
  concepts: Concept[] = [];
  listes: Liste[] = [];
  /** Reprend les lieux et les objets trouvés */
  elements: ElementJeu[] = [];

  unique: Intitule | undefined;

  nbCor = 0;

}
