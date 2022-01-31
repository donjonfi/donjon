import { CandidatCommande } from "./candidat-commande";
import { Correspondance } from "../../utils/jeu/correspondance";
import { ElementsPhrase } from "../commun/elements-phrase";
import { GroupeNominal } from "../commun/groupe-nominal";

export class ContexteCommande {

  /** La commande brute (étape 0) */
  public brute: string;

  public candidats: CandidatCommande[];

  public sortie: string = "";

  /** 
   * Est-ce qu’une des commandes candidates a été validée et exécutée ?
   */
  public commandeValidee: boolean;

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