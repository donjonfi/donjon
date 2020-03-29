import { Capacite } from './capacite';
import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';
import { PositionSujetString } from './position-sujet';
import { Propriete } from './propriete';
import { TypeElement } from '../commun/type-element.enum';

export class ElementGenerique implements ElementDonjon {

  public description: string;
  public proprietes = new Array<Propriete>();
  public capacites = new Array<Capacite>();

  constructor(
    public determinant: string,
    public nom: string,
    public intituleType: string,
    public type: TypeElement,
    public positionString: PositionSujetString,
    public genre: Genre,
    public nombre: Nombre,
    public quantite: number,
    public attributs: string[],
  ) { }

}
