import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { Compteur } from "./compteur";
import { GroupeNominal } from "../commun/groupe-nominal";

export class Ressource extends Compteur {

  constructor(
    /** Nom du compteur */
    nom: string,
    /** Valeur du compteur */
    valeur: number = 0,
    /** Unité de la ressource (singulier) */
    public unite: string = 'unité',
    /** Unités de la ressource (pluriel) */
    public unites: string = 'unités',
    /** Intitulé du compteur */
    intitule: GroupeNominal,
    /** Classe : compteur */
    classe: Classe = ClassesRacines.Ressource,
  ) {
    super(nom, valeur, intitule, classe);
  }

}