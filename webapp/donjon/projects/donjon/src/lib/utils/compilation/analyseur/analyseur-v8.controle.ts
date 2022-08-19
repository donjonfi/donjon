import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { EInstructionControle, InstructionControle } from "../../../models/compilateur/instruction-controle";

import { AnalyseurCondition } from "./analyseur.condition";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { EtiquetteSi } from "../../../models/compilateur/bloc-instructions";
import { ExprReg } from "../expr-reg";
import { Instruction } from "../../../models/compilateur/instruction";
import { Phrase } from "../../../models/compilateur/phrase";
import { Routine } from "../../../models/compilateur/routine";

export class AnalyseurV8Controle {

  /**
   * Traiter l’instruction de contrôle qui débute à la phrase suivante.
   */
  public static traiterBlocControle(debutInstructionControleTrouve: EInstructionControle, phrases: Phrase[], routine: Routine, instructions: Instruction[], ctx: ContexteAnalyseV8) {
    let instruction: Instruction | undefined;
    const sauvegardeIndexPhraseInitial = ctx.indexProchainePhrase;

    switch (debutInstructionControleTrouve) {
      case EInstructionControle.si:
        instruction = this.traiterInstructionSi(phrases, routine, ctx);
        break;

      case EInstructionControle.choisir:
        instruction = this.traiterInstructionChoisir(phrases, routine, ctx);
        break;

      default:
        throw new Error("traiterBlocControle: type d’instruction de contrôle non pris en charge:" + debutInstructionControleTrouve);

    }
    // vérifier les erreurs éventuelles et ajouter l’instruction
    if (instruction) {
      instructions.push(instruction);
    } else {
      ctx.ajouterErreur(phrases[sauvegardeIndexPhraseInitial].ligne, `Une instruction de contrôle ${InstructionControle.TypeToMotCle(debutInstructionControleTrouve)} était attendue mais n’a finalement pas été trouvée.`);
      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;
    }
  }

  /**
   * Traiter la prochaine intruction de contrôle de type « si ».
   */
  public static traiterInstructionSi(phrases: Phrase[], routine: Routine, ctx: ContexteAnalyseV8): Instruction | undefined {

    let instruction: Instruction | undefined;
    // phase par défaut: exécution.
    let etiquetteActuelle: EtiquetteSi = EtiquetteSi.si;

    // A. ENTÊTE
    // => ex: « règle avant manger la pomme : »
    // => ex: « règle après une action quelconque : »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];

    const phraseConditionBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);
    let conditionBruteSeule: string | undefined;
    let consequenceBruteSeule: string | undefined;
    // s’il s’agit de l’entête d’un bloc si (« si condition: conséquences finsi »)
    if (phraseConditionBrute.endsWith(':')) {
      conditionBruteSeule = phraseConditionBrute;
      // sinon il s’agit d’un si rapide (« si condition, conséquence. »)
    } else {
      // décomposer la condition de sa conséquence
      let resultSiCondIns = ExprReg.xSeparerSiConditionInstructions.exec(phraseConditionBrute);
      if (resultSiCondIns[2] == ',') {
        conditionBruteSeule = resultSiCondIns[1];
        consequenceBruteSeule = resultSiCondIns[3];
        // si , pas trouvée, erreure
      } else {
        ctx.ajouterErreur(phraseAnalysee.ligne, `${routine.titre}: instruction si: il ne s’agit ni d’un « bloc si » (exemple: « si condition: conséquences. fin si ») ni d’un « si rapide » (exemple: « si condition, conséquence. »).`);
      }
    }

