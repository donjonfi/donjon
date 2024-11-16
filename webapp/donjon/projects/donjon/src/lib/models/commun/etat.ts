
export class Etat {
  id = -1;
  /** S’agit-il d’un état calculé (qui ne peut pas être modifié directement) */
  calcule = false;
  /** S’agit-il d’un état qui va nécessiter de recalculer des autres états ? */
  /** Nom tronqué (pour recherche rapide) */
  nomTronque: string = null;
  /** Nom par défaut (s’il manque une forme) */
  nom: string = null;
  /** Nom au masculin singulier */
  nomMS: string = null;
  /** Nom au masculin pluriel */
  nomMP: string = null;
  /** Nom au féminin singulier */
  nomFS: string = null;
  /** Nom au féminin pluriel */
  nomFP: string = null;
  /**
   * Les éléments d’un même groupe sont en contradiction entre-eux.
   */
  groupe: number = null;
  /**
   * Lorsqu’on ajoute élément de la bascule, son binome est retiré et inversement.
   */
  bascule: number = null;
  /**
   * Les éléments en contradictions sont automatiquement retirés.
   */
  contradictions: number[] = null;
  /**
   * Les éléments impliqués sont automatiquement ajoutés.
   */
  implications: number[] = null;

  toString(): string{
    return this.nom;
  }
}
