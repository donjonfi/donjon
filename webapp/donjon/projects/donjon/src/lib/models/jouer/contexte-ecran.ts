import { BalisesHtml } from "../../utils/jeu/balises-html";

export class ContexteEcran {

  /** L’écran secondaire est-il actuellement affiché (indépendamment du fait que l’écran technique est affiché par dessus ou non) ? */
  private ecranSecondaireAffiche = false;

  /** L’écran technique est-il actuellement affiché (cette écran s’affiche par dessus les autres) ? */
  private ecranTechniqueAffiche = false;

  /** L’écran principal du jeu */
  private ecranPrincipal = "";

  /** L’écran secondaire du jeu */
  private ecranSecondaire = "";

  /** L’écran technique du jeu */
  private ecranTechnique = "";

  constructor(
    private dossierRessourcesComplet: string
  ) { }

  /**
   * Obtenir le contenu de l’écran à afficher au joueur.
   */
  get ecran(): string {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      return this.ecranTechnique;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      return this.ecranSecondaire;
      // écran principal
    } else {
      return this.ecranPrincipal;
    }
  }

  /** Effacer l’écran. */
  public effacerEcran() {
    this.remplacerHtml('');
  }

  /** Ajouter du texte pas encore formaté en html à l’écran. */
  public ajouterContenuBrut(contenuBrut: string) {
    const contenuHtml = BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet);
    this.ajouterHtml(contenuHtml);
  }

  /** 
   * Ajouter du contenu déjà formaté en HTML à l’écran.
   * @param contenuHtml Contenu HTML.
   */
  public ajouterContenuHtml(contenuHtml: string) {
    this.ajouterHtml(contenuHtml);
  }

  /**
   * Ajouter un paragraphe avec le contenu spécifié.
   * @param contenuBrut Contenu qui sera converti en HTML.
   */
  public ajouterParagrapheBrut(contenuBrut: string) {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet) + '</p>';
    this.ajouterHtml(contenuHtml);
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
  public remplacerContenuBrut(contenuBrut: string) {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet);
    this.ajouterHtml(contenuHtml);
  }

  private ajouterHtml(contenuHtml: string) {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      this.ecranTechnique += contenuHtml;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      this.ecranSecondaire += contenuHtml;
      // écran principal
    } else {
      this.ecranPrincipal += contenuHtml;
    }
  }

  private remplacerHtml(contenuHtml: string) {
    // écran technique
    if (this.ecranTechniqueAffiche) {
      this.ecranTechnique = contenuHtml;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      this.ecranSecondaire = contenuHtml;
      // écran principal
    } else {
      this.ecranPrincipal = contenuHtml;
    }
  }

}