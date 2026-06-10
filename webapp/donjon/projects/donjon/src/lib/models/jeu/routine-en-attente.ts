import { Intitule } from "./intitule";
import { RoutineSimple } from "../compilateur/routine-simple";

/**
 * Une routine en attente d’exécution dans `Jeu.tamponRoutinesEnAttente`, avec ses
 * arguments déjà liés (`ceci`/`cela`). Les arguments sont résolus au moment où la
 * routine est mise en file (déclenchement du chrono, restauration, magnéto), pas à
 * l’exécution — voir `InstructionExecuter.lierAppelRoutine`.
 */
export class RoutineEnAttente {
  public constructor(
    public routine: RoutineSimple,
    public ceciVal?: Intitule,
    public celaVal?: Intitule,
  ) { }
}
