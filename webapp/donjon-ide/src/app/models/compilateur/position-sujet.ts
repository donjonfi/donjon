import { ElementDonjon } from './element-donjon';

export enum PositionRelative {
  /** nord */
  nord = 's',
  /** est */
  est = 'e',
  /** sud */
  sud = 's',
  /** ouest */
  ouest = 'o',
  /** intérieur */
  interieur = 'i',
  /** extérieur */
  exterieur = 'x',
}

export class PositionSujet {
  constructor(
    public sujet: ElementDonjon,
    public complement: ElementDonjon,
    /** Position du sujet relative au complément */
    public position: PositionRelative,
  ) { }
}

export class PositionSujetString {
  constructor(
    public sujet: string,
    public complement: string,
    /** Position du sujet relative au complément */
    public position: string,
  ) { }
}