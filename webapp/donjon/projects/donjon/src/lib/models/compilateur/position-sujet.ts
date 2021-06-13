import { ElementDonjon } from './element-donjon';

export class PositionSujetString {
  constructor(
    public sujet: string,
    public complement: string,
    /** Position du sujet relative au complément */
    public position: string,
  ) { }

  /** Retrouver la position correspondante. */
  public static getPosition(position: string) {

    let retVal = '?';

    if (position) {
      switch (position) {
        case 'dessus':
        case 'au-dessus':
        case 'sur':
          retVal = 'sur';
          break;

        case 'dessous':
        case 'au-dessous':
        case 'sous':
          retVal = 'sous';

        case 'dedans':
        case 'dans':
          retVal = 'dans';

        default:
          retVal = "??";
          break;
      }
    }
    return retVal;

  }

}
