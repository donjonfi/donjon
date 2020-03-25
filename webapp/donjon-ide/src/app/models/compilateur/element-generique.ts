import { PositionSujet, PositionSujetString } from './position-sujet';

import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';
import { TypeElement } from '../commun/type-element.enum';

export class ElementGenerique implements ElementDonjon {

  public description: string;

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
