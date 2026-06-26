import { CategorieMessage, CodeMessage, EMessageAnalyse, MessageAnalyse } from "./message-analyse";

export class ContexteGeneration {

  private _erreurs: string[];

  /** Messages codés émis lors de la génération (avec lien wiki). */
  public messages: MessageAnalyse[] = [];

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

  /**
   * Signaler un problème de génération sous forme de message codé (avec lien wiki),
   * tout en conservant le canal d’erreurs historique (`erreurs` → `tamponErreurs`)
   * pour l’affichage au lancement du jeu.
   */
  public probleme(categorie: CategorieMessage, code: CodeMessage, titre: string, corps: string, ligne: number | undefined = undefined) {
    this.messages.push(new MessageAnalyse(EMessageAnalyse.probleme, undefined, categorie, code, titre, corps, undefined, false, ligne));
    this.ajouterErreur(corps, ligne);
  }

}
