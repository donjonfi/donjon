import { TypeValeur } from '../compilateur/type-valeur';

export class ProprieteElement {


  constructor(
    /** Nom de la propriété */
    public nom: string,
    /** Type de valeur (numérique ou texte) */
    public type: TypeValeur,
    /** Valeur de la propriété */
    public valeur: string,
    /** Nombre d’affichages de la propriété. */
    public nbAffichage: number = 0
  ) { }

  public toString() {
    return this.nom;
  }
}
