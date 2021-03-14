import { EClasseRacine } from '../commun/constantes';

export class PositionObjet {

  constructor(
    public pre: PrepositionSpatiale,
    public cibleType: EClasseRacine.objet | EClasseRacine.lieu,
    public cibleId: number,
  ) { }

  static getPrepositionSpatiale(preposition: string) {

    // accepter « à l’intérieur » pour dans
    if (preposition.startsWith('à l’intérieur') || preposition.startsWith('à l\'intérieur')) {
      preposition = "dans";
    }

    // ne tester que le premier mot (pour retirer le/la/les/)
    const prepOnly = preposition.split(' ')[0];

    switch (prepOnly) {
      case 'sur':
      case 'sûr':
        return PrepositionSpatiale.sur;

      case 'sous':
        return PrepositionSpatiale.sous;

      case 'dans':
        return PrepositionSpatiale.dans;

      default:
        return PrepositionSpatiale.inconnu;
    }
  }

}

export enum PrepositionSpatiale {
  inconnu = 0,
  dans = 1,
  sur = 2,
  sous = 3,
}
