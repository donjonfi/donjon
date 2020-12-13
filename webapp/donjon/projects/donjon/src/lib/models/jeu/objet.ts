import { Classe } from '../commun/classe';
import { ElementJeu } from "./element-jeu";
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Nombre } from '../commun/nombre.enum';
import { PositionObjet } from './position-objet';
import { Reaction } from '../compilateur/reaction';

export class Objet extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal,
    classe: Classe,
    public quantite: number,
    public genre: Genre,
    public nombre: Nombre,
  ) {
    super(id, nom, intitule, classe);
  }

  reactions: Reaction[] = null;

  /** Position de l’objet par rapport à un lieu ou à un autre objet */
  position: PositionObjet = null;

  /** Texte s’affichant lorsqu’on voit l’ojet lors de la description de la salle qui contient l’objet. */
  apercu: string = null;

  /** Ils s’agit des autres noms que le joueur peut donner à cet objet. */
  synonymes: GroupeNominal[] = null;

}
