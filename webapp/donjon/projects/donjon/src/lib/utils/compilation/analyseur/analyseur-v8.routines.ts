import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { ERoutine, Routine } from "../../../models/compilateur/routine";

import { AnalyseurV8Controle } from "./analyseur-v8.controle";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Evenement } from "../../../models/jouer/evenement";
import { ExprReg } from "../expr-reg";
import { Instruction } from "../../../models/compilateur/instruction";
import { InstructionControle } from "../../../models/compilateur/instruction-controle";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { RoutineAction } from "../../../models/compilateur/routine-action";
import { RoutineRegle } from "../../../models/compilateur/routine-regle";
import { RoutineSimple } from "../../../models/compilateur/routine-simple";
import { StringUtils } from "../../commun/string.utils";
import { TypeRegle } from "../../../models/compilateur/type-regle";

export class AnalyseurV8Routines {

  public static indexRoutineSansNom = 1;

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @returns true si une routine a effectivement été trouvée.
   */
  public static traiterRoutine(debutRoutineTrouve: ERoutine, phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {

    let retVal = false;

    let routine: Routine;

    const sauvegardeIndexPhraseInitial = ctx.indexProchainePhrase;

    switch (debutRoutineTrouve) {
      case ERoutine.simple:
        routine = AnalyseurV8Routines.traiterRoutineSimple(phrases, ctx);
        if (routine) {
          ctx.routinesSimples.push(routine as RoutineSimple);
        }
        break;
      case ERoutine.action:
        routine = AnalyseurV8Routines.traiterRoutineAction(phrases, ctx);
        if (routine) {
          // TODO: garder seulement 1 des 2
          ctx.routinesAction.push(routine as RoutineAction);
          ctx.actions.push((routine as RoutineAction).action);
        }
        break;
      case ERoutine.reaction:
        routine = AnalyseurV8Routines.traiterRoutineReaction(phrases, ctx);
        break;
      case ERoutine.regle:
        routine = AnalyseurV8Routines.traiterRoutineRegle(phrases, ctx);
        if (routine) {
          // TODO: garder seulement 1 des 2
          ctx.routinesRegles.push(routine as RoutineRegle);
          ctx.regles.push(routine as RoutineRegle);
        }
        break;
      default:
        throw new Error(`[traiterRoutine] type de routine non pris en charge: ${debutRoutineTrouve}`);
    }

    // vérifier les erreurs éventuelles
    if (routine) {
      // vérifier si la routine est bien fermée
      if (routine.ouvert) {
        routine.ouvert = false;
        routine.correctementFini = false;
        ctx.ajouterErreur(phrases[ctx.indexProchainePhrase - 1].ligne, `Un « fin ${Routine.TypeToMotCle(routine.type)} » est attendu ici.`);
      }
      retVal = true;
    } else {
      ctx.ajouterErreur(phrases[sauvegardeIndexPhraseInitial].ligne, `Une ${Routine.TypeToNom(debutRoutineTrouve)} était attendue mais n’a finalement pas été trouvée.`);
      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;
    }

    return retVal;
  }

  /**
   * Traiter la routine (simple)
   */
  public static traiterRoutineSimple(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineSimple | undefined {
    let routine: RoutineSimple | undefined;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    let nomRoutine = AnalyseurV8Utils.testerEtiquette(['routine'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
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
        // phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // A. CHERCHER ÉTIQUETTES SPÉCIFIQUES À INSTRUCTION SIMPLE
        // (il n’y en a pas)

        // B. CHERCHER DÉBUT/FIN ROUTINE OU INSTRUCTION CONTRÔLE
        // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutineOuInstructionControle())
        this.chercherDebutFinRoutineOuInstructionControle(phrases, routine.instructions, routine, ctx);

      }
      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.ajouterErreur(phraseAnalysee.ligne, "routine: étiquette d’entête pas trouvée.");
    }

    return routine;
  }


  /**
   * Traiter la routine  (Règle)
   */
  public static traiterRoutineRegle(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineRegle | undefined {
    let routine: RoutineRegle | undefined;

    // A. ENTÊTE
    // => ex: « règle avant manger la pomme : »
    // => ex: « règle après une action quelconque : »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    let enonceRegle = AnalyseurV8Utils.testerEtiquette(['règle'], phraseAnalysee, ObligatoireFacultatif.obligatoire);

    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (enonceRegle !== undefined) {

      if (ctx.verbeux) {
        console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: énoncé de la règle: ${enonceRegle}.`);
      }

      let enonceDecompose = ExprReg.xRoutineRegleEnonce.exec(enonceRegle);

      let typeRegle: TypeRegle = TypeRegle.inconnu;
      let evenements: Evenement[] = [];

      if (enonceDecompose) {
        // retrouver mot clé (avant/après)
        const motCleTypeRegle = StringUtils.normaliserMot(enonceDecompose[1]);
        switch (motCleTypeRegle) {
          case 'avant':
          case 'apres':
            typeRegle = TypeRegle[motCleTypeRegle];
            break;
          default:
            ctx.ajouterErreur(phraseAnalysee.ligne, "règle: Seules les règles de type « avant » et « après » sont prises en charge.");
            typeRegle = TypeRegle.inconnu;
            break;
        }
        // retrouver évènement(s)
        evenements = PhraseUtils.getEvenementsRegle(enonceDecompose[2]);

        if (!evenements.length) {
          ctx.ajouterErreur(phraseAnalysee.ligne, "règle: Cette formulation de l’évènement sensé déclencher la règle n’est pas prise en charge.");
        }

        // création de la routine
        routine = new RoutineRegle(typeRegle, evenements, phraseAnalysee.ligne);

      } else {
        ctx.ajouterErreur(phraseAnalysee.ligne, "L’énoncé de la règle n’a pas pu être décomposé.");
        // on crée une routine « bidon » afin de tout de même analyser la suite des phrases de la routine.
        routine = new RoutineRegle(typeRegle, evenements, phraseAnalysee.ligne);
      }

      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        // phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // A. CHERCHER ÉTIQUETTES SPÉCIFIQUES À RÈGLE
        // (il n’y en a pas)

        // B. CHERCHER DÉBUT/FIN ROUTINE OU INSTRUCTION CONTRÔLE
        // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutineOuInstructionControle())
        this.chercherDebutFinRoutineOuInstructionControle(phrases, routine.instructions, routine, ctx);

      }
    } else {
      // étiquette pas trouvée (ne devrait jamais arriver)
      ctx.ajouterErreur(phraseAnalysee.ligne, "routine: étiquette d’entête pas trouvée.");
    }

    return routine;
  }

  /**
   * Traiter la routine (Action)
   */
  public static traiterRoutineAction(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineAction | undefined {
    let routine: RoutineAction | undefined;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    let enteteAction = AnalyseurV8Utils.testerEtiquette(['action'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (enteteAction !== undefined) {

      if (ctx.verbeux) {
        console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: entête de l’action: ${enteteAction}.`);
      }
      // décomposer l’entête de l’action
      let enteteDecompose = ExprReg.xRoutineActionEnteteCeciCela.exec(enteteAction);
      if (enteteDecompose) {
        const infinitif = enteteDecompose[1];
        const isCeci = enteteDecompose[3] ? true : false;
        const isCela = enteteDecompose[5] ? true : false;
        let prepositionCeci: string | undefined;
        let prepositionCela: string | undefined;
        if (isCeci) {
          prepositionCeci = enteteDecompose[2] ?? undefined;
          if (isCela) {
            prepositionCela = enteteDecompose[4] ?? undefined;
          }
        }
        // création de l’action
        routine = new RoutineAction(infinitif, prepositionCeci, isCeci, prepositionCela, isCela, phraseAnalysee.ligne);
      } else {
        ctx.ajouterErreur(phraseAnalysee.ligne, "L’entête de l’action n’a pas pu être décomposé.");
        // on crée une action « bidon » afin de tout de même analyser la suite des phrases de la routine.
        routine = new RoutineAction("tester", undefined, false, undefined, false, phraseAnalysee.ligne);
      }

      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        // phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // A. CHERCHER ÉTIQUETTES SPÉCIFIQUES À ACTION
        // (il n’y en a pas)

        // B. CHERCHER DÉBUT/FIN ROUTINE OU INSTRUCTION CONTRÔLE
        // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutineOuInstructionControle())
        this.chercherDebutFinRoutineOuInstructionControle(phrases, routine.action.instructions, routine, ctx);

      }

      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.ajouterErreur(phraseAnalysee.ligne, "action: étiquette d’entête pas trouvée.");
    }

    return routine;
  }

  /**
   * Traiter la routine  (Réaction)
   */
  public static traiterRoutineReaction(phrases: Phrase[], ctx: ContexteAnalyseV8): Routine | undefined {
    let retVal: Routine | undefined;
    return retVal;
  }


  /**
   * Chercher début/fin routine ou instruction contrôle.
   * Le cas échéant on traite le bloc de contrôle ou on ferme la routine.
   */
  private static chercherDebutFinRoutineOuInstructionControle(phrases: Phrase[], instructions: Instruction[], routine: Routine, ctx: ContexteAnalyseV8): void {
    // phrase à analyser
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // CAS 1: FIN ROUTINE => on finit la routine
    const finRoutineTrouve = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
    if (finRoutineTrouve) {
      if (ctx.verbeux) {
        console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: fin ${Routine.TypeToMotCle(routine.type)} trouvé.`);
      }
      if (finRoutineTrouve === routine.type) {
        routine.ouvert = false;
        routine.correctementFini = true;
      } else {
        ctx.ajouterErreur(phraseAnalysee.ligne, `(${routine.titre}): un « fin ${Routine.TypeToMotCle(routine.type)} » est attendu à la place du « fin ${Routine.TypeToMotCle(finRoutineTrouve)} ».`);
      }
      // pointer la phrase suivante
      ctx.indexProchainePhrase++;
    } else {
      // CAS 2: DÉBUT AUTRE ROUTINE => ERREUR et on termine la routine précédente.
      const debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phraseAnalysee);
      if (debutRoutineTrouve) {
        if (ctx.verbeux) {
          console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: début routine (${Routine.TypeToMotCle(routine.type)}) trouvé alors que routine précédente pas terminée.`);
        }
        routine.ouvert = false;
        routine.correctementFini = false;
        ctx.ajouterErreur(phraseAnalysee.ligne, `(${routine.titre}): un « fin ${Routine.TypeToMotCle(routine.type)} » est attendu avant le début « ${Routine.TypeToMotCle(debutRoutineTrouve)} ».`);
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
              console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} trouvé alors que pas attendu ici.`);
            }
            ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} » n’est donc pas attendu ici.`);
            // pointer la phrase suivante
            ctx.indexProchainePhrase++;
          } else {
            // CAS 5: INSTRUCTION SIMPLE
            const instructionSimpleTrouvee = AnalyseurV8Instructions.traiterInstruction(phraseAnalysee, instructions);
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
              ctx.ajouterErreur(phraseAnalysee.ligne, `Une instruction ou un « fin ${Routine.TypeToMotCle(routine.type)} » est attendu ici.`);
              // pointer la phrase suivante
              ctx.indexProchainePhrase++;
            }
          }
        }
      }
    }
  }

}