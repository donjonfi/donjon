import { ActionCeciCela } from "../compilateur/action";
import { CandidatCommande } from "./candidat-commande";
import { Evenement } from "./evenement";

export class ContexteCommande {

  /** La commande brute (étape 0) */
  public brute: string;

  public candidats: CandidatCommande[];

  public sortie: string = "";

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

  // /** La commande décomposée en éléments de phrase (étape 1) */
  // public els: ElementsPhrase;

  // /** Un premier argument a-t-il été fourni ? */
  // public isCeciV1: boolean | undefined;
  // /** L’intitulé du premier argument */
  // public ceciIntituleV1: GroupeNominal | undefined;
  // /** La quantité du premier argument */
  // public ceciQuantiteV1: number | undefined
  // /** Les correspondances trouvées pour le premier argument */
  // public resultatCeci: Correspondance | undefined;

  // /** Un second argument a-t-il été fourni ? */
  // public isCelaV1: boolean | undefined;
  // /** L’intitulé du second argument */
  // public celaIntituleV1: GroupeNominal | undefined;
  // /** La quantité du second argument */
  // public celaQuantiteV1: number | undefined
  // /** Les correspondances trouvées pour le second argument */
  // public resultatCela: Correspondance | undefined;

}