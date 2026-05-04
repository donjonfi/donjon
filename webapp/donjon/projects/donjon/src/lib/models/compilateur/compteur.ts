import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "../jeu/intitule";

export class Compteur extends Intitule {

  public positionAffichage?: 'haut-gauche' | 'haut-droite' | 'bas-gauche' | 'bas-droite';

  /** Unité (forme singulière) affichée à côté de la valeur dans le cartouche. Ex: "pièce". */
  public unite?: string;

  /** Si vrai, ne pas afficher l'intitulé du compteur dans le cartouche. */
  public sansIntitule?: boolean;

  /** Si vrai, ne pas afficher l'unité du compteur dans le cartouche. */
  public sansUnite?: boolean;

  /** Titre libre du compteur, affiché dans le cartouche à la place du nom. Modifiable à l'exécution. */
  public titre?: string;

  constructor(
    /** Nom du compteur */
    nom: string,
    /** Valeur du compteur */
    public valeur: number = 0,
    /** Intitulé du compteur */
    intitule: GroupeNominal | undefined = undefined,
    /** Classe : compteur */
    classe: Classe = ClassesRacines.Compteur,
  ) {
    super(nom, (intitule ? intitule : (new GroupeNominal(null, nom, null))), classe);
  }

}