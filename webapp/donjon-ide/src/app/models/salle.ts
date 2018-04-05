import { ElementDonjon } from './element-donjon';
import { Genre } from './genre.enum';
import { Nombre } from './nombre.enum';

export class Salle implements ElementDonjon {
  constructor(
    public nom: string,
    public determinant: string,
    public genre: Genre,
    public nombre: Nombre,
  ) { }
}
