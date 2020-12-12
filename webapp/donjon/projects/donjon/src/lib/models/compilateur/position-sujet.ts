import { ElementDonjon } from './element-donjon';

export class PositionSujetString {
  constructor(
    public sujet: string,
    public complement: string,
    /** Position du sujet relative au complément */
    public position: string,
  ) { }
}
