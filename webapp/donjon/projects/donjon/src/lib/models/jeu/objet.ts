import { Classe } from '../commun/classe';
import { ElementJeu } from "./element-jeu";
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Nombre } from '../commun/nombre.enum';
import { PositionObjet } from './position-objet';
import { PresenceFond } from '../compilateur/presence-fond';
import { RoutineReaction } from '../compilateur/routine-reaction';

export class Objet extends ElementJeu {

  constructor(
    id: number,
    nom: string,
    intitule: GroupeNominal,
    classe: Classe,
    quantite: number,
    genre: Genre,
    nombre: Nombre,
  ) {
    super(id, nom, intitule, classe);
    this.quantite = quantite;
    this.genre = genre;
    this.nombre = nombre;
  }

  /** ID de l’objet dont celui-ci est une copie. */
  idOriginal: number;

  reactions: RoutineReaction[] = null;

  /** Position de l’objet par rapport à un lieu ou à un autre objet */
  position: PositionObjet = null;

  /** Fond « commun » (partagé) : présence multi-lieux résolue dynamiquement par prédicat.
   *  null si l’objet n’est pas un fond partagé (les instances « propre à chaque lieu » sont
   *  localisées normalement par leur `position`). */
  presenceFond: PresenceFond = null;

}
