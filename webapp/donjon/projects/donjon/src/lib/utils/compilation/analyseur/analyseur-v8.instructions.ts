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
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];

    console.log("@@@@@ chercherInstructionOuBlocControle > ", phraseAnalysee.toString());

    // CAS 1: DÉBUT INSTRUCTION CONTRÔLE => on traite le nouveau bloc contrôle
    const debutInstructionControleTrouve = AnalyseurV8Utils.chercherDebutInstructionControle(phraseAnalysee);
    if (debutInstructionControleTrouve) {
      AnalyseurV8Controle.traiterBlocControle(debutInstructionControleTrouve, phrases, routine, instructions, ctx);
      // (index de la phrase suivante géré par traiterBlocControle)
    } else {
      // CAS 2: FIN INSTRUCTION CONTRÔLE => ERREUR (et on continue avec la suite, on n’était pas dans un bloc)
      const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
      if (finInstructionControleTrouvee) {
        ctx.ajouterErreur(phraseAnalysee.ligne, `Aucune instruction de contrôle commencée, le « fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} » a été ignoré.`);
        // pointer la phrase suivante
        ctx.indexProchainePhrase++;
      } else {
        // CAS 3: INSTRUCTION SIMPLE
        const instructionSimpleTrouvee = AnalyseurV8Instructions.traiterInstructionSimple(phraseAnalysee, instructions);
        if (instructionSimpleTrouvee) {
          if (ctx.verbeux) {
            console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: instuction simple trouvée.`);
          }
          // pointer la phrase suivante
          ctx.indexProchainePhrase++;
          // CAS 4: RIEN TROUVÉ
        } else {
          // on n’a pas trouvé d’instruction
          instructionTrouvee = false;
          if (ctx.verbeux) {
            console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: instuction simple NON trouvée.`);
          }
          // CAS 4b: TROUVÉ FIN BLOC ERRONÉ
          if (AnalyseurV8Utils.chercherFinBlocInconnu(phraseAnalysee)) {
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.syntaxeRoutine, CodeMessage.finBlocInconnu,
              "fin bloc inconnu",
              `Il y a probablement une faute de frappe ici.`,
            );
          } else {
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.structureRoutine, CodeMessage.finBlocManquant,
              `fin ${Routine.TypeToMotCle(routine.type)} attendu`,
              `Une instruction ou un {@fin ${Routine.TypeToMotCle(routine.type)}@} est attendu ici.`,
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