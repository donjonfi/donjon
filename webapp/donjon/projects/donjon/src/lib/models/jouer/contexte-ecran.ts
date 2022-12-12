import { BalisesHtml } from "../../utils/jeu/balises-html";

export class ContexteEcran {

  /** L’écran secondaire est-il actuellement affiché (indépendamment du fait que l’écran technique est affiché par dessus ou non) ? */
  private ecranSecondaireAffiche = false;

  /** L’écran technique est-il actuellement affiché (cette écran s’affiche par dessus les autres) ? */
  private ecranTechniqueAffiche = false;

  /** L’écran principal du jeu */
  private _ecranPrincipal = "";

  /** L’écran secondaire du jeu */
  private _ecranSecondaire = "";

  /** L’écran technique du jeu */
  private _ecranTechnique = "";

  constructor(
    private dossierRessourcesComplet: string
  ) { }

  /**
   * Contenu de l’écran à afficher au joueur.
   */
  get ecran(): string {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      return this._ecranTechnique;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      return this._ecranSecondaire;
      // écran principal
    } else {
      return this._ecranPrincipal;
    }
  }

  get ecranPrincipal(): string {
    return this._ecranPrincipal;
  }

  get ecranSecondaire(): string {
    return this._ecranSecondaire;
  }

  /** Effacer l’écran. */
  public effacerEcran() {
    this.remplacerHtml('');
  }

  /** 
   * Ajouter du texte pas encore formaté en html à l’écran. 
   * @param contenuBrut Contenu qui sera converti en HTML.
   * @returns contenu ajouté, converti en HTML.
   */
  public ajouterContenuDonjon(contenuBrut: string): string {
    const contenuHtml = BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet);
    this.ajouterHtml(contenuHtml);
    return contenuHtml
  }

  /** 
   * Ajouter du contenu déjà formaté en HTML à l’écran.
   * @param contenuHtml Contenu HTML.
   * @returns contenu ajouté.
   */
  public ajouterContenuHtml(contenuHtml: string): string {
    this.ajouterHtml(contenuHtml);
    return contenuHtml;
  }

  /**
   * Ajouter un paragraphe avec le contenu spécifié.
   * @param contenuBrut Contenu qui sera converti en HTML.
   * @returns le paragraphe ajouté, converti en HTML.
   */
  public ajouterParagrapheDonjon(contenuBrut: string): string {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet) + '</p>';
    this.ajouterHtml(contenuHtml);
    return contenuHtml;
  }

  /**
   * Ajouter un paragraphe ouvert avec le contenu spécifié.
   * @param contenuBrut Contenu qui sera converti en HTML.
   * @returns le paragraphe ajouté, converti en HTML.
   */
  public ajouterParagrapheDonjonOuvert(contenuBrut: string): string {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet);
    this.ajouterHtml(contenuHtml);
    return contenuHtml;
  }

  /**
   * Ajouter un paragraphe avec le contenu spécifié.
   * @param contenuHtml Contenu HTML.
   * @returns le paragraphe ajouté.
   */
  public ajouterParagrapheHtml(contenuHtml: string): string {
    contenuHtml = '<p>' + contenuHtml + '</p>';
    this.ajouterHtml(contenuHtml);
    return contenuHtml;
  }

  public fermerParagrahpe() {
    this.ajouterHtml('</p>');
  }

  public sautParagraphe() {
    this.ajouterHtml('</p><p>');
  }

  /**
   * Effacer l’écran et commencer un nouveau paragraphe puis ajouter le contenu spécifié qui est déjà au format HTML.
   * @param contenuHtml Contenu HTML.
   */
  public remplacerContenuHtml(contenuHtml: string) {
    contenuHtml = '<p>' + contenuHtml;
    this.remplacerHtml(contenuHtml);
  }

  /**
   * Effacer l’écran et commencer un nouveau paragraphe puis ajouter le contenu spécifié qui sera converti au format HTML.
   * @param contenuBrut Contenu qui sera converti en HTML.
   */
  public remplacerContenuDonjon(contenuBrut: string) {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet);
    this.ajouterHtml(contenuHtml);
  }

  private ajouterHtml(contenuHtml: string) {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      this._ecranTechnique += contenuHtml;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      this._ecranSecondaire += contenuHtml;
      // écran principal
    } else {
      this._ecranPrincipal += contenuHtml;
    }
  }

  private remplacerHtml(contenuHtml: string) {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      this._ecranTechnique = contenuHtml;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      this._ecranSecondaire = contenuHtml;
      // écran principal
    } else {
      this._ecranPrincipal = contenuHtml;
    }
  }

}