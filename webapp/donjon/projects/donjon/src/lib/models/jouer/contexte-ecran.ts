import { BalisesHtml } from "../../utils/jeu/balises-html";

/**
 * Taille d’une « page » de la sortie : nombre de tours de l’écran principal gardés dans le DOM
 * (les plus anciens restent en mémoire et sont rechargés par pages quand le joueur remonte).
 * Valeur par défaut de `LecteurComponent.toursParPage`. Plus petit = plus léger, plus de rechargements.
 */
export const TOURS_PAR_PAGE_PAR_DEFAUT = 100;

/** Distance au haut de la sortie (px) en dessous de laquelle la page de tours précédente est rechargée. */
export const SEUIL_CHARGEMENT_TOURS_PX = 200;

/**
 * Bloc de la sortie (en pratique : un tour de jeu).
 * Le lecteur rend chaque bloc séparément : seul le bloc modifié (le dernier) est
 * re-sanitisé et re-parsé par le navigateur, au lieu de tout l’historique.
 */
export interface BlocEcran {
  id: number;
  html: string;
}

export class ContexteEcran {

  /** L’écran secondaire est-il actuellement affiché (indépendamment du fait que l’écran temporaire est affiché par dessus ou non) ? */
  private ecranSecondaireAffiche = false;

  /** L’écran temporaire est-il actuellement affiché (cette écran s’affiche par dessus les autres) ? */
  private ecranTemporaireAffiche = false;

  /** Identifiant du prochain bloc créé */
  private prochainIdBloc = 0;

  /** L’écran principal du jeu */
  private _blocsPrincipal: BlocEcran[] = [this.creerBloc()];

  /** L’écran secondaire du jeu */
  private _blocsSecondaire: BlocEcran[] = [this.creerBloc()];

  /** L’écran temporaire du jeu */
  private _blocsTemporaire: BlocEcran[] = [this.creerBloc()];

  /** Si true, le tag {L}NNN{L} est rendu en lien cliquable (réservé à l’éditeur). */
  public supportLiensLignes = false;

  /**
   * Post-traitement optionnel appliqué à chaque contenu HTML ajouté à l’écran.
   * Utilisé par l’interface tactile pour rendre cliquables les éléments du jeu.
   */
  public enrichisseurLiens: ((html: string) => string) | undefined;

  constructor(
    private dossierRessourcesComplet: string
  ) { }

  /**
   * Changer l’écran affiché au joueur.
   * @param ecran écran à afficher.
   */
  public afficherEcran(ecran: ChoixEcran) {
    switch (ecran) {
      case ChoixEcran.principal:
        this.ecranSecondaireAffiche = false;
        this.ecranTemporaireAffiche = false;
        break;

      case ChoixEcran.secondaire:
        this.ecranSecondaireAffiche = true;
        this.ecranTemporaireAffiche = false;
        break;

      case ChoixEcran.temporaire:
        // raz écran temporaire lorsqu’on l’affiche
        this._blocsTemporaire = [this.creerBloc()];
        this.ecranTemporaireAffiche = true;
        break;

      case ChoixEcran.precedent:
        if (this.ecranTemporaireAffiche) {
          this.ecranTemporaireAffiche = false;
        } else {
          this.ecranSecondaireAffiche = !this.ecranSecondaireAffiche;
        }
        break;

      default:
        throw new Error(`afficherEcran: écran pas connu (${ecran})`);
    }
  }

  /**
   * Contenu de l’écran à afficher au joueur.
   */
  get ecran(): string {
    return ContexteEcran.joindre(this.blocsCourants);
  }

  get ecranPrincipal(): string {
    return ContexteEcran.joindre(this._blocsPrincipal);
  }

  get ecranSecondaire(): string {
    return ContexteEcran.joindre(this._blocsSecondaire);
  }

  /** Écran actuellement affiché au joueur (principal, secondaire ou temporaire). */
  get ecranAffiche(): ChoixEcran {
    if (this.ecranTemporaireAffiche) {
      return ChoixEcran.temporaire;
    } else if (this.ecranSecondaireAffiche) {
      return ChoixEcran.secondaire;
    } else {
      return ChoixEcran.principal;
    }
  }

  get blocsPrincipal(): BlocEcran[] {
    return this._blocsPrincipal;
  }

  get blocsSecondaire(): BlocEcran[] {
    return this._blocsSecondaire;
  }

  get blocsTemporaire(): BlocEcran[] {
    return this._blocsTemporaire;
  }

  /**
   * Commencer un nouveau bloc sur l’écran affiché (appelé au début de chaque tour).
   * Les blocs précédents ne changeront plus : leur rendu n’est plus jamais recalculé.
   */
  public nouveauBloc() {
    const blocs = this.blocsCourants;
    if (blocs[blocs.length - 1].html.length) {
      blocs.push(this.creerBloc());
    }
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
    const contenuHtml = BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet, this.supportLiensLignes);
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
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet, this.supportLiensLignes) + '</p>';
    this.ajouterHtml(contenuHtml);
    return contenuHtml;
  }

  /**
   * Ajouter un paragraphe ouvert avec le contenu spécifié.
   * @param contenuBrut Contenu qui sera converti en HTML.
   * @returns le paragraphe ajouté, converti en HTML.
   */
  public ajouterParagrapheDonjonOuvert(contenuBrut: string): string {
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet, this.supportLiensLignes);
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
    const contenuHtml = '<p>' + BalisesHtml.convertirEnHtml(contenuBrut, this.dossierRessourcesComplet, this.supportLiensLignes);
    this.ajouterHtml(contenuHtml);
  }

  private ajouterHtml(contenuHtml: string) {
    if (this.enrichisseurLiens) {
      contenuHtml = this.enrichisseurLiens(contenuHtml);
    }
    // ajouter au dernier bloc de l’écran affiché
    const blocs = this.blocsCourants;
    blocs[blocs.length - 1].html += contenuHtml;
  }

  private remplacerHtml(contenuHtml: string) {
    if (this.enrichisseurLiens && contenuHtml.length) {
      contenuHtml = this.enrichisseurLiens(contenuHtml);
    }
    const blocs = [this.creerBloc(contenuHtml)];
    // écran temporaire
    if (this.ecranTemporaireAffiche) {
      this._blocsTemporaire = blocs;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      this._blocsSecondaire = blocs;
      // écran principal
    } else {
      this._blocsPrincipal = blocs;
    }
  }

  /** Blocs de l’écran actuellement affiché. */
  private get blocsCourants(): BlocEcran[] {
    // écran temporaire
    if (this.ecranTemporaireAffiche) {
      return this._blocsTemporaire;
      // écran secondaire
    } else if (this.ecranSecondaireAffiche) {
      return this._blocsSecondaire;
      // écran principal
    } else {
      return this._blocsPrincipal;
    }
  }

  private creerBloc(html = ''): BlocEcran {
    return { id: this.prochainIdBloc++, html };
  }

  private static joindre(blocs: BlocEcran[]): string {
    return blocs.length === 1 ? blocs[0].html : blocs.map(x => x.html).join('');
  }

}

export enum ChoixEcran {
  principal,
  secondaire,
  temporaire,
  precedent
}