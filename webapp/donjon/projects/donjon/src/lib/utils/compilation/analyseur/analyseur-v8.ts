import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

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
   * @param fichierActions s’agit-il du fichier contenant les actions de base ?
   */
  public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyseV8, fichierActions: boolean = false) {

    ctx.analyseFichierActionsEnCours = fichierActions;
    ctx.indexProchainePhrase = 0;

    while (ctx.indexProchainePhrase < phrases.length) {

      const phraseAnalysee = ctx.getPhraseAnalysee(phrases);

      // CAS 1: DÉBUT ROUTINE => traiter la routine
      const debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phraseAnalysee);
      if (debutRoutineTrouve) {
        ctx.logResultatOk(`🟠 début ${Routine.TypeToMotCle(debutRoutineTrouve, false)}`);
        AnalyseurV8Routines.traiterRoutine(debutRoutineTrouve, phrases, ctx);
        // (index de la phrase suivante géré par traiterRoutine)
      } else {
        // CAS 2: FIN ROUTINE => ERREUR
        const finRoutineTrouvee = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
        if (finRoutineTrouvee) {
          ctx.logResultatKo(`fin ${Routine.TypeToMotCle(finRoutineTrouvee, false)} inattendu (aucune routine commencée).`);

          ctx.probleme(phraseAnalysee, undefined,
            CategorieMessage.structureRoutine, CodeMessage.finRoutinePasAttendu,
            `fin ${Routine.TypeToMotCle(finRoutineTrouvee, false)} pas attendu ici`,
            `Aucune ${Routine.TypeToMotCle(finRoutineTrouvee, false)} commencée, le {@fin ${Routine.TypeToMotCle(finRoutineTrouvee, false)}@} n’est donc pas attendu ici.`,
          );
          // phrase suivante
          ctx.indexProchainePhrase++;
        } else {
          // CAS 3: FIN INSTRUCTION CONTRÔLE => ERREUR
          const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
          if (finInstructionControleTrouvee) {
            ctx.logResultatKo(`fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} inattendu (aucune routine commencée).`);
            ctx.probleme(phraseAnalysee, undefined,
              CategorieMessage.syntaxeControle, CodeMessage.finBlocPasAttendu,
              `fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} pas attendu ici`,
              `Aucune routine commencée, le {@fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)}@}, qui ferme une instruction de contrôle, n’est donc pas attendu ici.`,
            );
            // phrase suivante
            ctx.indexProchainePhrase++;
          } else {
            ctx.logResultatOk(`définition attendue`);
            // CAS 4: DÉFINITION => traiter la définition
            AnalyseurV8Definitions.traiterDefinition(phraseAnalysee, ctx);
            // (index de la phrase suivante géré par traiterDefinition)
          }
        }
      }
    }

    if (ctx.verbeux) {
      console.warn(">>> phrases:", phrases);
      console.warn(">>> ContexteAnalyseV8:", ctx);
    }

  }
}