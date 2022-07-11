import { AnalyseurV8Definitions } from "./analyseur-v8.definitions";
import { AnalyseurV8Routines } from "./analyseur-v8.routines";
import { AnalyseurV8Utils } from "./analyseur-v8.utils";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { InstructionControle } from "../../../models/compilateur/instruction-controle";
import { Phrase } from "../../../models/compilateur/phrase";
import { Routine } from "../../../models/compilateur/routine";

export class AnalyseurV8 {

  /**
   * Analyser les phrases fournies et ajouter les résultats dans le contexte de l’analyse.
   * @param phrases phrases à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    while (ctx.indexProchainePhrase < phrases.length) {
      const phraseAnalysee = phrases[ctx.indexProchainePhrase];
      // CAS 1: DÉBUT ROUTINE => traiter la routine
      const debutRoutineTrouve = AnalyseurV8Utils.estDebutRoutine(phraseAnalysee);
      if (debutRoutineTrouve) {
        if (ctx.verbeux) {
          console.log(`[AnalyseurV8] l.${phraseAnalysee.ligne}: trouvé début routine (${Routine.TypeToString(debutRoutineTrouve)}) (${phraseAnalysee})`);
        }
        AnalyseurV8Routines.traiterRoutine(debutRoutineTrouve, phrases, ctx);
        // (index de la phrase suivante géré par traiterRoutine)
      } else {
        // CAS 2: FIN ROUTINE => ERREUR
        const finRoutineTrouvee = AnalyseurV8Utils.estFinRoutine(phraseAnalysee);
        if (finRoutineTrouvee) {
          ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune routine commencée, le « fin ${Routine.TypeToString(finRoutineTrouvee)} » n’est donc pas attendu ici.`);
          // phrase suivante
          ctx.indexProchainePhrase++;
        } else {
          // CAS 3: FIN INSTRUCTION CONTRÔLE => ERREUR
          const finInstructionControleTrouvee = AnalyseurV8Utils.estFinInstructionControle(phraseAnalysee);
          if (finInstructionControleTrouvee) {
            ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToString(finInstructionControleTrouvee)} » n’est donc pas attendu ici.`);
            // phrase suivante
            ctx.indexProchainePhrase++;
          } else {
            // CAS 4: DÉFINITION => traiter la définition
            AnalyseurV8Definitions.traiterDefinition(phraseAnalysee, ctx);
            // (index de la phrase suivante géré par traiterDefinition)
          }
        }
      }
    }
  }
}