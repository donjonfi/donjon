import { ContexteCommande } from "./contexte-commande";
import { ElementsPhrase } from "../commun/elements-phrase";
import { Intitule } from "../jeu/intitule";
import { Resultat } from "./resultat";

export class ContexteTour {

  // erreurs
  private erreurs: string[] = [];

  public phase: PhaseTour;

  public commande: ContexteCommande;

  public resultatRegleApres: Resultat | undefined;

  constructor(
    /** Ceci */
    public ceci: Intitule | undefined,
    /** Cela */
    public cela: Intitule | undefined,
  ) {
    
    // C’est le début du tour
    this.phase = PhaseTour.debut;
  }

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

/** Les différentes phases d’un tour (début, avant, vérifier, exécuter, terminer, après, fin) */
export enum PhaseTour {
  debut = 0,
  avant = 1,
  refuser = 2,
  executer = 3,
  apres = 4,
  terminer = 5,
  fin = 6
}
