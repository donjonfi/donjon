
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

}

