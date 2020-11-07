import { EClasseRacine } from '../commun/constantes';

export class PositionObjet {

  constructor(
    public pre: PrepositionSpatiale,
    public cibleType: EClasseRacine.objet | EClasseRacine.lieu,
    public cibleId: number,
  ) { }

  static getPrepositionSpatiale(preposition: string) {
    switch (preposition) {
      case 'sur':
      case 'sûr':
        return PrepositionSpatiale.sur;

      case 'sous':
        return PrepositionSpatiale.sous;

      case 'dans':
        return PrepositionSpatiale.dans;

      default:
        return PrepositionSpatiale.inconnu;
        break;
    }
  }

}

export enum PrepositionSpatiale {
  inconnu = 0,
  dans = 1,
  sur = 2,
  sous = 3,
}
