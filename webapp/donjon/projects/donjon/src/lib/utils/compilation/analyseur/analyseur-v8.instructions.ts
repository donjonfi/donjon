import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { AnalyseurCommunUtils } from "./analyseur-commun-utils";
import { AnalyseurV8Controle } from "./analyseur-v8.controle";
import { AnalyseurV8Utils } from "./analyseur-v8.utils";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Instruction } from "../../../models/compilateur/instruction";
import { InstructionControle } from "../../../models/compilateur/instruction-controle";
import { Phrase } from "../../../models/compilateur/phrase";
import { Routine } from "../../../models/compilateur/routine";

export class AnalyseurV8Instructions {

  /**
   * Chercher une instruction instruction simple ou une instruction de contrôle.
   * Le cas échéant on traite le bloc de contrôle.
   */
  public static chercherEtTraiterInstructionSimpleOuControle(phrases: Phrase[], instructions: Instruction[], routine: Routine, ctx: ContexteAnalyseV8): boolean {

    // par défaut on part du principe qu’on va trouver
    let instructionTrouvee = true;

    // phrase à analyser
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);

    // CAS 1: DÉBUT INSTRUCTION CONTRÔLE => on traite le nouveau bloc contrôle
    const debutInstructionControleTrouve = AnalyseurV8Utils.chercherDebutInstructionControle(phraseAnalysee);
    if (debutInstructionControleTrouve) {
      ctx.logResultatOk(`instruction contrôle (${InstructionControle.TypeToMotCle(debutInstructionControleTrouve)})`)
      // tester si on a affaire à un si court
      AnalyseurV8Controle.traiterBlocControle(debutInstructionControleTrouve, phrases, routine, instructions, ctx);
      // (index de la phrase suivante géré par traiterBlocControle)
    } else {
      // CAS 2: FIN INSTRUCTION CONTRÔLE => ERREUR (et on continue avec la suite, on n’était pas dans un bloc)
      const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
      if (finInstructionControleTrouvee) {
        ctx.logResultatOk(`fin bloc ${InstructionControle.TypeToMotCle(debutInstructionControleTrouve)} inattendu (pas dans un bloc)`)
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeRoutine, CodeMessage.finBlocPasAttendu,
          `fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} inattendu`,
          `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} » a été ignoré.`,
        );
        // pointer la phrase suivante
        ctx.indexProchainePhrase++;
      } else {
        // CAS 3: INSTRUCTION SIMPLE
        const instructionSimpleTrouvee = AnalyseurV8Instructions.traiterInstructionSimple(phraseAnalysee, instructions);
        if (instructionSimpleTrouvee) {
          ctx.logResultatOk("instruction simple trouvée")
          // pointer la phrase suivante
          ctx.indexProchainePhrase++;
          // CAS 4: RIEN TROUVÉ
        } else {
          // on n’a pas trouvé d’instruction
          instructionTrouvee = false;
          // CAS 4b: TROUVÉ FIN BLOC ERRONÉ
          if (AnalyseurV8Utils.chercherFinBlocInconnu(phraseAnalysee)) {
            ctx.logResultatKo("fin bloc inconnu")

            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.syntaxeRoutine, CodeMessage.finBlocInconnu,
              "fin bloc inconnu",
              `Il y a probablement une faute de frappe ici.`,
            );
          } else {
            ctx.logResultatKo("pas trouvé d’instruction simple")
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.structureRoutine, CodeMessage.finBlocManquant,
              `fin ${Routine.TypeToMotCle(routine.type, false)} attendu`,
              `Une instruction, une étiquette ou un {@fin ${Routine.TypeToMotCle(routine.type, false)}@} est attendu ici.`,
            );
          }

          // pointer la phrase suivante
          ctx.indexProchainePhrase++;
        }
      }
    }
    return instructionTrouvee;
  }

  /**
   * Traiter l'instruction qui devrait correspondre à la phrochaine phrase.
   * @returns true si une instruction a effectivement été trouvée.
   */
  public static traiterInstructionSimple(phrase: Phrase | string, instructions: Instruction[]): boolean {

    let retVal: boolean;
    let phraseBrute: string;
    if (phrase instanceof Phrase) {
      phraseBrute = Phrase.retrouverPhraseBrute(phrase);
    } else {
      phraseBrute = phrase;
    }
    let instructionDecomposee = AnalyseurCommunUtils.decomposerInstructionSimple(phraseBrute);

    // instruction simple a été trouvée
    if (instructionDecomposee) {
      let instruction = AnalyseurCommunUtils.creerInstructionSimple(instructionDecomposee);
      instructions.push(instruction)
      retVal = true;
      // instruction PAS correctement décomposée
    } else {
      retVal = false;
    }
    return retVal;
  }

  public static ressembleInstruction(instruction: string): boolean {
    return true;
  }

}