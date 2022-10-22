export class ProgrammationTemps {

  public constructor(
    /** Le nom de la routine programmée */
    public routine: string,
    /** Durée du compte à rebours (en  millisecondes ) */
    public duree: number,
  ) {
    this.debutTemps = Date.now();
    this.routine = this.routine.toLocaleLowerCase();
  }

  // /** La programmation a-t-elle été annulée ? */
  // public annulee: boolean = false;

  /** Heure début chrono (millisecondes depuis 1/1/1970) */
  public debutTemps: number;
}
