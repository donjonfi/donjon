import { Capacite } from '../compilateur/capacite';
import { Classe } from '../commun/classe';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Inventaire } from './inventaire';
import { Nombre } from '../commun/nombre.enum';

export class ElementJeu {

  constructor(
    /** Identifiant unique de l’élément */
    public id: number,

    /** Nom de l’élément */
    public nom: string,
    /**
     * Genre de l’élément
     * - Féminin
     * - Masculin
     * - Neutre
     */

    /**
     * Intitulé de l’élément pour le joueur.
     * Il remplace le déterminant/nom à l’affichage
     */
    public intitule: GroupeNominal,
    
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
    public classe: Classe,

  ) {

  }






  public genre: Genre;
  /**
   * Nombre de l’élément:
   * - Singulier
   * - Pluriel
   * - Indéfini
   */
  public nombre: Nombre;
  /**
   * Quantité disponible de l’élément.
   * > -1: illimité.
   */
  public quantite: number;


  /** Intitulé (pluriel) */
  public intituleP: GroupeNominal = null;
  /** Intitulé (singulier) */
  public intituleS: GroupeNominal = null;
  /** Intitulé (masculin) */
  public intituleM: GroupeNominal = null;
  /** Intitulé (féminin) */
  public intituleF: GroupeNominal = null;

  public titre: string = null;

  /** Description de l’élément */
  public description: string = null;
  /** L’élément a-t-il déjà été décrit au joueur */
  decrit: boolean;

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

  // public inventaire: Inventaire = new Inventaire();

  // STATISTIQUES

  /** Nombre d'affichages de la description */
  nbAffichageDescription = 0;



}
