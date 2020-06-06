import { ClasseRacine } from '../commun/classe';
import { Localisation } from './localisation';

export class Voisin {

  constructor(
    public id: number,
    public type: string,
    public localisation: Localisation
  ) { }

}
