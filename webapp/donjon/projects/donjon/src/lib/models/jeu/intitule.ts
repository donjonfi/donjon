import { Classe } from '../commun/classe';
import { GroupeNominal } from '../commun/groupe-nominal';
import { RechercheUtils } from '../../utils/commun/recherche-utils';

export class Intitule {

  /** Mots clés correspondants à l’intitulé (pour effectuer une recherche) */
  private _motsCles: string[];

  constructor(

    /** Nom de l’élément */
    public nom: string,

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
  ) { }

  toString() {
    if (this.intitule) {
      return this.intitule.toString();
    } else {
      return this.nom;
    }
  }

  /** Transformer l’intitulé en mots clés (afin d’effectuer une recherche) */
  get motsCles(): string[] {
    if (!this._motsCles) {
      if (this.intitule) {
        this._motsCles = RechercheUtils.nettoyerEtTransformerEnMotsCles(this.intitule.nomEpithete);
      } else {
        this._motsCles = RechercheUtils.nettoyerEtTransformerEnMotsCles(this.nom);
      }
    }
    return this._motsCles;
  }


}