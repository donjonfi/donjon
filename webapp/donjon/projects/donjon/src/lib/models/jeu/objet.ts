import { Classe } from '../commun/classe';
import { ElementJeu } from "./element-jeu";
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
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
  ) {
    super(id, nom, intitule, classe);
  }

  reactions: Reaction[] = null;

  // /** L’objet se trouve dans la même pièce que le joueur */
  // present = false;
  // /** L’objet est caché => on le trouve si on examine */
  // cache = false;
  // /** L’objet est couvert => on ne le trouve que si on enlève l’obstacle */
  // couvert = false;
  // /** L’objet est invisible => on ne le trouve jamais */
  // invisible = false;
  // /** L’objet est accessible(/inaccessible) */
  // accessible = false;
  // /** L’objet est possédé par le joueur(/disponible) */
  // possede = false;
  // /** L’objet est porté par le joueur */
  // porte = false;
  // /** L’ojet est dénombrable(/indénombrable) */
  // denombrable = false;
  // /** L’objet est mangeable */
  // mangeable = false;
  // /** L’objet est buvable */
  // buvable = false;
  // /*** l’objet est ouvrable */

  // ouvrable = false;
  // /** l’objet est ouvert(/fermé) */
  // ouvert = false;
  // /** l’objet est verrouillable */
  // verrouillable = false;
  // /** L’objet est verrouillé */
  // verrouille = false;

  /** Position de l’objet par rapport à un lieu ou à un autre objet */
  position: PositionObjet = null;

  /** Texte s’affichant lorsqu’on voit l’ojet lors de la description de la salle qui contient l’objet. */
  apercu: string = null;

  /** Ils s’agit des autres noms que le joueur peut donner à cet objet. */
  synonymes: GroupeNominal[] = null;

}