    // si on a trouvé une condition
    if (conditionBruteSeule) {
      const condition = AnalyseurCondition.getConditionMulti(conditionBruteSeule);

      let nouvelleListeInstructionsSi = new Array<Instruction>();
      let nouvelleListeInstructionsSinon = new Array<Instruction>();
      instruction = new Instruction(undefined, undefined, condition, nouvelleListeInstructionsSi, nouvelleListeInstructionsSinon);

      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;

      let finBlocAtteinte = false;

      // I) condition si rapide
      if (consequenceBruteSeule) {
        AnalyseurV8Instructions.traiterInstructionSimple(consequenceBruteSeule, instruction.instructionsSiConditionVerifiee);

        // II) bloc si
      } else {
        // B. CORPS et PIED
        // parcours du bloc jusqu’à la fin
        while (!finBlocAtteinte && ctx.indexProchainePhrase < phrases.length) {
          phraseAnalysee = phrases[ctx.indexProchainePhrase];

          // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES AU BLOC SI

          // i. sinon
          let etiquetteSinon = AnalyseurV8Utils.chercherEtiquetteParmiListe(['sinon'], phraseAnalysee, ObligatoireFacultatif.facultatif);
          if (etiquetteSinon) {
            etiquetteActuelle = EtiquetteSi.sinon;
            // pointer la prochaine phrase
            ctx.indexProchainePhrase++;

            // ii. sinonsi
          } else {
            let etiquetteSinonSi = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinonsi'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
            if (etiquetteSinonSi) {
              etiquetteActuelle = EtiquetteSi.sinonsi;
              // => ne PAS pointer la prochaine phrase (car on doit encore analyser la condition)
            }
          }

          // b) CHERCHER FIN INSTRUCTION CONTRÔLE
          const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
          if (finInstructionControleTrouvee) {
            // si il s’agit de la fin contrôle attendue
            if (finInstructionControleTrouvee == EInstructionControle.si) {
              finBlocAtteinte = true;
              // pointer la phrase suivante
              ctx.indexProchainePhrase++;
              // sinon c’est une erreur
            } else {
              ctx.ajouterErreur(phraseAnalysee.ligne, `${routine.titre}: L’instruction de contrôle commencée est un « si » mais un « fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} » a été trouvé. Probablement qu’un « fin si » est manquant.`);
              // on termine tout de même le bloc
              finBlocAtteinte = true;
              // => on ne pointe PAS la phrase suivante: on pourra ainsi éventuellement fermer le bloc parent.
            }
          } else {
            // c) CHERCHER DÉBUT/FIN ROUTINE (erreur)
            const debutFinRoutineTrouve = this.chercherDebutFinRoutine(phraseAnalysee);
            if (debutFinRoutineTrouve) {
              // on ne s’attend pas à trouver un début/fin routine ici!
              ctx.ajouterErreur(phraseAnalysee.ligne, `${routine.titre}: Une instruction ou un « fin si » est attendu ici.`);
              // => on ferme le bloc en cours et on n’avance pas à la phrase suivante
              //    afin qu’elle soit analysée à nouveau
              finBlocAtteinte = true;

              // c) CHERCHER INSTRUCTION ou BLOC CONTRÔLE
              // (l’index de la phrochaine phrase est géré par chercherInstructionOuBlocControle)
            } else {
              switch (etiquetteActuelle) {
                case EtiquetteSi.si:
                  AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, instruction.instructionsSiConditionVerifiee, routine, ctx);
                  break;

                case EtiquetteSi.sinon:
                  AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, instruction.instructionsSiConditionPasVerifiee, routine, ctx);
                  break;

                // le sinonsi est en réalité un nouveau « si » à l’intérieur de la partie sinon de la condition actuelle
                case EtiquetteSi.sinonsi:
                  const instructionSinonSi = this.traiterInstructionSi(phrases, routine, ctx);
                  if (instructionSinonSi) {
                    instruction.instructionsSiConditionPasVerifiee.push(instructionSinonSi);
                  } else {
                    ctx.ajouterErreur(phraseAnalysee.ligne, `${routine.titre}: le sinonsi n’a pas pu être correctement interprété.`);
                  }
                  break;

                default:
                  throw new Error("traiterRoutineAction: etiquetteActuelle inconnue.");
              }
            }
          }
        }
      }

    }
    // retourner le bloc « si ».
    return instruction;
  }

  /**
   * Traiter la prochaine intsruction de contrôle de type « choisir ».
   */
  public static traiterInstructionChoisir(phrases: Phrase[], routine: Routine, ctx: ContexteAnalyseV8): Instruction | undefined {
    let instruction: Instruction | undefined;

    return instruction;
  }

  /**
   * Chercher si la prochaine phrase est un début ou un fin de rountine.
   */
  private static chercherDebutFinRoutine(phraseAnalysee): boolean {

    // on n’a pas encore trouvé de début ou fin routine.
    let debutFinRoutineTrouve = false;

    const finRoutineTrouve = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
    // CAS 1: FIN ROUTINE => ERREUR
    if (finRoutineTrouve) {
      debutFinRoutineTrouve = true;
    } else {
      // CAS 2: DÉBUT AUTRE ROUTINE => ERREUR
      const debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phraseAnalysee);
      if (debutRoutineTrouve) {
        debutFinRoutineTrouve = true;
      }
    }
    return debutFinRoutineTrouve;
  }

}