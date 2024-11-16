import { Capacite } from '../commun/capacite';
import { Classe } from '../commun/classe';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Nombre } from '../commun/nombre.enum';
import { ProprieteConcept } from '../commun/propriete-element';
import { TypeValeur } from '../compilateur/type-valeur';
import { Concept } from '../compilateur/concept';

/**
 * Il peut s’agir d’un lieu ou bien d’un objet du jeu.
 */
export class ElementJeu extends Concept {

  constructor(
    /** Identifiant unique de l’élément */
    id: number,

    /** Nom de l’élément */
    nom: string,

    /**
     * Intitulé de l’élément pour le joueur.
     * Il remplace le déterminant/nom à l’affichage
     */
    intitule: GroupeNominal,

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
    classe: Classe,

  ) {
    super(id, nom, intitule, classe);
  }

  // RACCOURCIS: QUANTITÉ

  /**
   * Quantité disponible de l’élément.
   * > -1: illimité.
   */
  get quantite(): number {
    const existant = this.proprietes.find(x => x.nom == 'quantité');
    if (existant) {
      return parseInt(existant.valeur);
    } else {
      return null;
    }
  }

  /**
   * Quantité disponible de l’élément.
   * > -1: illimité.
   */
  set quantite(valeur: number) {
    let existant = this.proprietes.find(x => x.nom == 'quantité');
    if (existant) {
      existant.valeur = valeur.toString();
    } else {
      this.proprietes.push(new ProprieteConcept(this, 'quantité', TypeValeur.nombre, valeur.toString()));
    }
  }

  // RACCOURCIS: TITRE

  /** Titre (lieux) */
  get titre(): string {
    return this.proprietes.find(x => x.nom == 'titre')?.valeur ?? null;
  }
  /** Titre (lieux) */
  set titre(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'titre');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteConcept(this, 'titre', TypeValeur.mots, valeur));
    }
  }

  // RACCOURCIS: DESCRIPTION

  /** Description du lieu (regarder) ou de l’objet (examiner) */
  get description(): string {
    return this.proprietes.find(x => x.nom == 'description')?.valeur ?? null;
  }
  /** Description du lieu (regarder) ou de l’objet (examiner) */
  set description(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'description');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteConcept(this, 'description', TypeValeur.mots, valeur));
    }
  }

  /** Nombre d'affichages de la description de l’objet. */
  get nbAffichageDescription(): number {
    return this.proprietes.find(x => x.nom == 'description').nbAffichage;
  }
  /** Nombre d'affichages de la description de l’objet. */
  set nbAffichageDescription(valeur: number) {
    this.proprietes.find(x => x.nom == 'description').nbAffichage = valeur;
  }

  // RACCOURCIS: APERÇU

  /** Texte s’affichant lorsqu’on peut apercevoir l’objet dans un lieu. */
  get apercu(): string {
    return this.proprietes.find(x => x.nom == 'aperçu')?.valeur ?? null;
  }

  /** Texte s’affichant lorsqu’on peut apercevoir l’objet dans un lieu. */
  set apercu(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'aperçu');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteConcept(this, 'aperçu', TypeValeur.mots, valeur));
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

  // RACCOURCIS: TEXTE 

  /** Texte s’affichant lorsqu’on lit l’objet. */
  get texte(): string {
    return this.proprietes.find(x => x.nom == 'texte')?.valeur ?? null;
  }

  /** Texte s’affichant lorsqu’on lit l’objet. */
  set texte(valeur: string) {
    let existant = this.proprietes.find(x => x.nom == 'texte');
    if (existant) {
      existant.valeur = valeur;
    } else {
      this.proprietes.push(new ProprieteConcept(this, 'texte', TypeValeur.mots, valeur));
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

  /** Capacités de l’élément */
  public capacites: Capacite[] = [];



}
