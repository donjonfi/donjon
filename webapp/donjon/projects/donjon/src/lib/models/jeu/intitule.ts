import { Classe } from '../commun/classe';
import { GroupeNominal } from '../commun/groupe-nominal';
import { RechercheUtils } from '../../utils/commun/recherche-utils';

export class Intitule {

  /** Mots clés correspondants à l’intitulé (pour effectuer une recherche) */
  private _motsCles: string[];

  /** Nom de l’élément */
  private _nom: string;

  constructor(

    /** Nom de l’élément */
    nom: string,

    /**
     * Intitulé de l’élément pour le joueur.
     * Il remplace le déterminant/nom à l’affichage
     */
    public intitule: GroupeNominal,

    /**
     * Classe de l’élément
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
    this._nom = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(nom.trim());
  }

  toString() {
    if (this.intitule) {
      return this.intitule.toString();
    } else {
      return this._nom;
    }
  }

  /**
   * Le nom de l’objet.
   * Il est toujours em minuscules et sans les caractères spéciaux.
   */
  get nom() {
    return this._nom;
  }

  /** Transformer l’intitulé en mots clés (afin d’effectuer une recherche) */
  get motsCles(): string[] {
    if (!this._motsCles) {
      if (this.intitule) {
        this._motsCles = RechercheUtils.nettoyerEtTransformerEnMotsCles(this.intitule.nomEpithete);
      } else {
        this._motsCles = RechercheUtils.transformerEnMotsCles(this._nom);
      }
    }
    return this._motsCles;
  }


}