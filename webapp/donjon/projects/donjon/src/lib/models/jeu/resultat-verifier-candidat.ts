import { Compteur } from "../compilateur/compteur";
import { ElementJeu } from "./element-jeu";
import { Intitule } from "./intitule";

export class ResultatVerifierCandidat {

    constructor(
        /** Élément(s) trouvé(s) avec le meilleur score */
        public elementsTrouves: Array<ElementJeu | Compteur | Intitule>,
        /** Meilleur score */
        public meilleurScore: number,
    ) { }
}