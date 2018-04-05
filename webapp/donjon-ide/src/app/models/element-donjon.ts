import { Genre } from './genre.enum';
import { Nombre } from './nombre.enum';


export interface ElementDonjon {
  nom: string;
  determinant: string;
  genre: Genre;
  nombre: Nombre;
}
