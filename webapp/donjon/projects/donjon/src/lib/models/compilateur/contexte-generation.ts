export class ContexteGeneration {

  private _erreurs: string[];

  constructor(
    public verbeux: boolean = false,
  ) {
    this._erreurs = [];
  }

  public get erreurs(): string[] {
    return this._erreurs;
  }

  public ajouterErreur(erreur: string, ligne: number | undefined = undefined) {
    if(ligne){
      erreur = `ligne ${("0000" + ligne).slice(-5)} : ${erreur}`;
    }
    this._erreurs.push("Génération: " + erreur);
    console.error(erreur);
  }

}
