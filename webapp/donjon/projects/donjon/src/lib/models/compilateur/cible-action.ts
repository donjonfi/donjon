import { GroupeNominal } from "../commun/groupe-nominal";

export class CibleAction extends GroupeNominal {

    constructor(
        determinant: string,
        nom: string,
        /** 
         * L’épithète s’il s’agit d’un élément du jeu ou le ou les états s’il s’agit d’un type.
         * États: soit un seul état, soit une liste d’états terminée par un et/ou.
         */
        epitheteOuEtats: string = null,
        /** État prioritaire (possédé, disponible, porté, …) */
        public priorite: string = null,
        /** Score de la cible (par rapport à d’autres cibles potentielles) */
        public score: number = 0,
    ) {
        super(determinant, nom, epitheteOuEtats);
    }
}
