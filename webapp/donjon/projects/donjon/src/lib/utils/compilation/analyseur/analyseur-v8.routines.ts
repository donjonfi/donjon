import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { ERoutine, Routine } from "../../../models/compilateur/routine";
import { EtiquetteAction, RoutineAction } from "../../../models/compilateur/routine-action";

import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { CibleAction } from "../../../models/compilateur/cible-action";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Evenement } from "../../../models/jouer/evenement";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { RoutineRegle } from "../../../models/compilateur/routine-regle";
import { RoutineSimple } from "../../../models/compilateur/routine-simple";
import { StringUtils } from "../../commun/string.utils";
import { TypeRegle } from "../../../models/compilateur/type-regle";

export class AnalyseurV8Routines {

  private static pileRoutine = 0;

  public static indexRoutineSansNom = 1;

  /**
   * Traiter l'ensemble du bloc qui devrait commencer à la prochaine phrase.
   * @returns true si une routine a effectivement été trouvée.
   */
  public static traiterRoutine(debutRoutineTrouve: ERoutine, phrases: Phrase[], ctx: ContexteAnalyseV8): boolean {

    console.log("### DÉBUT traiter ROUTINE", ++this.pileRoutine);

    let retVal = false;
    let routine: Routine | undefined;
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
        ctx.probleme(phrases[ctx.indexProchainePhrase - 1], routine,
          CategorieMessage.structureRoutine, CodeMessage.finRoutineManquant,
          `fin ${Routine.TypeToMotCle(routine.type, false)} manquant.`,
          `Un {@fin ${Routine.TypeToMotCle(routine.type, false)}@} est attendu ici.`,
        );
      }
      retVal = true;
    } else {
      // routine pas trouvée
      ctx.probleme(phrases[sauvegardeIndexPhraseInitial], undefined,
        CategorieMessage.syntaxeRoutine, CodeMessage.routineIntrouvable,
        `${Routine.TypeToNom(debutRoutineTrouve)} introuvable.`,
        `Une ${Routine.TypeToNom(debutRoutineTrouve)} était attendue mais n’a finalement pas été trouvée.`,
      );
      // pointer la prochaine phrase
      ctx.indexProchainePhrase++;
    }

    console.log("### FIN traiter ROUTINE", this.pileRoutine--);

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
    let nomRoutine = AnalyseurV8Utils.chercherEtiquetteEtReste(['routine'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
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
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
          'nom routine simple incorrect',
          `Le nom de la routine simple doit faire exactement un mot. Ex: {@routine MaSuperRoutine:@}`,
        );
        nomRoutine = ('routineSansNom' + AnalyseurV8Routines.indexRoutineSansNom++);
      }
      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        // phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // A. CHERCHER ÉTIQUETTES SPÉCIFIQUES À INSTRUCTION SIMPLE
        // (il n’y en a pas)

        // B. CHERCHER DÉBUT/FIN ROUTINE
        // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutine)
        const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

        // C. CHERCHER INSTRUCTION ou BLOC CONTRÔLE
        // (l’index de la phrochaine phrase est géré par chercherInstructionOuBlocControle)
        if (!debutFinRoutineTrouve) {
          AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.instructions, routine, ctx);
        }

      }
      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.erreur(phraseAnalysee, routine,
        CategorieMessage.erreurDonjon, CodeMessage.etiquetteEnteteIntrouvable,
        'étiquette d’entête pas trouvée',
        `L’étiquette d’entête de le routine simple n’a pas été trouvée.`,
      );
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
    let enonceRegle = AnalyseurV8Utils.chercherEtiquetteEtReste(['règle'], phraseAnalysee, ObligatoireFacultatif.obligatoire);

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
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.syntaxeRegle, CodeMessage.typeRegleInconnu,
              "type de règle inconnu",
              `Seules les règles de type {@avant@} et {@après@} sont prises en charge.`,
            );
            typeRegle = TypeRegle.inconnu;
            break;
        }
        // retrouver évènement(s)
        evenements = PhraseUtils.getEvenementsRegle(enonceDecompose[2]);

        if (!evenements.length) {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeRegle, CodeMessage.formulationEvenementReglePasComprise,
            'formulation évènement pas comprise',
            `La formulation de l’évènement qui doit déclencher la règle n’a pas été comprise. Exemple d’entête : {@règle après prendre l’épée: @}`,
          );
        }

        // création de la routine
        routine = new RoutineRegle(typeRegle, evenements, phraseAnalysee.ligne);

      } else {
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeRoutine, CodeMessage.regleIntrouvable,
          "règle pas comprise",
          `L’entête de la règle n’a pas pu être décomposé.`,
        );

        // on crée une routine « bidon » afin de tout de même analyser la suite des phrases de la routine.
        routine = new RoutineRegle(typeRegle, evenements, phraseAnalysee.ligne);
      }

      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        // phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // a. CHERCHER ÉTIQUETTES SPÉCIFIQUES À RÈGLE
        // (il n’y en a pas)

        // b. CHERCHER DÉBUT/FIN ROUTINE
        // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutine)
        const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

        // c. CHERCHER INSTRUCTION ou BLOC CONTRÔLE
        // (l’index de la phrochaine phrase est géré par chercherInstructionOuBlocControle)
        if (!debutFinRoutineTrouve) {
          AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.instructions, routine, ctx);
        }
      }
    } else {
      // étiquette pas trouvée (ne devrait jamais arriver)
      ctx.erreur(phraseAnalysee, routine,
        CategorieMessage.erreurDonjon, CodeMessage.etiquetteEnteteIntrouvable,
        "étiquette d’entête pas trouvée",
        `L’étiquette d’entête de la règle n’a pas été trouvée.`,
      );
    }

    return routine;
  }

  /**
   * Traiter la routine (Action)
   */
  public static traiterRoutineAction(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineAction | undefined {
    let routine: RoutineAction | undefined;

    // phase par défaut: exécution.
    let etiquetteActuelle: EtiquetteAction = EtiquetteAction.phaseExecution;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];
    // trouver le nom de la routine
    let enteteAction = AnalyseurV8Utils.chercherEtiquetteEtReste(['action'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
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
        // éviter que l’auteur s’emmêle les pinceaux entre ceci et cela.
        if (enteteDecompose[3] == 'cela') {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
            'complément direct nommé cela',
            `action « ${infinitif} »: utilisation de {@cela@} au lieu de {@ceci@}: le complément direct doit toujours être nommé {@ceci@}, le complément indirect sera nommé {@cela@}. Exemple: {@action ouvrir ceci avec cela@}.`,
          );
        }
        if (enteteDecompose[5] == 'ceci') {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
            'complément indirect nommé ceci',
            `action « ${infinitif} »: utilisation de {@ceci@} au lieu de {@cela@}: le complément indirect doit toujours être nommé {@cela@}, le complément direct sera nommé {@ceci@}. Exemple: {@action ouvrir ceci avec cela@}.`,
          );
        }
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
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeAction, CodeMessage.actionIntrouvable,
          "action pas comprise",
          `L’entête de l’action n’a pas pu être décomposé. Voici un exemple d’entête valide : {@action ouvrir ceci avec cela: @}`,
        );
        // on crée une action « bidon » afin de tout de même analyser la suite des phrases de la routine.
        routine = new RoutineAction("(sans entête)", undefined, false, undefined, false, phraseAnalysee.ligne);
      }

      // B. CORPS et PIED
      // parcours de la routine jusqu’à la fin
      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        phraseAnalysee = phrases[ctx.indexProchainePhrase];

        // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES À ACTION

        // > i. PHASE
        let etiquettePhase = AnalyseurV8Utils.chercherEtiquetteEtReste(['phase'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
        if (etiquettePhase !== undefined) {
          const motClePhase = StringUtils.normaliserMot(etiquettePhase);
          switch (motClePhase) {
            case 'prerequi':
            case 'prerequis':
              etiquetteActuelle = EtiquetteAction.phasePrerequis;
              break;
            case 'execution':
              etiquetteActuelle = EtiquetteAction.phaseExecution;
              break;
            case 'epilogue':
              etiquetteActuelle = EtiquetteAction.phaseEpilogue;
              break;
            default:
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.syntaxeAction, CodeMessage.phaseActionInconnue,
                'phase inconnue',
                `Seules les phases suivantes sont supportées: {@prérequis@}, {@exécution@} et {@épilogue@}.`,
              );

              etiquetteActuelle = EtiquetteAction.phaseExecution;
              break;
          }
          // passer à la phrase suivante
          ctx.indexProchainePhrase++;

          // > ii. CECI/CELA
        } else {
          // let etiquetteCeciCela = AnalyseurV8Utils.chercherEtiquetteParmiListe(['ceci', 'cela'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
          let etiquetteCeciCela = AnalyseurV8Utils.chercherEtiquetteEtReste(['définition', 'définitions'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
          if (etiquetteCeciCela) {

            switch (etiquetteCeciCela) {
              case 'ceci':
                etiquetteActuelle = EtiquetteAction.ceci;
                if (!routine.action.ceci) {
                  ctx.probleme(phraseAnalysee, routine,
                    CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
                    'complément direct (ceci) inexistant',
                    `Étiquette {@ceci:@} trouvée mais l’entête de l’action n’inclut pas de complément direct {@ceci@}.`,
                  );
                  // définir ceci par défaut
                  routine.action.cibleCeci = new CibleAction('un', 'objet', 'visible');
                }
                break;

              case 'cela':
                etiquetteActuelle = EtiquetteAction.cela;
                if (!routine.action.cela) {
                  ctx.probleme(phraseAnalysee, routine,
                    CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
                    'complément indirect (cela) inexistant',
                    `Étiquette {@cela:@} trouvée mais l’entête de l’action n’inclut pas de complément indirect {@cela@}.`,
                  );
                  // définir cela par défaut
                  routine.action.cibleCela = new CibleAction('un', 'objet', 'visible');
                }
                break;

              default:
                throw new Error("Étiquette inconnue: " + etiquetteCeciCela);
            }

            // passer à la phrase suivante
            ctx.indexProchainePhrase++;

            // b) CHERCHER DÉBUT/FIN ROUTINE
            // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutine)
          } else {

            const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

            // c) CHERCHER PRÉREQUIS, INSTRUCTION ou DÉFINITION
            // (l’index de la phrochaine phrase est géré par chercherPrerequis, chercherInstructionOuBlocControle et chercherInfosComplement)
            if (!debutFinRoutineTrouve) {
              switch (etiquetteActuelle) {
                case EtiquetteAction.phasePrerequis:
                  // this.chercherEtTraiterPrerequis(phrases, routine.action.phasePrerequis, routine, ctx);
                  AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.action.phasePrerequis, routine, ctx);
                  break;

                case EtiquetteAction.phaseExecution:
                  AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.action.phaseExecution, routine, ctx);
                  break;

                case EtiquetteAction.phaseEpilogue:
                  AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.action.phaseEpilogue, routine, ctx);
                  break;

                case EtiquetteAction.ceci:
                  this.chercherEtTraiterDefinitionComplement(phrases, routine.action.cibleCeci, routine, ctx);
                  break;

                case EtiquetteAction.cela:
                  this.chercherEtTraiterDefinitionComplement(phrases, routine.action.cibleCela, routine, ctx);
                  break;

                default:
                  throw new Error("traiterRoutineAction: etiquetteActuelle inconnue.");
              }

            }
          }


        }
      }

      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.erreur(phraseAnalysee, routine,
        CategorieMessage.erreurDonjon, CodeMessage.etiquetteEnteteIntrouvable,
        "étiquette d’entête pas trouvée",
        `L’étiquette d’entête de l’action n’a pas été trouvée.`,
      );
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


  // private static chercherEtTraiterPrerequis(phrases: Phrase[], verifications: Verification[], routine: Routine, ctx: ContexteAnalyseV8): void {

  //   // phrase à analyser
  //   let phraseAnalysee = phrases[ctx.indexProchainePhrase];

  //   // TODO: à implémenter
  //   console.warn("todo: chercherPrerequis", phraseAnalysee);

  //   // pointer la phrase suivante
  //   ctx.indexProchainePhrase++;
  // }

  private static chercherEtTraiterDefinitionComplement(phrases: Phrase[], complement: CibleAction, routine: Routine, ctx: ContexteAnalyseV8): void {

    // phrase à analyser
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];

    // TODO: à implémenter
    console.warn("todo: chercherInfosComplement", phraseAnalysee);

    // pointer la phrase suivante
    ctx.indexProchainePhrase++;
  }


  /**
   * Chercher début/fin routine.
   * Le cas échéant on ferme la routine actuelle.
   * @return true si début/fin routine trouvé.
   */
  private static chercherTraiterDebutFinRoutine(phrases: Phrase[], routine: Routine, ctx: ContexteAnalyseV8): boolean {

    // on n’a pas encore trouvé de début ou fin routine.
    let debutFinRoutineTrouve = false;

    // phrase à analyser
    let phraseAnalysee = phrases[ctx.indexProchainePhrase];

    console.log("@@@@@ chercherDebutFinRoutine > ", phraseAnalysee.toString());

    // CAS 1: FIN ROUTINE => on finit la routine
    const finRoutineTrouve = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
    if (finRoutineTrouve) {
      debutFinRoutineTrouve = true;
        routine.ouvert = false;
      if (ctx.verbeux) {
        console.log(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: fin ${Routine.TypeToMotCle(routine.type, false)} trouvé.`);
      }
      if (finRoutineTrouve === routine.type) {
        routine.correctementFini = true;
      } else {
        routine.correctementFini = false;
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.structureRoutine, CodeMessage.finRoutineDifferent,
          'fin routine différent',
          `Un {@fin ${Routine.TypeToMotCle(routine.type, false)}@} est attendu à la place du {@fin ${Routine.TypeToMotCle(finRoutineTrouve, false)}@}.`,
        );
      }
      // pointer la phrase suivante
      ctx.indexProchainePhrase++;
    } else {
      // CAS 2: DÉBUT AUTRE ROUTINE => ERREUR (et on termine la routine précédente.)
      const debutRoutineTrouve = AnalyseurV8Utils.chercherDebutRoutine(phraseAnalysee);
      if (debutRoutineTrouve) {
        debutFinRoutineTrouve = true;
        if (ctx.verbeux) {
          console.warn(`[AnalyseurV8.routines] l.${phraseAnalysee.ligne}: début routine (${Routine.TypeToMotCle(routine.type, false)}) trouvé alors que routine précédente pas terminée.`);
        }
        routine.ouvert = false;
        routine.correctementFini = false;
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.structureRoutine, CodeMessage.finRoutineManquant,
          'routine pas finie',
          `Un {@fin ${Routine.TypeToMotCle(routine.type, false)}@} est attendu avant le prochain début {@${Routine.TypeToMotCle(debutRoutineTrouve, false)}@}.`,
        );
        // ne PAS pointer la phrase suivante car la phrase actuelle va être analysée à nouveau.
      }
    }

    return debutFinRoutineTrouve;
  }



}