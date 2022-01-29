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

  public ajouterErreur(erreur: string) {
    this._erreurs.push("Génération: " + erreur);
    console.error(erreur);
  }

}
