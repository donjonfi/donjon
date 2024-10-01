import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { BlocInstructions, EtiquetteSi, TypeChoisir } from "../../../models/compilateur/bloc-instructions";
import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { EInstructionControle, InstructionControle } from "../../../models/compilateur/instruction-controle";

import { AnalyseurCondition } from "./analyseur.condition";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { Choix } from "../../../models/compilateur/choix";
import { ClassesRacines } from "../../../models/commun/classes-racines";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Instruction } from "../../../models/compilateur/instruction";
import { Intitule } from "../../../models/jeu/intitule";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Routine } from "../../../models/compilateur/routine";
import { Valeur } from "../../../models/jeu/valeur";

export class AnalyseurV8Controle {

  private static pileBloc = 0;

  /**
   * Traiter l’instruction de contrôle qui débute à la phrase suivante.
   */
  public static traiterBlocControle(debutInstructionControleTrouve: EInstructionControle, phrases: Phrase[], routine: Routine, instructions: Instruction[], ctx: ContexteAnalyseV8) {

    let instruction: Instruction | undefined;
    const sauvegardeIndexPhraseInitial = ctx.indexProchainePhrase;


    switch (debutInstructionControleTrouve) {
      case EInstructionControle.si:
        instruction = this.traiterInstructionSi(false, phrases, routine, ctx);
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
      ctx.probleme(phrases[sauvegardeIndexPhraseInitial], routine,
        CategorieMessage.syntaxeControle, CodeMessage.instructionControleIntrouvable,
        "instruction de contrôle attendue",
        `Une instruction de contrôle « ${InstructionControle.TypeToMotCle(debutInstructionControleTrouve)} » était attendue mais n’a finalement pas été trouvée.`
      );
      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;
    }
  }

  /**
   * Traiter la prochaine intruction de contrôle de type « si ».
   */
  public static traiterInstructionSi(estSinonSi: boolean, phrases: Phrase[], routine: Routine, ctx: ContexteAnalyseV8): Instruction | undefined {

    let instruction: Instruction | undefined;
    // étiquette par défaut: si.
    let etiquetteActuelle: EtiquetteSi = EtiquetteSi.si;

    // A. ENTÊTE
    // => ex: « règle avant manger la pomme : »
    // => ex: « règle après une action quelconque : »
    let phraseAnalysee = ctx.getPhraseAnalysee(phrases);

    const phraseConditionBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    let conditionBruteSeule: string | undefined;
    let consequenceBruteSeule: string | undefined;
    // s’il s’agit de l’entête d’un bloc si (« si condition: conséquences finsi »)
    if (phraseConditionBrute.endsWith(':')) {
      // retirer le « : » final de la condition
      conditionBruteSeule = phraseConditionBrute.slice(0, phraseConditionBrute.length - 1);
      if (estSinonSi) {
        ctx.logResultatOk(`🔹 début bloc sinonsi`);
      } else {
        ctx.logResultatOk(`🔷 début bloc si`);
      }
      // sinon il s’agit d’un si rapide (« si condition, conséquence. »)
    } else {
      // décomposer la condition de sa conséquence
      let resultSiCondIns = ExprReg.xSeparerSiConditionInstructions.exec(phraseConditionBrute);
      // si on a bien trouvé une condition avec une , dedans
      if (resultSiCondIns && resultSiCondIns[2] == ',') {
        conditionBruteSeule = resultSiCondIns[1];
        ctx.logResultatOk(`si rapide`);
        consequenceBruteSeule = resultSiCondIns[3];
        // sinon erreur
      } else {
        ctx.logResultatKo(`pas pu décomposer condition`);
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeControle, CodeMessage.instructionSiIntrouvable,
          "condition pas comprise",
          `La condition n’a pas été correctement formulée.`,
        );
        // pointer la prochaine phrase
        ctx.indexProchainePhrase++;
      }
    }

    // si on a trouvé une condition
    if (conditionBruteSeule) {
      const condition = AnalyseurCondition.getConditionMulti(conditionBruteSeule);
      if (condition.erreurs.length) {
        ctx.logResultatKo(`pas pu décomposer condition`);
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeControle, CodeMessage.instructionSiIntrouvable,
          "condition pas comprise",
          `Cette condition n’a pas été correctement formulée.`,
        );
      } else {
        ctx.logResultatOk(`condition décomposée (${conditionBruteSeule})`);
      }

      let nouvelleListeInstructionsSi = new Array<Instruction>();
      let nouvelleListeInstructionsSinon = new Array<Instruction>();
      instruction = new Instruction(undefined, undefined, condition, nouvelleListeInstructionsSi, nouvelleListeInstructionsSinon);

      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;

      let finBlocAtteinte = false;

