import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { ERoutine, Routine } from "../../../models/compilateur/routine";

import { AnalyseurV8Controle } from "./analyseur-v8.controle";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { InstructionControle } from "../../../models/compilateur/instruction-controle";
import { Phrase } from "../../../models/compilateur/phrase";
import { RoutineSimple } from "../../../models/compilateur/routine-simple";

export class AnalyseurV8Routines {

  public static indexRoutineSansNom = 1;

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @returns true si une routine a effectivement été trouvée.
   */
  public static traiterRoutine(debutRoutineTrouve: ERoutine, phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {

    let retVal = false;

    let routine: Routine;

    switch (debutRoutineTrouve) {
      case ERoutine.simple:
        routine = AnalyseurV8Routines.traiterRoutineSimple(phrases, ctx);
        break;
      case ERoutine.action:
        routine = AnalyseurV8Routines.traiterRoutineAction(phrases, ctx);
        break;
      case ERoutine.reaction:
        routine = AnalyseurV8Routines.traiterRoutineReaction(phrases, ctx);
        break;
      case ERoutine.regle:
        routine = AnalyseurV8Routines.traiterRoutineRegle(phrases, ctx);
        break;
      default:
        throw new Error(`[traiterRoutine] type de routine non pris en charge: ${debutRoutineTrouve}`);
    }

    if (routine) {
      ctx.routines.push(routine);
      // vérifier si la routine est bien fermée
      if (routine.ouvert) {
        routine.ouvert = false;
        routine.correctementFini = false;
        ctx.ajouterErreur(phrases[ctx.indexProchainePhrase - 1].ligne, `Un « fin ${Routine.TypeToString(routine.type)} » est attendu ici.`);
      }
      retVal = true;
    } else {
      ctx.ajouterErreur(phrases[ctx.indexProchainePhrase - 1].ligne, `Une routine était attendue mais n’a finalement pas été trouvée.`);
      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;
    }
    return retVal;
  }

  /**
   * Traiter la routine (simple)
   */
  public static traiterRoutineSimple(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineSimple {
    let routine: RoutineSimple;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    let nomRoutine = AnalyseurV8Utils.testerEtiquette('routine', phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (nomRoutine !== undefined) {

      if (ctx.verbeux) {
        console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: nom de la routine: ${nomRoutine}.`);
      }

      // création de la routine
      routine = new RoutineSimple(nomRoutine, phraseAnalysee.ligne);

      // si pas de nom à 1 seul mot trouvé
      if (!AnalyseurV8Utils.contientExactement1Mot(nomRoutine)) {
        ctx.ajouterErreur(phraseAnalysee.ligne, "routine: le nom de la routine doit faire exactement un mot. Ex: « routine MaSuperRoutine: »")
        nomRoutine = ('routineSansNom' + AnalyseurV8Routines.indexRoutineSansNom++);
      }
      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        phraseAnalysee = phrases[ctx.indexProchainePhrase];
        // CAS 1: FIN ROUTINE => on finit la routine
        const finRoutineTrouve = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
        if (finRoutineTrouve) {
          if (ctx.verbeux) {
            console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: fin ${Routine.TypeToString(routine.type)} trouvé.`);
          }
          if (finRoutineTrouve === routine.type) {
            routine.ouvert = false;
            routine.correctementFini = true;
          } else {
            ctx.ajouterErreur(phraseAnalysee.ligne, `(routine ${nomRoutine}): un « fin ${Routine.TypeToString(routine.type)} » est attendu à la place du « fin ${Routine.TypeToString(finRoutineTrouve)} ».`);
          }
          // pointer la phrase suivante
          ctx.indexProchainePhrase++;
        } else {
          // CAS 2: DÉBUT AUTRE ROUTINE => ERREUR et on termine la routine précédente.
          const debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phraseAnalysee);
          if (debutRoutineTrouve) {
            if (ctx.verbeux) {
              console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: début routine (${Routine.TypeToString(routine.type)}) trouvé alors que routine précédente pas terminée.`);
            }
            routine.ouvert = false;
            routine.correctementFini = false;
            ctx.ajouterErreur(phraseAnalysee.ligne, `(routine ${nomRoutine}): un « fin ${Routine.TypeToString(routine.type)} » est attendu avant le début « ${Routine.TypeToString(debutRoutineTrouve)} ».`);
            // ne PAS pointer la phrase suivante car la phrase actuelle va être analysée à nouveau.
          } else {
            // CAS 3: DÉBUT INSTRUCTION CONTRÔLE => on traite le nouveau bloc contrôle
            const debutInstructionControleTrouve = AnalyseurV8Utils.chercherDebutInstructionControle(phraseAnalysee);
            if (debutInstructionControleTrouve) {
              AnalyseurV8Controle.traiterBlocControle(phrases, ctx);
              // (index de la phrase suivante géré par traiterBlocControle)
            } else {
              // CAS 4: FIN INSTRUCTION CONTRÔLE => ERREUR on continue avec la suite
              const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
              if (finInstructionControleTrouvee) {
                if (ctx.verbeux) {
                  console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: fin ${InstructionControle.TypeToString(finInstructionControleTrouvee)} trouvé alors que pas attendu ici.`);
                }
                ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToString(finInstructionControleTrouvee)} » n’est donc pas attendu ici.`);
                // pointer la phrase suivante
                ctx.indexProchainePhrase++;
              } else {
                // CAS 5: INSTRUCTION SIMPLE
                const instructionSimpleTrouvee = AnalyseurV8Instructions.traiterInstruction(phraseAnalysee, routine.instructions);
                if (instructionSimpleTrouvee) {
                  if (ctx.verbeux) {
                    console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: instuction simple trouvée.`);
                  }
                  // pointer la phrase suivante
                  ctx.indexProchainePhrase++;
                  // CAS 6: RIEN TROUVÉ
                } else {
                  if (ctx.verbeux) {
                    console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: instuction simple NON trouvée.`);
                  }
                  ctx.ajouterErreur(phraseAnalysee.ligne, `Une instruction est attendue ici mais je n’ai pas l’impression qu’il s’agisse d’une instruction.`);
                  // pointer la phrase suivante
                  ctx.indexProchainePhrase++;
                }
              }
            }
          }
        }
      }
      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.ajouterErreur(phraseAnalysee.ligne, "routine: étiquette d’entête pas trouvée.");
    }

    return routine;
  }

  /**
   * Traiter la routine (Action)
   */
  public static traiterRoutineAction(phrases: Phrase[], ctx: ContexteAnalyseV8): Routine | undefined {
    let retVal: Routine | undefined;
    return retVal;
  }

  /**
   * Traiter la routine  (Réaction)
   */
  public static traiterRoutineReaction(phrases: Phrase[], ctx: ContexteAnalyseV8): Routine | undefined {
    let retVal: Routine | undefined;
    return retVal;
  }

  /**
   * Traiter la routine  (Règle)
   */
  public static traiterRoutineRegle(phrases: Phrase[], ctx: ContexteAnalyseV8): Routine | undefined {
    let retVal: Routine | undefined;
    return retVal;
  }

}