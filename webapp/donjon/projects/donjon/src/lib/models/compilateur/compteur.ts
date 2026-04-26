import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "../jeu/intitule";

export class Compteur extends Intitule {

  public positionAffichage?: 'haut-gauche' | 'haut-droite' | 'bas-gauche' | 'bas-droite';

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