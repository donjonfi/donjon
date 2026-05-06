import { CadreCondition } from "./cadre-condition";

// Xe fois
export const xFois = /^([1-9][0-9]?)(?:e|eme|ème|ere|ère|re) fois$/i;

export enum ConditionDebutee {
  aucune = 'aucune',
  si = 'si',
  hasard = 'hasard',
  boucle = 'boucle',
  fois = 'fois',
  initialement = 'initialement',
}

/**
 * État du parcours d’un texte dynamique pendant l’interprétation des
 * crochets conditionnels. La pile `cadres` contient les conditions ouvertes
 * (de la plus externe à la plus interne) ; le sommet est le cadre courant.
 */
export class StatutCondition {

  /** Pile de cadres conditionnels (sommet = dernier élément). */
  public cadres: CadreCondition[] = [];

  /**
   * Erreurs détectées pendant l’interprétation du morceau courant et qui
   * doivent être injectées telles quelles dans le texte rendu, à la position
   * du bracket fautif (ex. condition non comprise, mot-clé orphelin).
   * Vidée après chaque morceau par le moteur.
   */
  public erreursInline: string[] = [];

  constructor(
    public nbAffichage: number,
    public initial: boolean,
    public morceaux: string[],
    public curMorceauIndex: number,
  ) { }

  /** Cadre courant (sommet de la pile) ou null si on est au niveau top. */
  public get sommet(): CadreCondition | null {
    return this.cadres.length ? this.cadres[this.cadres.length - 1] : null;
  }

  /** Type du cadre courant (ou ConditionDebutee.aucune si pile vide). */
  public get conditionDebutee(): ConditionDebutee {
    return this.sommet ? this.sommet.type : ConditionDebutee.aucune;
  }

  /** Tous les cadres ouverts ont-ils leur branche visible ? */
  public get pileVisible(): boolean {
    return this.cadres.every(c => c.brancheVisible);
  }
}
