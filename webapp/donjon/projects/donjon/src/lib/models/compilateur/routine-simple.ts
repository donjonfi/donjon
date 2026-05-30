import { ERoutine, Routine } from "./routine";

import { Instruction } from "./instruction";
import { ParamRoutine } from "./param-routine";

export class RoutineSimple extends Routine {

  /**
   * Le nom de la routine.
   */
  nom: string;

  /**
   * Les instructions qui composent la routine.
   *
   * Une routine n’a qu’une seule phase d’exécution : qu’elle soit écrite
   * sous la forme courte (corps direct, sans étiquette) ou avec un bloc
   * `exécution:` explicite, les instructions atterrissent toujours ici.
   */
  instructions: Instruction[] = [];

  /** La routine attend un paramètre `ceci`. */
  public ceci: boolean = false;
  /** La routine attend un paramètre `cela` (uniquement si `ceci` est vrai). */
  public cela: boolean = false;
  /** Type du paramètre `ceci`, présent uniquement si `ceci` est vrai. */
  public paramCeci?: ParamRoutine;
  /** Type du paramètre `cela`, présent uniquement si `cela` est vrai. */
  public paramCela?: ParamRoutine;

  /**
   * Nouvelle routine simple.
   * @param nom nom de la routine
   * @param ligneDebut ligne du scénario contenant le début du bloc
   */
  public constructor(nom: string, ligneDebut: number) {
    super(ERoutine.simple, ligneDebut, true);
    this.nom = nom;
  }

  /**
   * Intitule complet de la routine (utilisé pour les messages d’erreur affichés au créateur).
   */
  public override get titre(): string {
    return `routine « ${this.nom} »`;
  }

}
