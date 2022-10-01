import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { Instruction } from "../../models/compilateur/instruction";

export interface Reaction {

  /** Les instructions à exécuter lorsque la réaction se déclanche. */
  instructions: Instruction[];

  /** Les sujets qui déclanche la réaction. */
  sujets: GroupeNominal[];

  /** Intitulé de la réaction (utilisé pour les erreurs affichées au créateur) */
  get intitule(): string;

  /** Nombre d’affichages de la réaciton */
  nbAffichageReaction: number;


}
