import { Correspondance } from "../../utils/jeu/correspondance";
import { ElementsPhrase } from "../commun/elements-phrase";
import { GroupeNominal } from "../commun/groupe-nominal";

export class CandidatCommande {

  constructor(
    /** La commande décomposée en éléments de phrase */
    public els: ElementsPhrase
  ) { }

  /** Un premier argument a-t-il été fourni ? */
  public isCeciV1: boolean | undefined;
  /** L’intitulé du premier argument */
  public ceciIntituleV1: GroupeNominal | undefined;
  /** La quantité du premier argument */
  public ceciQuantiteV1: number | undefined
  /** Les correspondances trouvées pour le premier argument */
  public correspondCeci: Correspondance | undefined;

  /** Un second argument a-t-il été fourni ? */
  public isCelaV1: boolean | undefined;
  /** L’intitulé du second argument */
  public celaIntituleV1: GroupeNominal | undefined;
  /** La quantité du second argument */
  public celaQuantiteV1: number | undefined
  /** Les correspondances trouvées pour le second argument */
  public correspondCela: Correspondance | undefined;

  /** 
   * Le score du candidat.
   * Le score est basé sur le compatibilité entre le nombre d’arguments trouvés 
   * et le nombre d’arguments attendus pour l’action correspondant à l’infinitif
   * ainsi que la correspondance entre les arguments renseignés et les éléments
   * du donjon existants.
   */
  public score: number = 0;

}