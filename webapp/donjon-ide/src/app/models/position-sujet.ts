import { ElementDonjon } from './element-donjon';

export enum PositionRelative {
  /** nord */
  nord,
  /** est */
  est,
  /** sud */
  sud,
  /** ouest */
  ouest,
  /** interieur */
  interieur,
  /** exterieur */
  exterieur,
}

export class PositionSujet {
  constructor(
    public sujet: ElementDonjon,
    public complement: ElementDonjon,
    /** Position du sujet relative au complément */
    public position: PositionRelative,
  ) { }
}
