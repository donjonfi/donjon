import { ELocalisation } from './localisation';

export class Voisin {

  constructor(
    public id: number,
    /** EClasseRacine.lieu | EClasseRacine.porte */
    public type: string,
    public localisation: ELocalisation
  ) { }

}
