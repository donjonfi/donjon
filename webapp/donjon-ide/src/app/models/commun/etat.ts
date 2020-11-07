
export class Etat {
  id = -1;
  nomTronque: string = null;
  nom: string = null;
  nomMS: string = null;
  nomMP: string = null;
  nomFS: string = null;
  nomFP: string = null;
  /**
   * Les éléments d’un même groupe sont en contradiction entre-eux.
   */
  groupe: number = null;
  /**
   * Lorsqu’on ajoute élément de la bascule, son binome est retiré et inversément.
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
}
