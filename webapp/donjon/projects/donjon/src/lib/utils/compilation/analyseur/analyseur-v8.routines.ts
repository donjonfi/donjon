import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { ERoutine, Routine } from "../../../models/compilateur/routine";
import { EtiquetteAction, RoutineAction } from "../../../models/compilateur/routine-action";

import { AnalyseurCondition } from "./analyseur.condition";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { CibleAction } from "../../../models/compilateur/cible-action";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Evenement } from "../../../models/jouer/evenement";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
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
    return retVal;
  }

  /**
   * Traiter la routine (simple)
   */
  public static traiterRoutineSimple(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineSimple | undefined {
    let routine: RoutineSimple | undefined;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    // trouver le nom de la routine
    let nomRoutine = AnalyseurV8Utils.chercherEtiquetteEtReste(['routine'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (nomRoutine !== undefined) {

      ctx.logResultatOk(`trouvé entête routine (${nomRoutine})`);

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
        //let phraseAnalysee = ctx.getPhraseAnalysee(phrases);

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
        `L’étiquette d’entête de la routine simple n’a pas été trouvée.`,
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
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
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
        // let phraseAnalysee = ctx.getPhraseAnalysee(phrases);

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
    let phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    // trouver le nom de la routine
    let enteteAction = AnalyseurV8Utils.chercherEtiquetteEtReste(['action'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (enteteAction !== undefined) {
      ctx.logResultatOk(`entête action: ${enteteAction}`)
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
        phraseAnalysee = ctx.getPhraseAnalysee(phrases);

        // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES À ACTION

        // > i. PHASE
        let etiquettePhase = AnalyseurV8Utils.chercherEtiquetteEtReste(['phase'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
        if (etiquettePhase !== undefined) {
          const motClePhase = StringUtils.normaliserMot(etiquettePhase);
          switch (motClePhase) {
            case 'prerequi':
            case 'prerequis':
              etiquetteActuelle = EtiquetteAction.phasePrerequis;
              ctx.logResultatOk("🎫 étiquette: phase prérequis");
              break;
            case 'execution':
              etiquetteActuelle = EtiquetteAction.phaseExecution;
              ctx.logResultatOk("🎫 étiquette: phase exécution");
              break;
            case 'epilogue':
              etiquetteActuelle = EtiquetteAction.phaseEpilogue;
              ctx.logResultatOk("🎫 étiquette: phase épilogue");
              break;
            default:
              ctx.logResultatKo("🎫 étiquette: phase: inconnue");
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
                if (routine.action.ceci) {
                  ctx.logResultatOk("🎫 étiquette: définition ceci");
                } else {
                  ctx.logResultatKo("🎫 étiquette: définition ceci: argument absent de l’entête");
                  ctx.probleme(phraseAnalysee, routine,
                    CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
                    'ceci absent de l’entête de l’action',
                    `Étiquette {@définition ceci:@} trouvée mais l’entête de l’action n’inclut pas de complément direct {@ceci@}.`,
                  );
                  // définir ceci par défaut
                  routine.action.cibleCeci = new CibleAction('un', 'objet', 'visible');
                }
                break;

              case 'cela':
                etiquetteActuelle = EtiquetteAction.cela;
                if (routine.action.cela) {
                  ctx.logResultatOk("🎫 étiquette: définition cela");
                } else {
                  ctx.logResultatKo("🎫 étiquette: définition cela: argument absent de l’entête");
                  ctx.probleme(phraseAnalysee, routine,
                    CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
                    'cela absent de l’entête de l’action',
                    `Étiquette {@définition cela:@} trouvée mais l’entête de l’action n’inclut pas de complément indirect {@cela@}.`,
                  );
                  // définir cela par défaut
                  routine.action.cibleCela = new CibleAction('un', 'objet', 'visible');
                }
                break;

              default:
                ctx.logResultatKo(`🎫 étiquette inconnue`);
                throw new Error(`Étiquette inconnue: etiquetteCeciCela`);
            }

            // passer à la phrase suivante
            ctx.indexProchainePhrase++;

            // b) CHERCHER DÉBUT/FIN ROUTINE
            // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutine)
          } else {

            const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

            // c) CHERCHER PRÉREQUIS, INSTRUCTION ou DÉFINITION
            // (l’index de la phrochaine phrase est géré par chercherPrerequis, chercherInstructionOuBlocControle et chercherEtTraiterDefinitionSimpleComplement)
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
                  this.chercherEtTraiterDefinitionSimpleComplement(phrases, routine.action.cibleCeci, etiquetteActuelle, routine, ctx);
                  break;

                case EtiquetteAction.cela:
                  this.chercherEtTraiterDefinitionSimpleComplement(phrases, routine.action.cibleCela, etiquetteActuelle, routine, ctx);
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
  //   let phraseAnalysee = ctx.getPhraseAnalysee(phrases);

  //   // TODO: à implémenter
  //   console.warn("todo: chercherPrerequis", phraseAnalysee);

  //   // pointer la phrase suivante
  //   ctx.indexProchainePhrase++;
  // }

  private static chercherEtTraiterDefinitionComplexeComplement(phrases: Phrase[], complement: CibleAction, etiquetteActuelle: EtiquetteAction, routine: Routine, ctx: ContexteAnalyseV8): void {

    // TODO: PRENDRE EN CHARGE DÉFINITION COMPLEXE
    // (PAS ENCORE UTILISÉ CAR PAS FONCTIONNEL.)

    // phrase à analyser
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    let phraseBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    let estSoitNiPasTrouve = ExprReg.rComplementActionEstSoitNiPas.exec(phraseBrute);
    let argCeciCela = estSoitNiPasTrouve[1]?.toLowerCase() ?? undefined;
    let argSoitNiPas = estSoitNiPasTrouve[2]?.toLowerCase() ?? undefined;
    let argSuite = estSoitNiPasTrouve[3].toLocaleLowerCase();

    // on a trouvé une définition de complément d’action
    if (estSoitNiPasTrouve) {

      // vérifier si le sujet éventuel correspond à l’étiquette qui précède la phrase
      // CECI
      if (etiquetteActuelle == EtiquetteAction.ceci) {
        if (argCeciCela == 'cela') {
          ctx.logResultatKo(`définition de cela hors étiquette cela.`);
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.definitionComplementAction,
            'défitition de cela pas attendue ici',
            `Cette définition de {@cela@} suit une étiquette {@ceci:@}.`,
          );
        }
        // CELA
      } else {
        if (argCeciCela == 'ceci') {
          ctx.logResultatKo(`définition de ceci hors étiquette ceci.`);
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.definitionComplementAction,
            'défitition de ceci pas attendue ici',
            `Cette définition de {@ceci@} suit une étiquette {@cela:@}.`,
          );
        }
      }

      // TODO: gérer des phrases plus complexes (soit, ni, pas, …)

      // let condition = AnalyseurCondition.getConditionMulti(phraseBrute);

      // // ctx.logResultatTemp('Condition:' + condition);
      // // console.log('condition:', condition);

      // découper les affirmations et retrouver leur type
      let estNegation: boolean;
      let estMultiple: boolean;
      let affirmations: string[] = [];

      switch (argSoitNiPas) {
        case 'soit':
          estMultiple = true;
          estNegation = false;
          affirmations = argSuite.split('soit');
          break;

        case 'ni':
          estMultiple = true;
          estNegation = true;
          affirmations = argSuite.split('ni');
          break;

        case 'pas':
          estMultiple = false;
          estNegation = true;
          break;

        default:
          estMultiple = false;
          estNegation = false;
          break;
      }

      if (estMultiple) {
        ctx.logResultatKo(`Définition multiple de complément d’action pas encore prise en charge.`);
      } else if (estNegation) {
        ctx.logResultatKo(`Définition négative de complément d’action pas encore prise en charge.`);
      } else {
        ctx.logResultatOk(`Trouvé définition complément.`);
      }


      // on n’a rien trouvé
    } else {
      ctx.logResultatKo(`fin ${Routine.TypeToMotCle(routine.type, false)} trouvé (pas celui attendu)`);
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeAction, CodeMessage.definitionComplementAction,
        `définition de ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'} attendue`,
        `Une définition de ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'} est attendue ici.`,
      );
    }

    // pointer la phrase suivante
    ctx.indexProchainePhrase++;
  }

  private static chercherEtTraiterDefinitionSimpleComplement(phrases: Phrase[], complement: CibleAction, etiquetteActuelle: EtiquetteAction, routine: Routine, ctx: ContexteAnalyseV8): void {

    // phrase à analyser
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    const phraseBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    const typeEtatsTrouve = ExprReg.rComplementActionTypeEtats.exec(phraseBrute);
    // on a trouvé un type (+ états)
    if (typeEtatsTrouve) {
      ctx.logResultatOk(`complément action: ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'}: trouvé un type`);
      const determinantType = typeEtatsTrouve[1];
      const type = typeEtatsTrouve[2];
      const etatsRequis = typeEtatsTrouve[3] ?? undefined;
      const etatsPrioritaires = typeEtatsTrouve[4] ?? undefined;
      complement.determinant = determinantType;
      complement.nom = type;
      complement.epithete = etatsRequis;
      complement.priorite = etatsPrioritaires;
    } else {
      const elementJeuTrouve = ExprReg.rComplementActionElementJeu.exec(phraseBrute);
      // on a trouvé un élément du jeu
      if (elementJeuTrouve) {
        let groupeNominal = PhraseUtils.getGroupeNominalDefini(elementJeuTrouve[1], false);
        if (groupeNominal) {
        ctx.logResultatOk(`complément action: ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'}: trouvé un élément jeu`);
          complement.determinant = groupeNominal.determinant;
          complement.nom = groupeNominal.nom;
          complement.epithete = groupeNominal.epithete;
        } else {
          ctx.logResultatKo(`complément action: élément jeu: pas un groupe nominal.`);
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.definitionComplementAction,
            `définition de ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'} pas comprise`,
            `La définition de ceci n’a pas été comprise. Un groupe nominal était attendu.`,
          );  
        }
        // on n’a rien trouvé
      } else {
        ctx.logResultatKo(`fin ${Routine.TypeToMotCle(routine.type, false)} trouvé (pas celui attendu)`);
        ctx.probleme(phraseAnalysee, routine,
          CategorieMessage.syntaxeAction, CodeMessage.definitionComplementAction,
          `définition de ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'} attendue`,
          `Une définition de ${etiquetteActuelle == EtiquetteAction.ceci ? 'ceci' : 'cela'} est attendue ici.`,
        );
      }
    }

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
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);

    // CAS 1: FIN ROUTINE => on finit la routine
    const finRoutineTrouve = AnalyseurV8Utils.chercherFinRoutine(phraseAnalysee);
    if (finRoutineTrouve) {
      debutFinRoutineTrouve = true;
      routine.ouvert = false;

      if (finRoutineTrouve === routine.type) {
        routine.correctementFini = true;
        ctx.logResultatOk(`🟧 fin ${Routine.TypeToMotCle(routine.type, false)}`);
      } else {
        routine.correctementFini = false;
        ctx.logResultatKo(`fin ${Routine.TypeToMotCle(routine.type, false)} trouvé (pas celui attendu)`);
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
        ctx.logResultatKo(`début ${Routine.TypeToMotCle(debutRoutineTrouve, false)} inattendu (${Routine.TypeToMotCle(routine.type, false)}@} déjà en cours.)`);
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