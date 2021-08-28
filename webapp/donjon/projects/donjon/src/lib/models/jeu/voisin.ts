import { ELocalisation } from './localisation';

export class Voisin {

  constructor(
    public id: number,
    /** EClasseRacine.lieu | EClasseRacine.obstacle | EClasseRacine.porte */
    public type: string,
    public localisation: ELocalisation
  ) { }

}
