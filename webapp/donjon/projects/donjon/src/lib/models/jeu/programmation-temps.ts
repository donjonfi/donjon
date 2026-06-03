export class ProgrammationTemps {

  public constructor(
    /** Le nom de la routine programmée */
    public routine: string,
    /** Durée du compte à rebours (en  millisecondes ) */
    public duree: number,
    /**
     * Trailer brut des arguments tel qu’écrit dans le scénario (la partie après « avec »),
     * ou undefined si la routine programmée n’a pas d’arguments. Les arguments sont résolus
     * **au déclenchement** (fire-time), pas à la programmation.
     */
    public argsTrailer?: string,
  ) {
    this.debutTemps = Date.now();
    this.routine = this.routine.toLocaleLowerCase();
  }

  // /** La programmation a-t-elle été annulée ? */
  // public annulee: boolean = false;

  /** Heure début chrono (millisecondes depuis 1/1/1970) */
  public debutTemps: number;
}
