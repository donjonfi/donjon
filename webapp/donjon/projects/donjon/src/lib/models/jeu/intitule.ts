import { Classe } from '../commun/classe';
import { GroupeNominal } from '../commun/groupe-nominal';

export class Intitule {

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
}