      // I) condition si rapide
      if (consequenceBruteSeule) {
        const instructionConsequenceTrouvee = AnalyseurV8Instructions.traiterInstructionSimple(consequenceBruteSeule, instruction.instructionsSiConditionVerifiee);
        if (instructionConsequenceTrouvee) {
          ctx.logResultatOk(`conséquence: instruction simple trouvée ${consequenceBruteSeule}`);
        } else {
          ctx.logResultatKo(`conséquence: instruction simple pas trouvée ${consequenceBruteSeule}`);
        }
        // II) bloc si
      } else {
        // B. CORPS et PIED
        // parcours du bloc jusqu’à la fin
        while (!finBlocAtteinte && ctx.indexProchainePhrase < phrases.length) {
          phraseAnalysee = ctx.getPhraseAnalysee(phrases);

          // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES AU BLOC SI

          // i. sinon
          let etiquetteSinon = AnalyseurV8Utils.chercherEtiquetteParmiListe(['sinon'], phraseAnalysee, ObligatoireFacultatif.facultatif);
          if (etiquetteSinon) {
            if (etiquetteActuelle === EtiquetteSi.sinon) {
              ctx.logResultatKo("🎫 double étiquette sinon");
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.structureBloc, CodeMessage.sinonsiSuitSinon,
                "sinon pas attendu ici",
                `L’étiquette {@sinon@} ne peut pas appraître plus d’une fois par condition.`,
              );
            } else {
              ctx.logResultatOk("🎫 étiquette sinon");
              etiquetteActuelle = EtiquetteSi.sinon;
              // pointer la prochaine phrase
              ctx.indexProchainePhrase++;
              continue;
            }
            // ii. sinonsi
          } else {
            let etiquetteSinonSi = AnalyseurV8Utils.chercherEtiquetteEtReste(['sinonsi'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
            if (etiquetteSinonSi) {
              if (etiquetteActuelle === EtiquetteSi.sinon) {
                ctx.logResultatKo("🎫 étiquette sinonsi après un sinon");
                ctx.probleme(phraseAnalysee, routine,
                  CategorieMessage.structureBloc, CodeMessage.sinonsiSuitSinon,
                  "sinonsi pas attendu ici",
                  `L’étiquette {@sinonsi@} ne peut pas suivre un {@sinon@}.`,
                );
              } else {
                ctx.logResultatOk("🎫 étiquette sinonsi");
                etiquetteActuelle = EtiquetteSi.sinonsi;
              }
              // => ne PAS pointer la prochaine phrase (car on doit encore analyser la condition)
            }
          }

          // b) CHERCHER FIN INSTRUCTION CONTRÔLE
          const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
          if (finInstructionControleTrouvee) {
            // si il s’agit de la fin contrôle attendue
            if (finInstructionControleTrouvee == EInstructionControle.si) {
              ctx.logResultatOk(`🟦 fin bloc si`);
              finBlocAtteinte = true;
              // pointer la phrase suivante
              ctx.indexProchainePhrase++;
              // sinon c’est une erreur
            } else {
              ctx.logResultatKo(`⬜ {@fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} @} inatendu (fin si était attendu)`);
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.structureBloc, CodeMessage.finBlocDifferent,
                "fin bloc différent",
                `L’instruction de contrôle commencée est un {@si@} mais un {@fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} @} a été trouvé. Probablement qu’un {@fin si@} est manquant.`,
              );
              // on termine tout de même le bloc
              finBlocAtteinte = true;
              // => on ne pointe PAS la phrase suivante: on pourra ainsi éventuellement fermer le bloc parent.
            }
          } else {
            // c) CHERCHER DÉBUT/FIN ROUTINE (erreur)
            const debutFinRoutineTrouve = this.chercherDebutFinRoutine(phraseAnalysee);
            if (debutFinRoutineTrouve) {
              // on ne s’attend pas à trouver un début/fin routine ici!
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.structureBloc, CodeMessage.finBlocManquant,
                "fin si manquant",
                `Un {@fin si@} est attendu avant la fin de ${Routine.TypeToMotCle(routine.type, true)}.{N}Condition débutée: {@${conditionBruteSeule}@}`,
              );

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
                  const instructionSinonSi = this.traiterInstructionSi(true, phrases, routine, ctx);
                  if (instructionSinonSi) {
                    instruction.instructionsSiConditionPasVerifiee.push(instructionSinonSi);
                  } else {
                    ctx.probleme(phraseAnalysee, routine,
                      CategorieMessage.syntaxeControle, CodeMessage.instructionSiIntrouvable,
                      "condition pas comprise",
                      `L’instruction {@sinonsi@} n’a pas été correctement formulée.`,
                    );
                  }
                  // on a atteint la fin du bloc (le fin si a déjà été traité par le sous-traiterInstructionSi)
                  finBlocAtteinte = true;
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

    // A. ENTÊTE
    // => ex: « choisir[:] » (choisir parmi les choix statiques)
    // => ex: « choisir librement[:] » (choisir librement)
    // => ex: « choisir parmi les couleurs disponibles[:] » (choisir parmi une liste dynamique)
    let phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    // trouver le type d’instruction choisir (statique, dynamique, libre)
    const typeChoisir = this.trouverTypeChoisir(phraseAnalysee, routine, ctx);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;
    // entête ok
    if (typeChoisir) {
      ctx.logResultatOk(`🔷 début bloc choisir (${BlocInstructions.typeChoisirToString(typeChoisir)})`);

      instruction = new Instruction(undefined, []);
      instruction.typeChoisir = typeChoisir;

      let finBlocAtteinte = false;

      let choixEnCours: Choix | undefined;

      // B. CORPS et PIED
      // parcours du bloc jusqu’à la fin
      while (!finBlocAtteinte && ctx.indexProchainePhrase < phrases.length) {
        phraseAnalysee = ctx.getPhraseAnalysee(phrases);

        // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES AU BLOC CHOISIR
        let estEtiquetteAutreChoix = AnalyseurV8Utils.chercherEtiquetteExacte(['autre choix', 'autres choix'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
        // AUTRE CHOIX
        if (estEtiquetteAutreChoix) {
          ctx.logResultatOk(`autre choix`);
          let valeurAutreChoix: Valeur = new Intitule("autre choix", new GroupeNominal(null, "autre choix", null), ClassesRacines.Intitule);
          choixEnCours = new Choix([valeurAutreChoix]);
          instruction.choix.push(choixEnCours);
          // pointer la prochaine phrase
          ctx.indexProchainePhrase++;
          continue;
        // CHOIX XXX
        } else {
          let resteEtiquetteChoix = AnalyseurV8Utils.chercherEtiquetteEtReste(['choix'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
          if (resteEtiquetteChoix) {
            const listeChoix = ExprReg.xListeTextesNombresOuIntitules.exec(resteEtiquetteChoix);
            if (listeChoix) {
              let valeursChoix: Valeur[];
              // texte
              if (listeChoix[1] !== undefined) {
                // séparer les textes
                valeursChoix = PhraseUtils.separerListeTextesOu(listeChoix[1], true);
                // nombre
              } else if (listeChoix[2] !== undefined) {
                // séparer les nombres
                // TODO: parseFloat ?
                valeursChoix = PhraseUtils.separerListeNombresEntiers(listeChoix[2], true);
                // intitulé (aucun choix, autre choix, élément précis, élémentA ou élémentB, …)
              } else {
                // TODO: séparer les intitulés
                // TODO: à améliorer ?
                valeursChoix = [new Intitule(listeChoix[3], undefined, ClassesRacines.Intitule)];
              }
              ctx.logResultatOk(`valeurs choix trouvées (${valeursChoix})`);
              choixEnCours = new Choix(valeursChoix);
              instruction.choix.push(choixEnCours);
            } else {
              ctx.logResultatOk(`valeurs choix pas trouvées`);
              choixEnCours = undefined;
            }
            // pointer la prochaine phrase
            ctx.indexProchainePhrase++;
            continue;
          }
        }

        // b) CHERCHER FIN INSTRUCTION CONTRÔLE
        const finInstructionControleTrouvee = AnalyseurV8Utils.chercherFinInstructionControle(phraseAnalysee);
        if (finInstructionControleTrouvee) {
          // si il s’agit de la fin contrôle attendue
          if (finInstructionControleTrouvee == EInstructionControle.choisir) {
            ctx.logResultatOk(`🟦 fin bloc choisir`);
            finBlocAtteinte = true;
            // pointer la phrase suivante
            ctx.indexProchainePhrase++;
            // sinon c’est une erreur
          } else {
            ctx.logResultatKo(`⬜ {@fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} @} inatendu (fin choisir était attendu)`);
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.structureBloc, CodeMessage.finBlocDifferent,
              "fin bloc différent",
              `L’instruction de contrôle commencée est un {@choisir@} mais un {@fin ${InstructionControle.TypeToMotCle(finInstructionControleTrouvee)} @} a été trouvé. Probablement qu’un {@fin choisir@} est manquant.`,
            );
            // on termine tout de même le bloc
            finBlocAtteinte = true;
            // => on ne pointe PAS la phrase suivante: on pourra ainsi éventuellement fermer le bloc parent.
          }
        } else {
          // c) CHERCHER DÉBUT/FIN ROUTINE (erreur)
          const debutFinRoutineTrouve = this.chercherDebutFinRoutine(phraseAnalysee);
          if (debutFinRoutineTrouve) {
            // on ne s’attend pas à trouver un début/fin routine ici!
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.structureBloc, CodeMessage.finBlocManquant,
              "fin choisir manquant",
              `Un {@fin choisir@} est attendu avant la fin de ${Routine.TypeToMotCle(routine.type, true)}.`,
            );

            // => on ferme le bloc en cours et on n’avance pas à la phrase suivante
            //    afin qu’elle soit analysée à nouveau
            finBlocAtteinte = true;

            // c) CHERCHER INSTRUCTION ou BLOC CONTRÔLE
            // (l’index de la phrochaine phrase est géré par chercherInstructionOuBlocControle)
          } else {
            if (choixEnCours) {
              AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, choixEnCours.instructions, routine, ctx);
            } else {
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.structureBloc, CodeMessage.finBlocManquant,
                'choix ou fin choisir attendu',
                `Un {@choix:@} ou un {@fin choisir@} est attendu ici.`,
              );
              ctx.logResultatKo("instruction alors que pas de choix");
              // pointer la prochaine phrase
              ctx.indexProchainePhrase++;
            }
          }
        }

      }

      // entête ko
    } else {
      ctx.logResultatKo(`entête du bloc choisir pas comprise.`);
    }
    return instruction;
  }

  /** Retrouver le type d’instruction de contrôle choisir (statique, dynamique, libre) */
  private static trouverTypeChoisir(phraseAnalysee: Phrase, routine: Routine, ctx: ContexteAnalyseV8): TypeChoisir | undefined {
    let typeChoisir: TypeChoisir | undefined;
    const phraseBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    // a. CHOISIR seul => choisir statique
    if (/^choisir( )*\:$/.test(phraseBrute)) {
      typeChoisir = TypeChoisir.statique;
      ctx.logResultatOk('choisir statique');
    } else {
      const resPremierChoixOuParmis = ExprReg.xSeparerChoisirInstructions.exec(phraseBrute);
      if (resPremierChoixOuParmis) {
        const premierChoixOuParmis = resPremierChoixOuParmis[1];
        // a bis. CHOISIR PARMIS LES CHOIX STATIQUES
        //    ex: choisir
        //          choix "oui":
        //            .......
        //          choix "non":
        //            ....
        //        fin choisir
        const etiquetteChoix = AnalyseurV8Utils.chercherEtiquetteEtReste(['choix'], premierChoixOuParmis, ObligatoireFacultatif.obligatoire);
        if (etiquetteChoix) {
          typeChoisir = TypeChoisir.statique;
          ctx.logResultatOk('choisir statique');
        } else {
          // b. CHOISIR LIBREMENT
          //    ex: choisir librement[:]
          //          choix "mlkjmlkj":
          //            ....
          //          autre choix:
          //            ...
          //         fin choisir
          const resLibrement = /^librement\s*(:$|(\s*(autre )?choix))/i.exec(premierChoixOuParmis);
          if (resLibrement) {
            typeChoisir = TypeChoisir.libre;
            ctx.logResultatOk('choisir libre');

            // c. CHOISIR PARMIS UNE LISTE DYNAMIQUE
            //    ex: choisir parmis les couleurs disponibles
            //          choix rose:
            //            .......
            //          choix jaune:
            //            ....
            //        fin choisir
          } else {
            const etiquetteParmis = AnalyseurV8Utils.chercherEtiquetteEtReste(['parmis'], premierChoixOuParmis, ObligatoireFacultatif.obligatoire);
            if (etiquetteParmis) {
              typeChoisir = TypeChoisir.dynamique;
              ctx.logResultatOk('choisir dynamique');

              ctx.logResultatKo('choisir dynamique pas encore pris en charge.');
              // => retrouver la liste dynamique (ex: les couleurs disponibles)
              // TODO: gestion des listes de choix dynamiques

              // d. INCONNU
            } else {
              typeChoisir = undefined;
              ctx.logResultatKo('entête choisir pas comprise');

              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.syntaxeControle, CodeMessage.instructionControleIntrouvable,
                'étiquette d’entête pas comprise',
                `L’étiquette d’entête du bloc choisir n’a pas été comprise.`,
              );
            }
          }
        }
      } else {


        // (NE DEVRAIS PAS ARRIVER) => on avait pré-vérifié l’instruction…
        ctx.logResultatKo('entête choisir pas trouvée.');
        ctx.erreur(phraseAnalysee, routine,
          CategorieMessage.erreurDonjon, CodeMessage.etiquetteEnteteIntrouvable,
          'étiquette d’entête pas trouvée',
          `L’étiquette d’entête du bloc choisir n’a pas été trouvée.`,
        );

      }

    }
    return typeChoisir;
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