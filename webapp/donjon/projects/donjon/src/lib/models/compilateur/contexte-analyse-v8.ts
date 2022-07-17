import { BlocInstructions } from "./bloc-instructions";
import { ContexteAnalyse } from "./contexte-analyse";
import { Routine } from "./routine";
import { RoutineAction } from "./routine-action";
import { RoutineRegle } from "./routine-regle";
import { RoutineSimple } from "./routine-simple";

export class ContexteAnalyseV8 extends ContexteAnalyse {

  public indexProchainePhrase = 0;

  /**
   * Routines présentes dans le scénario.
   * (routines simples, règles, actions, réactions)
   */
  public routines: Routine[] = [];

  /** Les routines simples présentes dans le scénario. */
  public routinesSimples: RoutineSimple[] = [];
  /** Les routines « action » présentes dans le scénario. */
  public routinesAction: RoutineAction[] = [];
  /** Les routines « règle » présentes dans le scénario. */
  public routinesRegles: RoutineRegle[] = [];
  
  public dernierBloc: BlocInstructions

  /**
   * Obtenir la dernière routine
   */
  get derniereRoutine(): Routine | undefined {
    return this.routines?.length ? this.routines[this.routines.length - 1] : undefined;
  }

  /**
   * Obtenir la dernière routine encore ouverte ou undefined si la dernière routine est fermée.
   */
  get routineOuverte(): Routine | undefined {
    let retVal: Routine | undefined;
    if (this.routines?.length && this.routines[this.routines.length - 1].ouvert) {
      retVal = this.routines[this.routines.length - 1];
    }
    return retVal;
  }

  /**
   * Obtenir la routine qui inclut la ligne spécifiée ou undefined sa la ligne ne fait pas partie d'une routine.
   */
  getRoutineLigne(ligne: number): Routine | undefined {
    let retVal: Routine | undefined;
    if (this.routines?.length) {
      retVal = this.routines.find(x => x.debut <= ligne && x.fin >= ligne);
    }
    return retVal;
  }



}
