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


  public genre: Genre = null;
  /**
   * Nombre de l’élément:
   * - Singulier
   * - Pluriel
   * - Indéfini
   */
  public nombre: Nombre = null;
  /**
   * Quantité disponible de l’élément.
   * > -1: illimité.
   */
  public quantite: number = null;

  /** Intitulé (singulier) */
  public intituleS: GroupeNominal = null;
  /** Intitulé (pluriel) */
  public intituleP: GroupeNominal = null;

  public titre: string = null;

  /** Description du lieu (regarder) ou de l’objet (examiner) */
  public description: string = null;
  /** Texte s’affichant lorsqu’on peut apercevoir l’objet dans un lieu. */
  public apercu: string = null;
  // /** Texte s’affichant l’orsqu’on examine l’objet. */
  // public examen: string = null;

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
  // public etats: string[] = [];
  public etats: number[] = [];

  /** Capacités de l’élément */
  public capacites: Capacite[] = [];

  // public inventaire: Inventaire = new Inventaire();

  // STATISTIQUES
  /** Nombre d'affichages de la description */
  nbAffichageDescription = 0;
  nbAffichageApercu = 0;

  /** L'objet est dans son état initial tant qu'il n'a pas été manipulé par le joueur. */
  // initial = true;
  /** L’élément a-t-il déjà été décrit au joueur */
  // decrit = false;
  /** L’ojbet a-t-il déjà été vu par le joueur. */
  // vu = false;

}
