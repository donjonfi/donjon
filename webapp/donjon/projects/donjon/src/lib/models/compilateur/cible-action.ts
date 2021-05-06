import { GroupeNominal } from "../commun/groupe-nominal";

export class CibleAction extends GroupeNominal {

    constructor(
        public determinant: string,
        public nom: string,
        public epithete: string = null,
        /** État prioritaire (possédé, disponible, porté, …) */
        public priorite: string = null,
        /** Score de la cible (par rapport à d’autres cibles potentielles) */
        public score: number = 0,
    ) {
        super(determinant, nom, epithete);
    }
}