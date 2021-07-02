import { Capacite } from '../commun/capacite';
import { Classe } from '../commun/classe';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Intitule } from './intitule';
import { Nombre } from '../commun/nombre.enum';
import { ProprieteElement } from '../commun/propriete-element';
import { TypeValeur } from '../compilateur/type-valeur';

export class ElementJeu extends Intitule {

  constructor(
    /** Identifiant unique de l’élément */
    public id: number,

    /** Nom de l’élément */
    public nom: string,

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

  /**
 * Genre de l’élément
 * - Féminin
 * - Masculin
 * - Neutre
 */
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


  /** Titre (lieux) */
  get titre(): string {
    return this.proprietes.find(x => x.nom == 'titre')?.valeur;
  }
  /** Titre (lieux) */
  set titre(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'titre');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteElement('titre', TypeValeur.mots, valeur));
    }
  }

  /** Description du lieu (regarder) ou de l’objet (examiner) */
  get description(): string {
    return this.proprietes.find(x => x.nom == 'description')?.valeur;
  }
  /** Description du lieu (regarder) ou de l’objet (examiner) */
  set description(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'description');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteElement('description', TypeValeur.mots, valeur));
    }
  }

  /** Nombre d'affichages de la description de l’objet. */
  get nbAffichageDescription(): number {
    return this.proprietes.find(x => x.nom == 'description')?.nbAffichage;
  }
  /** Nombre d'affichages de la description de l’objet. */
  set nbAffichageDescription(valeur: number) {
    this.proprietes.find(x => x.nom == 'description').nbAffichage = valeur;
  }

  /** Texte s’affichant lorsqu’on peut apercevoir l’objet dans un lieu. */
  get apercu(): string {
    return this.proprietes.find(x => x.nom == 'aperçu')?.valeur;
  }

  /** Texte s’affichant lorsqu’on peut apercevoir l’objet dans un lieu. */
  set apercu(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'aperçu');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteElement('aperçu', TypeValeur.mots, valeur));
    }
  }

  /** Nombre d'affichages de l'aperçu de l’objet. */
  get nbAffichageApercu(): number {
    return this.proprietes.find(x => x.nom == 'aperçu')?.nbAffichage;
  }
  /** Nombre d'affichages de l'aperçu de l’objet. */
  set nbAffichageApercu(valeur: number) {
    this.proprietes.find(x => x.nom == 'aperçu').nbAffichage = valeur;
  }

  /** Texte s’affichant lorsqu’on lit l’objet. */
  get texte(): string {
    return this.proprietes.find(x => x.nom == 'texte')?.valeur;
  }

  /** Texte s’affichant lorsqu’on lit l’objet. */
  set texte(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'texte');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteElement('texte', TypeValeur.mots, valeur));
    }
  }

  /** Nombre d'affichages du texte de l’objet. */
  get nbAffichageTexte(): number {
    return this.proprietes.find(x => x.nom == 'texte')?.nbAffichage;
  }
  /** Nombre d'affichages du texte de l’objet. */
  set nbAffichageTexte(valeur: number) {
    this.proprietes.find(x => x.nom == 'texte').nbAffichage = valeur;
  }


  /** Propriétés de l’élément */
  public proprietes: ProprieteElement[] = [];

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

  /** Ils s’agit des autres noms que le joueur peut donner à cet élément du jeu. */
  synonymes: GroupeNominal[] = null;

}
