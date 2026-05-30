
export class Classe {

  constructor(
    /** Non interne de la classe */
    public nom: string,
    /** Intitulé de la classe */
    public intitule: string,
    /** Classe parent */
    public parent: Classe,
    /** Niveau de la classe (la classe racine vaut 0) */
    public niveau: number,
    /** Les états par défaut pour cette classe */
    public etats: string[]
  ) { }

  /** Identifiant unique de la classe
   * => utilisé pour les objets qui sont directement des instances de la classe (il y a un xxxx)
   */
  public id: number;

  /** Identifiant de ressource (uniquement pour les classes héritant de « ressource »).
   * Id dédié, alloué une fois par TYPE de ressource sur le compteur global d'ids (donc sans
   * conflit avec un id d'objet/lieu/classe). Toutes les piles d'une même ressource reçoivent ce
   * ressourceId comme `idOriginal`, ce qui les regroupe lorsqu'on les rassemble dans un contenant.
   */
  public ressourceId: number;

}

