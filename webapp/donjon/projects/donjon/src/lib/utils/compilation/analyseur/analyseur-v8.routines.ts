import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { ERoutine, Routine } from "../../../models/compilateur/routine";

import { AnalyseurV8Controle } from "./analyseur-v8.controle";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { InstructionControle } from "../../../models/compilateur/instruction-controle";
import { Phrase } from "../../../models/compilateur/phrase";

export class AnalyseurV8Routines {

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @returns true si une routine a effectivement été trouvée.
   */
  public static traiterRoutine(debutRoutineTrouve: ERoutine, phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {

    let retVal = false;

    switch (debutRoutineTrouve) {
      case ERoutine.action:
        retVal = AnalyseurV8Routines.traiterRoutineAction(phrases, ctx);
        break;

      case ERoutine.reaction:
        retVal = AnalyseurV8Routines.traiterRoutineReaction(phrases, ctx);
        break;

      case ERoutine.regle:
        retVal = AnalyseurV8Routines.traiterRoutineRegle(phrases, ctx);
        break;

      case ERoutine.simple:
        retVal = AnalyseurV8Routines.traiterRoutineSimple(phrases, ctx);
        break;

      default:
        throw new Error(`[traiterRoutine] type de routine non pris en charge: ${ctx.derniereRoutine.type}`);
    }

    ctx.indexProchainePhrase++;
    return true;
  }

  /**
   * Traiter la routine (simple)
   */
  public static traiterRoutineSimple(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    let routineFinie = false;
    const typeRoutine = ERoutine.simple;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    const nomRoutine = AnalyseurV8Utils.testerEtiquette('routine', phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // nom trouvé
    if (AnalyseurV8Utils.contientExactement1Mot(nomRoutine)) {
      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (!routineFinie && ctx.indexProchainePhrase < phrases.length) {
        phraseAnalysee = phrases[ctx.indexProchainePhrase];
        ctx.indexProchainePhrase++;
        // CAS 1: FIN ROUTINE => on finit la routine
        const finRoutineTrouve = AnalyseurV8Utils.estFinRoutine(phraseAnalysee);
        if (finRoutineTrouve) {
          if (finRoutineTrouve === typeRoutine) {
            routineFinie = true;
          } else {
            ctx.ajouterErreur(phraseAnalysee.ligne, `(routine ${nomRoutine}): un « fin ${Routine.TypeToString(typeRoutine)} » est attendu à la place du « fin ${Routine.TypeToString(finRoutineTrouve)} ».`);
          }
          // passer à la phrase suivante
          ctx.indexProchainePhrase++;
        } else {
          // CAS 2: DÉBUT AUTRE ROUTINE => ERREUR et on termine la routine précédente.
          const debutRoutineTrouve = AnalyseurV8Utils.estDebutRoutine(phraseAnalysee);
          if (debutRoutineTrouve) {
            routineFinie = true;
            ctx.ajouterErreur(phraseAnalysee.ligne, `(routine ${nomRoutine}): un « fin ${Routine.TypeToString(typeRoutine)} » est attendu avant le début « ${Routine.TypeToString(debutRoutineTrouve)} ».`);
            // ne PAS passer à la phrase suivante car la phrase actuelle va être analysée à nouveau.
          } else {
            // CAS 3: DÉBUT INSTRUCTION CONTRÔLE => on traite le nouveau bloc contrôle
            const debutInstructionControleTrouve = AnalyseurV8Utils.estDebutInstructionControle(phraseAnalysee);
            if (debutInstructionControleTrouve) {
              AnalyseurV8Controle.traiterBlocControle(phrases, ctx);
              // (index de la phrase suivante géré par traiterBlocControle)
            } else {
              // CAS 4: FIN INSTRUCTION CONTRÔLE => ERREUR on continue avec la suite
              const finInstructionControleTrouvee = AnalyseurV8Utils.estFinInstructionControle(phraseAnalysee);
              if (finInstructionControleTrouvee) {
                ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToString(finInstructionControleTrouvee)} » n’est donc pas attendu ici.`);
                // passer à la phrase suivante
                ctx.indexProchainePhrase++;
              } else {
                // CAS 5: INSTRUCTION SIMPLE
                AnalyseurV8Instructions.traiterInstruction(phrases, ctx);
                // (index de la phrase suivante géré par traiterInstruction)
              }
            }
          }
        }
      }
      // nom trouvé ne fait pas excatement 1 mot, syntaxe nom supportée.
    } else {
      ctx.ajouterErreur(phraseAnalysee.ligne, "routine: le nom de la routine doit faire exactement un mot. Ex: « routine MaSuperRoutine: »")
    }
    return retVal;
  }

  /**
   * Traiter la routine (Action)
   */
  public static traiterRoutineAction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }

  /**
   * Traiter la routine  (Réaction)
   */
  public static traiterRoutineReaction(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }

  /**
   * Traiter la routine  (Règle)
   */
  public static traiterRoutineRegle(phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {
    let retVal = false;
    return retVal;
  }



}