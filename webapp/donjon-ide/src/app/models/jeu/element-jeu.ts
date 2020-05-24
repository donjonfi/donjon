import { Capacite } from '../compilateur/capacite';
import { ClasseElement } from '../commun/type-element.enum';
import { Genre } from '../commun/genre.enum';
import { Inventaire } from './inventaire';
import { Nombre } from '../commun/nombre.enum';

export class ElementJeu {

  constructor(
    /** Identifiant unique de l’élément */
    public id: number,
    /**
     * Type de l’élément
     * - Objet
     * - Lieu
     * - Porte
     * - Personne
     * - Animal
     * - Contenant
     * - Support
     * - …
     */
    public type: ClasseElement,
    /** Déterminant de l’élément */
    public determinant: string,
    /** Nom de l’élément */
    public nom: string,
    /**
     * Genre de l’élément
     * - Féminin
     * - Masculin
     * - Neutre
     */
    public genre: Genre,
    /**
     * Nombre de l’élément:
     * - Singulier
     * - Pluriel
     * - Indéfini
     */
    public nombre: Nombre,
    /**
     * Quantité disponible de l’élément.
     * > -1: illimité.
     */
    public quantite: number,
  ) { }

  /**
   * Intitulé de l’élément pour le joueur.
   * Il remplace le déterminant/nom à l’affichage
   */
  public intitule: string = null;
  /** Intitulé (pluriel) */
  public intituleP: string = null;
  /** Intitulé (singulier) */
  public intituleS: string = null;
  /** Intitulé (masculin) */
  public intituleM: string = null;
  /** Intitulé (féminin) */
  public intituleF: string = null;
  /** Description de l’élément */
  public description: string = null;
  /**
   * États actuels de l’élément
   * - ouvrable
   * - verrouillable
   * - ouvert(e)
   * - verrouillé(e)
   * - allumé(e)
   * - cassé(e)
   * - …
   */
  public etats: string[] = [];
  /** Capacités de l’élément */
  public capacites: Capacite[] = [];

  public inventaire: Inventaire = new Inventaire();

  // STATISTIQUES

  /** Nombre d'affichages de la description */
  nbAffichageDescription = 0;



}
