import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "../jeu/intitule";

export class Compteur extends Intitule {

    constructor(
        nom: string,
        /** Valeur du compteur */
        public valeur: number = 0,
        intitule: GroupeNominal = null,
        classe: Classe = ClassesRacines.Compteur,
    ) {
        super(nom, (intitule ? intitule : (new GroupeNominal(null, nom, null))), classe);
    }

}