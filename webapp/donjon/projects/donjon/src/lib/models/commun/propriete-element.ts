import { Concept } from '../compilateur/concept';
import { TypeValeur } from '../compilateur/type-valeur';

/**
 * Il s’agit d’une propriété d’un élément du jeu.
 */
export class ProprieteConcept {

  constructor(
    /** Élément du jeu auquel appartient cette propriété */
    public parent: Concept | null,
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
