export class Resultat {

  constructor(
    public succes: boolean,
    public sortie: string,
    public nombre: number
  ) { };

  public stopper: boolean = null;
  public continuer: boolean = null;

}