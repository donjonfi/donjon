import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { Resultat } from "../../models/jouer/resultat";

/**
 * Interface implémentée par les classes qui exécutent un (ou plusieurs)
 * infinitif(s) du DSL Donjon. Le dispatcher dans Instructions.executerInfinitif
 * utilise une Map<infinitif, InstructionHandler> pour router chaque instruction
 * vers le handler thématique correspondant.
 */
export interface InstructionHandler {
  executer(
    instruction: ElementsPhrase,
    nbExecutions: number,
    contexteTour: ContexteTour,
    evenement: Evenement | undefined,
    declenchements: number,
  ): Resultat;
}
