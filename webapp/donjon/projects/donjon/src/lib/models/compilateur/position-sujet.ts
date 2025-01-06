
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
        case 'en-dessous':
        case 'au-dessous':
        case 'sous':
          retVal = 'sous';
          break;

        case 'dedans':
        case 'dans':
          retVal = 'dans';
          break;

        default:
          retVal = "??";
          break;
      }
    }
    return retVal;

  }

  public toString() {
    return (this.sujet + ' ' + this.position + ' ' + this.complement);
  }

  public positionToString() {
    return (this.position + ' ' + this.complement);
  }

}
