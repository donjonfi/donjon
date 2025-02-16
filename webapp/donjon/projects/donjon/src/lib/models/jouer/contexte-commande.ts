import { ActionCeciCela } from "../compilateur/action";
import { CandidatCommande } from "./candidat-commande";
import { Evenement } from "./evenement";
import { QuestionsCommande } from "./questions-commande";

export class ContexteCommande {

  /** La commande brute (étape 0) */
  public brute: string;

  public candidats: CandidatCommande[];

  public sortie: string = "";

  public questions: QuestionsCommande | undefined;

  /** 
   * Est-ce qu’une des commandes candidates a été validée et exécutée ?
   */
  public commandeValidee: boolean;

  /**
   * L’action qui a été choisie pour la commande à exécuter.
   */
  public actionChoisie: ActionCeciCela;

  /**
   * L’évènement produit par la commande
   */
  public evenement: Evenement;

  public verbesSimilaires: string[] | undefined;

  public estUneInstruction = false;

}