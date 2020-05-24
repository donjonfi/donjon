import { ClasseElement } from '../commun/type-element.enum';
import { Localisation } from './localisation';

export class Voisin {

  constructor(
    public id: number,
    public type: ClasseElement,
    public localisation: Localisation
  ) { }

}
