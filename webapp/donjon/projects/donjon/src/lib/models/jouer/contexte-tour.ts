import { ElementsPhrase } from "../commun/elements-phrase";
import { Intitule } from "../jeu/intitule";

export class ContexteTour {

  // erreurs
  private erreurs: string[] = [];

  constructor(
    /** Ceci */
    public ceci: Intitule | undefined,
    /** Cela */
    public cela: Intitule | undefined,
  ) { }


  // ceci/cela

  // çà

  // celle/celles/celui/ceux-ci/là

  // réponses (dernière, avant-dernière, préantépénultième)

  // 

  ajouterErreurInstruction(instruction: ElementsPhrase, erreur: string) {
    console.error(erreur, "\ninstruction: ", instruction);
    this.erreurs.push(erreur);
  }

}
