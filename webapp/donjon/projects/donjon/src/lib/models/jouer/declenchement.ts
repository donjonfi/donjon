import { Instruction } from "../compilateur/instruction";

export class Declenchement {
    constructor(
        /** instructions à exécuter suite au déclenchement de l’auditeur. */
        public instructions: Instruction[],
        /** nombre de déclenchements de l’auditeur */
        public declenchements: number = 0,
        /** s’agit-il de la règle action quelconque ? */
        public estRegleActionQuelconque: boolean = false
    ) { }
}
