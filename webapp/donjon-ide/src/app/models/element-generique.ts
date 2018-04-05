import { ElementDonjon } from './element-donjon';
import { Genre } from './genre.enum';
import { Nombre } from './nombre.enum';
import { PositionSujet, PositionSujetString } from './position-sujet';
import { TypeElement } from './type-element.enum';

export class ElementGenerique implements ElementDonjon {

  constructor(
    public determinant: string,
    public nom: string,
    public type: TypeElement,
    public positionString: PositionSujetString,
    public genre: Genre,
    public nombre: Nombre,
  ) { }

}
