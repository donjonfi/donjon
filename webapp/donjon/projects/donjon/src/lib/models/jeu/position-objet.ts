import { EClasseRacine } from '../commun/constantes';

export class PositionObjet {

  constructor(
    public pre: PrepositionSpatiale,
    public cibleType: EClasseRacine.objet | EClasseRacine.lieu,
    public cibleId: number,
  ) { }

  public static getPrepositionSpatiale(preposition: string) {

    // accepter « à l’intérieur » pour dans
    if (preposition.includes('intérieur') || preposition.includes('dans')) {
      preposition = "dans";
    } else if (preposition.includes('sous')) {
      preposition = "sous";
    } else if (preposition.includes('dessus') || preposition.includes('sur')) {
      preposition = "sur";
    }

    // ne tester que le premier mot (pour retirer le/la/les/du/…)
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
        console.error(`getPrepositionSpatiale: inconnu: ${prepOnly}`);
        return PrepositionSpatiale.inconnu;
    }
  }

  public static prepositionSpatialeToString(prep: PrepositionSpatiale) {

    switch (prep) {
      case PrepositionSpatiale.dans:
        return 'dans';

      case PrepositionSpatiale.sous:
        return 'sous';

      case PrepositionSpatiale.sur:
        return 'sur';

      default:
        return '??';
    }
  }

}

export enum PrepositionSpatiale {
  inconnu = 0,
  dans = 1,
  sur = 2,
  sous = 3,

}
