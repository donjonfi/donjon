import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';

export interface ElementDonjon {
  nom: string;
  determinant: string;
  genre: Genre;
  nombre: Nombre;
}
