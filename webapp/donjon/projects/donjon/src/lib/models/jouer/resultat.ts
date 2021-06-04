export class Resultat {

  constructor(
    public succes: boolean,
    public sortie: string,
    public nombre: number
  ) { };

  /** il faut stopper l’exécution de l’action (après la règle) */
  public stopperApresRegle: boolean = null;
  /** il faut terminer l’action (avant la sortie de la règle) */
  public terminerAvantRegle: boolean = null;
  /** il faut terminer l’action (après la sortie de la règle) */
  public terminerApresRegle: boolean = null;

}