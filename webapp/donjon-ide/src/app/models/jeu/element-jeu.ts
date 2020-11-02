import { Capacite } from '../compilateur/capacite';
import { Classe } from '../commun/classe';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Intitule } from './intitule';
import { Inventaire } from './inventaire';
import { Nombre } from '../commun/nombre.enum';

export class ElementJeu extends Intitule {

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
    super(nom, intitule, classe);
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
  /** Texte s’affichant l’orsqu’on examine l’objet. */
  public examen: string = null;

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
  nbAffichageExamen = 0;
  /** L’élément a-t-il déjà été décrit au joueur */
  decrit = false;
  /** L’ojbet a-t-il déjà été examiné par le joueur. */
  examine = false;

}
