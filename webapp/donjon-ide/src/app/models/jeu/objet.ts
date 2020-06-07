import { Classe } from '../commun/classe';
import { ElementJeu } from "./element-jeu";
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { PositionObjet } from './position-objet';

export class Objet extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal,
    classe: Classe,
    public quantite: number,
    public genre: Genre,
  ) {
    super(id, nom, intitule, classe);
  }

  denombrable: boolean;
  mangeable: boolean;
  buvable: boolean;

  /** Position de l’objet par rapport à un lieu ou à un autre objet */
  position: PositionObjet;

  /** Texte s’affichant lorsqu’on voit l’ojet lors de la description de la salle qui contient l’objet. */
  apercu: string;
  /** Texte s’affichant l’orsqu’on examine l’objet. */
  examen: string;
  /** L’ojbet a-t-il déjà été examiné par le joueur. */
  examine: boolean;

}
