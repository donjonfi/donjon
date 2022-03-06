import { Choix } from "../compilateur/choix";
import { ContexteCommande } from "./contexte-commande";
import { ElementJeu } from "../jeu/element-jeu";
import { ElementsPhrase } from "../commun/elements-phrase";
import { Instruction } from "../compilateur/instruction";
import { Intitule } from "../jeu/intitule";
import { Lieu } from "../jeu/lieu";
import { Localisation } from "../jeu/localisation";
import { Resultat } from "./resultat";
import { TypeInterruption } from "../jeu/interruption";

export class ContexteTour {

  // erreurs
  private erreurs: string[] = [];

  public phase: PhaseTour;

  public commande: ContexteCommande;

  public resultatRegleApres: Resultat | undefined;

  public reste: Instruction[] | undefined;
  public choix: Choix[] | undefined;
  public typeInterruption: TypeInterruption | undefined;

  /** déplacement du joueur pour ce tour : origine */
  public origine: Lieu;
  /** déplacement du joueur pour ce tour : destination */
  public destination: Lieu;
  /** déplacement du joueur pour ce tour : orientation */
  public orientation: Localisation;

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
  avant_interrompu = 2, // prochain: refuser sauf si on arrête dans la dernière partie de la règle avant
  refuser = 3,
  executer = 4,
  apres = 5,
  apres_interrompu = 6, // prochain: fin sauf si on continue dans la dernière partie de la règle après
  apres_a_traiter_apres_terminer = 7,
  terminer = 8,
  terminer_avant_traiter_apres = 9,
  continuer_apres = 10,
  continuer_apres_interrompu = 11,
  fin = 12,
}
