import { AnalyseurV8Utils, ObligatoireFacultatif } from "./analyseur-v8.utils";
import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { ERoutine, Routine } from "../../../models/compilateur/routine";
import { EtiquetteAction, RoutineAction, SujetDefinitionAction, TypeResultatDefinitionAction } from "../../../models/compilateur/routine-action";
import { EtiquetteReaction, RoutineReaction } from "../../../models/compilateur/routine-reaction";

import { AnalyseurPropriete } from "./analyseur.propriete";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { CibleAction } from "../../../models/compilateur/cible-action";
import { ClassesRacines } from "../../../models/commun/classes-racines";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { Evenement } from "../../../models/jouer/evenement";
import { ExprReg } from "../expr-reg";
import { xCommandeInfinitif1GN } from "../gn-derivees";
import { decomposerResteGN } from "../../../models/commun/gn-fragments";
import { Genre } from "../../../models/commun/genre.enum";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Nombre } from "../../../models/commun/nombre.enum";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { RoutineRegle } from "../../../models/compilateur/routine-regle";
import { ParamRoutine } from "../../../models/compilateur/param-routine";
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
   * Traiter la routine (simple).
   *
   * Une routine simple a deux formes :
   *  - **courte** : `routine X:` puis instructions directement, `fin routine`.
   *    Pas de paramètres.
   *  - **étiquetée** : un bloc `définitions:` (paramètres ceci/cela typés)
   *    suivi d’un bloc `exécution:` (instructions). Les deux étiquettes
   *    acceptent les alias `phase définitions` / `phase exécution`.
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

      // Valider le nom (1 seul mot, caractères autorisés, pas mot réservé)
      if (!AnalyseurV8Routines.validerNomRoutine(nomRoutine, phraseAnalysee, routine, ctx)) {
        routine.nom = ('routineSansNom' + AnalyseurV8Routines.indexRoutineSansNom++);
      }

      // B. CORPS et PIED
      // Phase courante. Forme courte = exécution implicite ; les étiquettes
      // `définitions:` / `exécution:` (et alias `phase …`) basculent.
      let phaseActuelle: 'execution' | 'definitions' = 'execution';
      let etiquetteDefinitionsVue = false;
      let definitionsContientPhrase = false;
      let phraseDefinitions: Phrase | undefined;

      while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
        const phraseCourante = ctx.getPhraseAnalysee(phrases);

        // i. CHERCHER ÉTIQUETTE `définitions:` (+ alias)
        const etiquetteDefTrouve = AnalyseurV8Utils.chercherEtiquetteExacte(
          [
            'définitions', 'definitions', 'définition', 'definition',
            'phase définitions', 'phase definitions', 'phase définition', 'phase definition',
          ],
          phraseCourante, ObligatoireFacultatif.obligatoire);

        if (etiquetteDefTrouve) {
          if (etiquetteDefinitionsVue) {
            ctx.probleme(phraseCourante, routine,
              CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
              'bloc définitions répété',
              `La routine ne peut comporter qu’un seul bloc {@définitions:@}.`,
            );
          }
          etiquetteDefinitionsVue = true;
          phaseActuelle = 'definitions';
          phraseDefinitions = phraseCourante;
          ctx.indexProchainePhrase++;
          continue;
        }

        // ii. CHERCHER ÉTIQUETTE `exécution:` (+ alias)
        const etiquetteExecTrouve = AnalyseurV8Utils.chercherEtiquetteExacte(
          ['exécution', 'execution', 'phase exécution', 'phase execution'],
          phraseCourante, ObligatoireFacultatif.obligatoire);

        if (etiquetteExecTrouve) {
          phaseActuelle = 'execution';
          ctx.indexProchainePhrase++;
          continue;
        }

        // iii. CHERCHER DÉBUT/FIN ROUTINE
        // (l’index de la prochaine phrase est géré par chercherDebutFinRoutine)
        const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

        // iv. CHERCHER INSTRUCTION (mode exécution) ou DÉFINITION (mode définitions)
        if (!debutFinRoutineTrouve) {
          if (phaseActuelle === 'definitions') {
            if (this.chercherEtTraiterDefinitionRoutine(phrases, routine, ctx)) {
              definitionsContientPhrase = true;
            }
          } else {
            AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, routine.instructions, routine, ctx);
          }
        }
      }

      // Vérifier que le bloc définitions: n’est pas vide
      if (etiquetteDefinitionsVue && !definitionsContientPhrase) {
        ctx.probleme(phraseDefinitions ?? phraseAnalysee, routine,
          CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
          'bloc définitions vide',
          `Le bloc {@définitions:@} de la routine « ${routine.nom} » ne contient aucune définition de paramètre. Pour une routine sans paramètre, omettre l’étiquette.`,
        );
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

  /** Mots réservés interdits comme nom de routine (déjà normalisés via StringUtils.normaliserMot). */
  private static readonly motsReservesRoutine: ReadonlySet<string> = new Set<string>([
    'routine', 'executer', 'fin',
    'definitions', 'definition', 'execution',
    'ceci', 'cela',
    'avec', 'et', 'dans',
    'la', 'le', 'les',
    'un', 'une', 'des',
    'tour', 'seconde', 'minute', 'heure',
  ]);

  /** Valide le nom de routine. Retourne true si valide. Émet un problème sinon. */
  private static validerNomRoutine(nom: string, phrase: Phrase, routine: RoutineSimple, ctx: ContexteAnalyseV8): boolean {
    // 1) Doit faire exactement un mot
    if (!AnalyseurV8Utils.contientExactement1Mot(nom)) {
      ctx.probleme(phrase, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
        'nom routine simple incorrect',
        `Le nom de la routine simple doit faire exactement un mot. Ex: {@routine MaSuperRoutine:@}`,
      );
      return false;
    }
    // 2) Caractères autorisés : lettre/_ + alphanum/_ (accents acceptés)
    if (!/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*$/.test(nom)) {
      ctx.probleme(phrase, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
        'nom de routine invalide',
        `Le nom de la routine « ${nom} » contient des caractères non autorisés ou commence par un chiffre. Utiliser uniquement des lettres (accents acceptés), chiffres et soulignés ; le premier caractère doit être une lettre ou un souligné.`,
      );
      return false;
    }
    // 3) Pas un mot réservé du DSL
    const nomNormalise = StringUtils.normaliserMot(nom);
    if (AnalyseurV8Routines.motsReservesRoutine.has(nomNormalise)) {
      ctx.probleme(phrase, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.nomRoutineInvalide,
        'nom de routine réservé',
        `Le nom « ${nom} » est un mot réservé du DSL et ne peut pas être utilisé comme nom de routine. Choisir un autre nom.`,
      );
      return false;
    }
    return true;
  }

  /**
   * Chercher et traiter une définition de paramètre dans le bloc `définitions:`
   * d’une routine simple.
   *
   * Forme attendue : `ceci|cela est un|une <type>.`
   * Types acceptés : `nombre`, `texte`, ou n’importe quelle classe (résolution
   * différée au runtime via `ClasseUtils.trouverClasse`).
   *
   * @returns true si la phrase courante a bien été consommée comme définition.
   */
  private static chercherEtTraiterDefinitionRoutine(phrases: Phrase[], routine: RoutineSimple, ctx: ContexteAnalyseV8): boolean {
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    const phraseBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    const match = ExprReg.xRoutineDefinitionParam.exec(phraseBrute);
    if (!match) {
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.definitionAttendue,
        'définition de paramètre non comprise',
        `La phrase « ${phraseBrute} » dans le bloc {@définitions:@} n’est pas une définition de paramètre valide. Forme attendue : {@ceci est un <type>@} ou {@cela est un <type>@}. Types : {@nombre@}, {@texte@}, ou n’importe quelle classe (objet, lieu, personne, compteur, dragon, …).`,
      );
      ctx.indexProchainePhrase++;
      return false;
    }

    const sujet = match[1].toLocaleLowerCase();   // ceci | cela
    const article = match[2].toLocaleLowerCase(); // un | une | des
    const typeNom = StringUtils.normaliserMot(match[3]);

    // Refuser l’article « des » (paramètre singulier)
    if (article === 'des') {
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.definitionAttendue,
        'article « des » non admis',
        `Dans une définition de paramètre, l’article doit être {@un@} ou {@une@} (le paramètre est singulier). Trouvé : {@des@}.`,
      );
      ctx.indexProchainePhrase++;
      return true;
    }

    // Doublon ?
    if (sujet === 'ceci' && routine.ceci) {
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.definitionAttendue,
        'définition ceci en double',
        `La routine « ${routine.nom} » définit déjà un paramètre {@ceci@}.`,
      );
      ctx.indexProchainePhrase++;
      return true;
    }
    if (sujet === 'cela' && routine.cela) {
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.definitionAttendue,
        'définition cela en double',
        `La routine « ${routine.nom} » définit déjà un paramètre {@cela@}.`,
      );
      ctx.indexProchainePhrase++;
      return true;
    }
    // cela sans ceci ?
    if (sujet === 'cela' && !routine.ceci) {
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeRoutine, CodeMessage.definitionAttendue,
        'cela défini avant ceci',
        `La routine « ${routine.nom} » définit {@cela@} sans avoir défini {@ceci@}. Définir d’abord {@ceci@} ou ne pas définir {@cela@}.`,
      );
      ctx.indexProchainePhrase++;
      return true;
    }

    // Construire le ParamRoutine
    let param: ParamRoutine;
    if (typeNom === 'nombre') {
      param = new ParamRoutine('nombre');
    } else if (typeNom === 'texte') {
      param = new ParamRoutine('texte');
    } else {
      // Classe — sera résolue au runtime via ClasseUtils.trouverClasse(jeu.classes, typeNom)
      param = new ParamRoutine('classe', typeNom);
    }

    if (sujet === 'ceci') {
      routine.ceci = true;
      routine.paramCeci = param;
    } else {
      routine.cela = true;
      routine.paramCela = param;
    }

    ctx.logResultatOk(`définition routine: ${sujet} = ${typeNom}`);
    ctx.indexProchainePhrase++;
    return true;
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
    // détecter un éventuel préfixe « règle remplacer » et le réécrire en « action … » pour réutiliser le parseur d’action
    const phraseBruteEntete = Phrase.retrouverPhraseBrute(phraseAnalysee);
    const matchRemplacer = ExprReg.xRegleRemplacerAction.exec(phraseBruteEntete);
    const estRemplacement = matchRemplacer !== null;
    const phrasePourEntete: Phrase | string = estRemplacement
      ? 'action ' + phraseBruteEntete.substring(matchRemplacer![0].length)
      : phraseAnalysee;
    // trouver le nom de la routine
    let enteteAction = AnalyseurV8Utils.chercherEtiquetteEtReste(['action'], phrasePourEntete, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (enteteAction !== undefined) {
      ctx.logResultatOk(`entête action: ${enteteAction}`)

      // i. CECI/CELA
      // décomposer l’entête de l’action
      let enteteDecomposeCeciCela = ExprReg.xRoutineActionEnteteCeciCela.exec(enteteAction);
      if (enteteDecomposeCeciCela) {
        const infinitif = enteteDecomposeCeciCela[1];
        const isCeci = enteteDecomposeCeciCela[3] ? true : false;
        const isCela = enteteDecomposeCeciCela[5] ? true : false;
        // éviter que l’auteur s’emmêle les pinceaux entre ceci et cela.
        if (enteteDecomposeCeciCela[3]?.toLocaleLowerCase() == 'cela') {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
            'complément direct nommé cela',
            `action « ${infinitif} »: utilisation de {@cela@} au lieu de {@ceci@}: le complément direct doit toujours être nommé {@ceci@}, le complément indirect sera nommé {@cela@}. Exemple: {@action ouvrir ceci avec cela@}.`,
          );
        }
        if (enteteDecomposeCeciCela[5]?.toLocaleLowerCase() == 'ceci') {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
            'complément indirect nommé ceci',
            `action « ${infinitif} »: utilisation de {@ceci@} au lieu de {@cela@}: le complément indirect doit toujours être nommé {@cela@}, le complément direct sera nommé {@ceci@}. Exemple: {@action ouvrir ceci avec cela@}.`,
          );
        }
        let prepositionCeci: string | undefined;
        let prepositionCela: string | undefined;
        if (isCeci) {
          prepositionCeci = enteteDecomposeCeciCela[2] ?? undefined;
          if (isCela) {
            prepositionCela = enteteDecomposeCeciCela[4] ?? undefined;
          }
        }
        // création de l’action
        routine = new RoutineAction(infinitif, prepositionCeci, isCeci, prepositionCela, isCela, phraseAnalysee.ligne);
        routine.action.remplace = estRemplacement;
      } else {
        // ii. COMPLÉMENT DIRECT, COMPLÉMENT INDIRECT
        let enteteDecomposeCommande = xCommandeInfinitif1GN.exec(enteteAction);
        if (enteteDecomposeCommande) {
          // disposition (reste GN en 1 groupe) : verbe(1) prép0(2) det1(3) reste1(4) wrapper(5) prép2(6) det2(7) reste2(8)
          const gnCeci = enteteDecomposeCommande[4] ? decomposerResteGN(enteteDecomposeCommande[4], false) : undefined;
          const gnCela = enteteDecomposeCommande[8] ? decomposerResteGN(enteteDecomposeCommande[8], false) : undefined;

          const infinitif = enteteDecomposeCommande[1];
          const isCeci = enteteDecomposeCommande[4] ? true : false;
          const isCela = enteteDecomposeCommande[8] ? true : false;
          const prepositionCeci = enteteDecomposeCommande[2] ?? undefined;
          const prepositionCela = enteteDecomposeCommande[6] ?? undefined;

          // création de l’action
          routine = new RoutineAction(infinitif, prepositionCeci, isCeci, prepositionCela, isCela, phraseAnalysee.ligne);
          routine.action.remplace = estRemplacement;

          if (isCeci) {
            const determinantCeci = enteteDecomposeCommande[3] ?? undefined;
            const nomCeci = gnCeci ? gnCeci.nom : enteteDecomposeCommande[4];
            const epitheteCeci = gnCeci?.epithete ?? undefined;
            // j. COMPLÉMENT DIRECT CECI
            if (nomCeci.toLocaleLowerCase() == 'ceci') {
              // (C’est la valeur par défaut, rien à préciser ici.)
              // jj. COMPLÉMENT DIRECT CELA à la place de CECI
            } else if (nomCeci.toLocaleLowerCase() == 'cela') {
              // (C’est la valeur par défaut, rien à préciser ici.)
              // éviter que l’auteur s’emmêle les pinceaux entre ceci et cela.
              ctx.probleme(phraseAnalysee, routine,
                CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
                'complément direct nommé cela',
                `action « ${infinitif} »: utilisation de {@cela@} au lieu de {@ceci@}: le complément direct doit toujours être nommé {@ceci@}, le complément indirect sera nommé {@cela@}. Exemple: {@action ouvrir ceci avec la clé@}.`,
              );
              // jjj. COMPLÉMENT DIRECT SPÉCIFIQUE
            } else {
              const cibleCeci = new CibleAction(determinantCeci, nomCeci, epitheteCeci);
              cibleCeci.epithetesAvant = gnCeci?.epithetesAvant ?? [];
              routine.action.cibleCeci = cibleCeci;
            }

            if (isCela) {
              const determinantCela = enteteDecomposeCommande[7] ?? undefined;
              const nomCela = gnCela ? gnCela.nom : enteteDecomposeCommande[8];
              const epitheteCela = gnCela?.epithete ?? undefined;

              // k. COMPLÉMENT INDIRECT CELA
              if (nomCela.toLocaleLowerCase() == 'cela') {
                // (C’est la valeur par défaut, rien à préciser ici.)
                // kk. COMPLÉMENT INDIRECT CECI à la place de CELAf
              } else if (nomCela.toLocaleLowerCase() == 'ceci') {
                // (C’est la valeur par défaut, rien à préciser ici.)
                // éviter que l’auteur s’emmêle les pinceaux entre ceci et cela.
                ctx.probleme(phraseAnalysee, routine,
                  CategorieMessage.syntaxeAction, CodeMessage.nommageComplementsAction,
                  'complément indirect nommé ceci',
                  `action « ${infinitif} »: utilisation de {@ceci@} au lieu de {@cela@}: le complément indirect doit toujours être nommé {@cela@}, le complément direct sera nommé {@ceci@}. Exemple: {@action ouvrir la porte avec cela@}.`,
                );
                // kkk. COMPLÉMENT DIRECT SPÉCIFIQUE
              } else {
                const cibleCela = new CibleAction(determinantCela, nomCela, epitheteCela);
                cibleCela.epithetesAvant = gnCela?.epithetesAvant ?? [];
                routine.action.cibleCela = cibleCela;
                }
            }
          } else {
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.syntaxeAction, CodeMessage.actionIntrouvable,
              "action pas comprise",
              `L’entête de l’action n’a pas pu être décomposé. Voici un exemple d’entête valide : {@action ouvrir ceci avec la clé: @}`,
            );
          }
        } else {
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.actionIntrouvable,
            "action pas comprise",
            `L’entête de l’action n’a pas pu être décomposé. Voici un exemple d’entête valide : {@action ouvrir ceci avec cela: @}`,
          );
          // on crée une action « bidon » afin de tout de même analyser la suite des phrases de la routine.
          routine = new RoutineAction("(sans entête)", undefined, false, undefined, false, phraseAnalysee.ligne);
        }
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
          continue;

          // > ii. DÉFINITIONS (ceci, cela, déplacement, …)
        } else {

          let etiquetteDefinitions = AnalyseurV8Utils.chercherEtiquetteExacte(['définitions', 'definitions', 'définition', 'definition'], phraseAnalysee, ObligatoireFacultatif.obligatoire);

          if (etiquetteDefinitions) {

            ctx.logResultatOk("🎫 étiquette: définitions");

            etiquetteActuelle = EtiquetteAction.definitions;

            // passer à la phrase suivante
            ctx.indexProchainePhrase++;
            continue;

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

                case EtiquetteAction.definitions:
                  this.chercherEtTraiterDefinitionAction(phrases, routine, ctx);
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
  public static traiterRoutineReaction(phrases: Phrase[], ctx: ContexteAnalyseV8): RoutineReaction | undefined {
    let routine: RoutineReaction | undefined;
    // par défaut: on est dans la réaction « basique »
    let etiquetteActuelle: EtiquetteReaction = EtiquetteReaction.basique;
    let interlocuteur: ElementGenerique | undefined;
    let reactionActuelle: RoutineReaction;

    // A. ENTÊTE
    // => ex: « routine MaRoutine: »
    let phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    // trouver le nom de la routine
    let enteteReaction = AnalyseurV8Utils.chercherEtiquetteEtReste(['réaction', 'réactions', 'reaction', 'reactions'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
    // pointer la prochaine phrase
    ctx.indexProchainePhrase++;

    // si l’étiquette a bien été retrouvée (devrait toujours être le cas…)
    if (enteteReaction !== undefined) {
      // RETROUVER NOM INTERLOCUTEUR
      // retirer du/de/des qui débute le reste
      let sansDeterminant = enteteReaction.replace(/^(du |des |de (?:la |les )?|d'|d\u2019)/, "");
      let nomInterlocuteur = PhraseUtils.getGroupeNominalDefiniOuIndefini(sansDeterminant, false);
      if (nomInterlocuteur) {
        ctx.logResultatOk(`interlocuteur: ${nomInterlocuteur}`);
        // RETROUVER INTERLOCUTEUR
        interlocuteur = ctx.trouverElementGenerique(nomInterlocuteur.nom, nomInterlocuteur.epithete);
        if (interlocuteur) {
          ctx.logResultatOk(`interlocuteur trouvé.`);
        } else {
          ctx.logResultatKo(`interlocuteur pas trouvé.`);
          ctx.erreur(phraseAnalysee, routine,
            CategorieMessage.syntaxeReaction, CodeMessage.interlocuteurIntrouvable,
            "interlocuteur introuvable",
            `L’interlocuteur de la réaction n’a pas été trouvé. Il faut le définir avant de définir sa réaction.`,
          );
        }
      } else {
        ctx.logResultatKo(`interlocuteur n’est pas un groupe nominal.`);
        ctx.erreur(phraseAnalysee, routine,
          CategorieMessage.syntaxeReaction, CodeMessage.interlocuteurIntrouvable,
          "nom de l’interlocuteur pas pris en charge",
          `Le nom de l’interlocuteur doit être un groupe nominal.`,
        );
      }
      // étiquette pas trouvée (ne devrait jamais arriver)
    } else {
      ctx.erreur(phraseAnalysee, routine,
        CategorieMessage.erreurDonjon, CodeMessage.etiquetteEnteteIntrouvable,
        "étiquette d’entête pas trouvée",
        `L’étiquette d’entête de la réaction n’a pas été trouvée.`,
      );
    }

    // si on n’a pas d’interlocuteur: on va tout de même continuer l’analyse
    // mais du coup la réaction est ajoutée à un interlocuteur "bidon"
    if (!interlocuteur) {
      interlocuteur = new ElementGenerique("l’", "interlocuteur", "temporaire", "personne", ClassesRacines.Personne, undefined, Genre.m, Nombre.s, 1, []);
    }

    routine = new RoutineReaction([], phraseAnalysee.ligne);

    // B. CORPS et PIED
    // parcours de la routine jusqu’à la fin
    while (routine.ouvert && ctx.indexProchainePhrase < phrases.length) {
      phraseAnalysee = ctx.getPhraseAnalysee(phrases);

      // a) CHERCHER ÉTIQUETTES SPÉCIFIQUES À RÉACTION
      // > i. BASIQUE
      let etiquetteBasique = AnalyseurV8Utils.chercherEtiquetteExacte(['basique'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
      if (etiquetteBasique) {
        ctx.logResultatOk("🎫 étiquette: réaction basique");
        etiquetteActuelle = EtiquetteReaction.basique;
        const listeSujets = [new GroupeNominal(null, "aucun", "sujet")];
        reactionActuelle = new RoutineReaction(listeSujets, phraseAnalysee.ligne);
        interlocuteur.reactions.push(reactionActuelle);
        // passer à la phrase suivante
        ctx.indexProchainePhrase++;
        continue;
      }
      // > ii. CONCERNANT
      let etiquetteConcernant = AnalyseurV8Utils.chercherEtiquetteEtReste(['concernant'], phraseAnalysee, ObligatoireFacultatif.obligatoire);
      if (etiquetteConcernant) {
        const sujetsBruts = etiquetteConcernant;
        ctx.logResultatOk(`🎫 étiquette: concernant « ${sujetsBruts} »`);
        const listeSujets = AnalyseurPropriete.retrouverSujets(sujetsBruts, ctx, phraseAnalysee);
        reactionActuelle = new RoutineReaction(listeSujets, phraseAnalysee.ligne);
        interlocuteur.reactions.push(reactionActuelle);
        // passer à la phrase suivante
        ctx.indexProchainePhrase++;
        continue;
      }

      // b) CHERCHER DÉBUT/FIN ROUTINE
      // (l’index de la phrochaine phrase est géré par chercherDebutFinRoutine)
      const debutFinRoutineTrouve = this.chercherTraiterDebutFinRoutine(phrases, routine, ctx);

      // c) CHERCHER INSTRUCTION
      // (l’index de la phrochaine phrase est géré par chercherPrerequis, chercherInstructionOuBlocControle et chercherEtTraiterDefinitionSimpleComplement)
      if (!debutFinRoutineTrouve) {

        // si on ne se trouve pas encore dans une réaction, créer la réaction basique
        if (!reactionActuelle) {
          const listeSujets = [new GroupeNominal(null, "aucun", "sujet")];
          reactionActuelle = new RoutineReaction(listeSujets, phraseAnalysee.ligne);
          interlocuteur.reactions.push(reactionActuelle);
        }

        // chercher l’instruction
        AnalyseurV8Instructions.chercherEtTraiterInstructionSimpleOuControle(phrases, reactionActuelle.instructions, routine, ctx);
      }
    }
    return routine;
  }
  /**
   * Chercher la définition d’une action (ceci, cela, déplacement, …)
   * @param phrases 
   * @param routine 
   * @param ctx 
   */
  private static chercherEtTraiterDefinitionAction(phrases: Phrase[], routine: RoutineAction, ctx: ContexteAnalyseV8): void {

    // phrase à analyser
    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    const phraseBrute = Phrase.retrouverPhraseBrute(phraseAnalysee);

    // DÉFINITION DE PRÉPOSITION (probables / possibles) pour ceci/cela.
    // La syntaxe « prépositions ceci probables: sur » est découpée par le « : » en
    // deux phrases (étiquette + valeur) : on consomme donc aussi la phrase suivante.
    const labelPreposition = ExprReg.rDefinitionActionPrepositionLabel.exec(phraseBrute);
    if (labelPreposition) {
      this.chercherEtTraiterDefinitionPreposition(phrases, routine, ctx, labelPreposition);
      return;
    }

    // sujet: ceci, cela, déplacement
    let sujet = SujetDefinitionAction.autre;

    let resultatTrouve: RegExpExecArray;
    let typeResultat: TypeResultatDefinitionAction;
    // let typeEtatsTrouve: RegExpExecArray
    // let etatPrioritaireTrouve: RegExpExecArray;
    // let elementJeuTrouve: RegExpExecArray;
    // let destinationDeplacementTrouve: RegExpExecArray;

    resultatTrouve = ExprReg.rDefinitionComplementActionTypeEtat.exec(phraseBrute);
    if (resultatTrouve) {
      typeResultat = TypeResultatDefinitionAction.typeEtats
    } else {
      resultatTrouve = ExprReg.rDefinitionComplementActionEtatPrioritaire.exec(phraseBrute);
      if (resultatTrouve) {
        // prioritairement
        typeResultat = TypeResultatDefinitionAction.etatsPrioritaires
      } else {
        resultatTrouve = ExprReg.rDefinitionComplementActionElementJeu.exec(phraseBrute);
        if (resultatTrouve) {
          typeResultat = TypeResultatDefinitionAction.elementJeu
        } else {
          resultatTrouve = ExprReg.rDefinitionActionDeplacementJoueur.exec(phraseBrute);
          if (resultatTrouve) {
            typeResultat = TypeResultatDefinitionAction.destinationDeplacement
          } else {
            typeResultat = TypeResultatDefinitionAction.aucun;
          }
        }
      }
    }

    if (typeResultat !== TypeResultatDefinitionAction.aucun) {

      let cibleSujet: CibleAction;

      sujet = resultatTrouve[1].toLocaleLowerCase() == 'ceci' ? SujetDefinitionAction.ceci : (resultatTrouve[1].toLocaleLowerCase() == 'cela' ? SujetDefinitionAction.cela : SujetDefinitionAction.autre);

      // CECI
      if (sujet === SujetDefinitionAction.ceci) {
        // vérifier si ceci a été déclaré dans l’entête
        if (!routine.action.ceci) {
          ctx.logResultatKo("définition action: ceci défini mais absent de l’entête");
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
            'ceci défini mais absent de l’entête de l’action',
            `Une définition a été trouvée pour {@ceci@} mais l’entête de l’action n’inclut pas de complément indirect {@ceci@}.`,
          );
          // définir ceci par défaut
          routine.action.cibleCeci = new CibleAction('un', 'objet', 'vu, visible et accessible');
        }
        cibleSujet = routine.action.cibleCeci;
        // CELA
      } else if (sujet === SujetDefinitionAction.cela) {
        // vérifier si cela a été déclaré dans l’entête
        if (!routine.action.cela) {
          ctx.logResultatKo("définition action: cela défini mais absent de l’entête");
          ctx.probleme(phraseAnalysee, routine,
            CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
            'cela défini mais absent de l’entête de l’action',
            `Une définition a été trouvée pour {@cela@} mais l’entête de l’action n’inclut pas de complément indirect {@cela@}.`,
          );
          // définir cela par défaut
          routine.action.cibleCela = new CibleAction('un', 'objet', 'vu, visible et accessible');
        }
        cibleSujet = routine.action.cibleCela;
      }

      switch (typeResultat) {
        case TypeResultatDefinitionAction.typeEtats:
          // un ou une
          cibleSujet.determinant = resultatTrouve[2];
          // type
          cibleSujet.nom = resultatTrouve[3];
          // états requis
          cibleSujet.epithete = resultatTrouve[4] ?? undefined;
          // états prioritaires (prioritairement)
          cibleSujet.priorite = resultatTrouve[5] ?? undefined;
          break;

        case TypeResultatDefinitionAction.etatsPrioritaires:
          // états prioritaires (prioritairement)
          cibleSujet.priorite = resultatTrouve[2] ?? undefined;
          break;

        case TypeResultatDefinitionAction.elementJeu:
          // élément du jeu
          let groupeNominal = PhraseUtils.getGroupeNominalDefini(resultatTrouve[2], false);
          if (groupeNominal) {
            ctx.logResultatOk(`définition action: ${sujet === SujetDefinitionAction.ceci ? 'ceci' : 'cela'}: trouvé un élément jeu`);
            cibleSujet.determinant = groupeNominal.determinant;
            cibleSujet.nom = groupeNominal.nom;
            cibleSujet.epithete = groupeNominal.epithete;
          } else {
            ctx.logResultatKo(`définition action: ${sujet === SujetDefinitionAction.ceci ? 'ceci' : 'cela'}: élément jeu: pas un groupe nominal.`);
            ctx.probleme(phraseAnalysee, routine,
              CategorieMessage.syntaxeAction, CodeMessage.definitionAction,
              `définition de ${sujet === SujetDefinitionAction.ceci ? 'ceci' : 'cela'} pas comprise`,
              `La définition de ${sujet === SujetDefinitionAction.ceci ? 'ceci' : 'cela'} n’a pas été comprise. Un groupe nominal était attendu.`,
            );
          }
          break;

        case TypeResultatDefinitionAction.destinationDeplacement:
          // déplacement du joueur
          routine.action.destinationDeplacement = resultatTrouve[1].toLocaleLowerCase();
          break;

        default:
          ctx.logResultatKo(`définition action: type de resultat définition pas pris en charge.`);
          break;
      }

      // on n’a rien trouvé
    } else {
      ctx.logResultatKo(`définition action pas trouvée.`);
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeAction, CodeMessage.definitionAction,
        `définition action attendue`,
        `Une définition de l’action est attendue ici mais n’a pas été trouvée.`,
      );
    }

    // pointer la phrase suivante
    ctx.indexProchainePhrase++;

  }

  /**
   * Traiter une définition de préposition de complément (ceci/cela) :
   *   prépositions ceci probables: à, au et aux.
   *   prépositions ceci possibles: dans et sous.
   * L’étiquette et sa valeur forment deux phrases distinctes (le « : » est un
   * séparateur de phrase) : on consomme l’étiquette et la phrase-valeur suivante.
   *
   * Les « probables » remplacent la liste induite par l’en-tête (la 1re devient la forme
   * de base affichée) ; les « possibles » sont des séparateurs également acceptés, mieux
   * notés qu’une préposition imprévue mais moins que les « probables ».
   * @param label résultat de `rDefinitionActionPrepositionLabel` : [_, ceci|cela, probable(s)|possible(s)]
   */
  private static chercherEtTraiterDefinitionPreposition(phrases: Phrase[], routine: RoutineAction, ctx: ContexteAnalyseV8, label: RegExpExecArray): void {

    const phraseAnalysee = ctx.getPhraseAnalysee(phrases);
    const sujet = label[1].toLocaleLowerCase();          // 'ceci' | 'cela'
    const estProbable = /^probable/i.test(label[2]);
    const intituleLabel = `prépositions ${sujet} ${estProbable ? 'probables' : 'possibles'}`;

    // la valeur est la phrase suivante (préposition ou liste de prépositions).
    // Elle est absente si la phrase suivante est une autre étiquette, une fin de
    // routine ou vide. Quand elle est présente, on la consomme avec l’étiquette.
    const phraseValeur = phrases[ctx.indexProchainePhrase + 1];
    const valeurBrute = phraseValeur ? Phrase.retrouverPhraseBrute(phraseValeur).trim() : '';
    const valeurPresente = !!valeurBrute
      && !/:$/.test(valeurBrute)
      && !ExprReg.rDefinitionActionPrepositionLabel.test(valeurBrute)
      && !AnalyseurV8Utils.chercherFinRoutine(phraseValeur);
    const phrasesConsommees = valeurPresente ? 2 : 1;

    // le complément doit exister dans l’en-tête de l’action
    const complementPresent = sujet === 'ceci' ? routine.action.ceci : routine.action.cela;
    if (!complementPresent) {
      ctx.logResultatKo(`définition action: préposition ${sujet} définie mais ${sujet} absent de l’entête`);
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeAction, CodeMessage.complementActionInexistant,
        `${sujet} défini mais absent de l’entête de l’action`,
        `Une préposition a été définie pour {@${sujet}@} mais l’entête de l’action n’inclut pas de complément {@${sujet}@}.`,
      );
      ctx.indexProchainePhrase += phrasesConsommees;
      return;
    }

    if (!valeurPresente) {
      ctx.logResultatKo(`définition action: valeur de préposition manquante pour « ${intituleLabel} »`);
      ctx.probleme(phraseAnalysee, routine,
        CategorieMessage.syntaxeAction, CodeMessage.definitionAction,
        `préposition attendue`,
        `Une préposition était attendue après « ${intituleLabel}: ». Exemple : {@prépositions ${sujet} probables: sur.@}`,
      );
      // sauter la seule étiquette ; la phrase suivante sera analysée normalement
      ctx.indexProchainePhrase++;
      return;
    }

    const valeurs = valeurBrute.toLocaleLowerCase()
      .split(/\s*,\s*|\s+et\s+|\s+ou\s+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    if (estProbable) {
      // remplace la liste induite par l’en-tête ; la 1re devient la forme de base affichée.
      if (sujet === 'ceci') {
        routine.action.prepositionsCeciProbables = valeurs;
      } else {
        routine.action.prepositionsCelaProbables = valeurs;
      }
      ctx.logResultatOk(`définition action: prépositions ${sujet} probables = [${valeurs.join(', ')}]`);
    } else {
      if (sujet === 'ceci') {
        routine.action.prepositionsCeciPossibles = valeurs;
      } else {
        routine.action.prepositionsCelaPossibles = valeurs;
      }
      ctx.logResultatOk(`définition action: prépositions ${sujet} possibles = [${valeurs.join(', ')}]`);
    }

    // consommer l’étiquette ET la phrase-valeur
    ctx.indexProchainePhrase += 2;
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

      // une routine action ouverte via « règle remplacer X » accepte aussi `fin règle`.
      const estRemplacementOuvertCommeRegle = (routine instanceof RoutineAction)
        && routine.action?.remplace === true
        && finRoutineTrouve === ERoutine.regle;

      if (finRoutineTrouve === routine.type || estRemplacementOuvertCommeRegle) {
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