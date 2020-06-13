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

  visible = false;
  possede = false;
  porte = false;

  denombrable = false;
  mangeable = false;
  buvable = false;

  /** Position de l’objet par rapport à un lieu ou à un autre objet */
  position: PositionObjet = null;

  /** Texte s’affichant lorsqu’on voit l’ojet lors de la description de la salle qui contient l’objet. */
  apercu: string = null;
  /** Texte s’affichant l’orsqu’on examine l’objet. */
  examen: string = null;
  /** L’ojbet a-t-il déjà été examiné par le joueur. */
  examine = false;

}
