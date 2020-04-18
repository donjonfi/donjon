import { Localisation } from './localisation';
import { TypeElement } from '../commun/type-element.enum';

export class Voisin {

  constructor(
    public id: number,
    public type: TypeElement,
    public localisation: Localisation
  ) { }

}
