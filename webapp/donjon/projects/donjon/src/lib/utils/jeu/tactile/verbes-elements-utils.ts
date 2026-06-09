import { Action } from '../../../models/compilateur/action';
import { AleatoireUtils } from '../aleatoire-utils';
import { CibleAction } from '../../../models/compilateur/cible-action';
import { ClasseUtils } from '../../commun/classe-utils';
import { ConditionsUtils } from '../conditions-utils';
import { ContexteTour } from '../../../models/jouer/contexte-tour';
import { EClasseRacine } from '../../../models/commun/constantes';
import { ElementJeu } from '../../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../../commun/elements-jeu-utils';
import { Instruction } from '../../../models/compilateur/instruction';
import { Jeu } from '../../../models/jeu/jeu';
import { PhraseUtils } from '../../commun/phrase-utils';

/**
 * Verbe applicable à un élément du jeu, proposé par l’interface tactile.
 */
export interface SuggestionVerbe {
  /** Infinitif de l’action. */
  infinitif: string;
  /** Action correspondante. */
  action: Action;
  /** Commande (complète si l’action n’attend plus de complément, sinon préfixe). */
  commande: string;
  /** L’action attend-elle encore un premier complément (ceci) ? (constructeur global) */
  attendCeci: boolean;
  /** L’action attend-elle un second complément (cela) ? */
  attendCela: boolean;
  /** Préposition du premier complément (« vers », …). */
  prepositionCeci: string | undefined;
  /** Préposition du second complément (« à », « avec », …). */
  prepositionCela: string | undefined;
  /** L’action serait probablement refusée par ses prérequis (« si ceci…, refuser »). */
  probablementRefusee: boolean;
}

/**
 * Calcul des verbes applicables à un élément du jeu (interface tactile).
 */
export class VerbesElementsUtils {

  /** Verbes les plus courants, affichés en premier dans le menu tactile. */
  private static readonly VERBES_COURANTS = [
    'examiner', 'prendre', 'ouvrir', 'fermer', 'parler', 'lire', 'pousser', 'tirer',
    'déplacer', 'déverrouiller', 'donner', 'montrer', 'mettre', 'poser', 'utiliser',
    'manger', 'boire', 'sentir', 'toucher', 'fouiller', 'attaquer',
  ];

  /**
   * Lister les actions du jeu applicables à l’élément spécifié.
   * Le contrôle porte sur la cible (classe ou sujet précis + états), et les
   * refus conditionnels des prérequis sont évalués « à blanc » pour reléguer
   * en fin de liste les actions sans intérêt (ex. parler avec une table).
   */
  public static listerVerbes(element: ElementJeu, jeu: Jeu, eju: ElementsJeuUtils): SuggestionVerbe[] {
    // une seule suggestion par variante (infinitif seul / infinitif + second complément),
    // pour que « ouvrir » et « ouvrir … avec … » soient tous les deux proposés
    const parVariante = new Map<string, SuggestionVerbe>();
    const cond = new ConditionsUtils(jeu, false);

    jeu.actions.forEach(action => {
      if (!action.ceci || !action.cibleCeci) {
        return;
      }
      if (!VerbesElementsUtils.cibleCorrespond(element, action.cibleCeci, jeu, eju)) {
        return;
      }
      const suggestion: SuggestionVerbe = {
        infinitif: action.infinitif,
        action,
        commande: VerbesElementsUtils.construireCommande(action, element),
        attendCeci: false,
        attendCela: action.cela,
        prepositionCeci: undefined,
        prepositionCela: action.cela ? (action.prepositionCela ?? undefined) : undefined,
        probablementRefusee: VerbesElementsUtils.prerequisRefuseraient(action, element, cond),
      };
      const variante = action.infinitif + VerbesElementsUtils.cleVariantePrepositionCela(action);
      if (!parVariante.has(variante)) {
        parVariante.set(variante, suggestion);
      }
    });

    // verbes courants d’abord, puis ordre alphabétique, variante simple avant variante à 2 compléments
    // (et les actions que les prérequis refuseraient en fin de liste)
    const suggestions = Array.from(parVariante.values());
    suggestions.sort((a, b) => {
      const refusee = (a.probablementRefusee ? 1 : 0) - (b.probablementRefusee ? 1 : 0);
      if (refusee !== 0) {
        return refusee;
      }
      const rangA = VerbesElementsUtils.rangVerbe(a.infinitif);
      const rangB = VerbesElementsUtils.rangVerbe(b.infinitif);
      if (rangA !== rangB) {
        return rangA - rangB;
      }
      const alpha = a.infinitif.localeCompare(b.infinitif, 'fr');
      if (alpha !== 0) {
        return alpha;
      }
      return (a.attendCela ? 1 : 0) - (b.attendCela ? 1 : 0);
    });

    return suggestions;
  }

  /**
   * Lister toutes les actions actuellement lançables, pour le constructeur de
   * commande global (sans partir d’un élément précis) : les actions sans
   * complément (« attendre », « regarder », …) s’exécutent directement, les
   * actions avec complément(s) sont proposées si au moins un candidat visible
   * existe pour ceci.
   */
  public static listerVerbesGlobaux(jeu: Jeu, eju: ElementsJeuUtils): SuggestionVerbe[] {
    const parVariante = new Map<string, SuggestionVerbe>();

    jeu.actions.forEach(action => {
      let suggestion: SuggestionVerbe;
      let variante: string;
      // action sans complément : commande complète
      if (!action.ceci) {
        suggestion = {
          infinitif: action.infinitif,
          action,
          commande: action.infinitif,
          attendCeci: false,
          attendCela: false,
          prepositionCeci: undefined,
          prepositionCela: undefined,
          probablementRefusee: false,
        };
        variante = action.infinitif;
        // action avec complément(s) : proposée seulement si un candidat existe pour ceci
      } else {
        if (!action.cibleCeci || !VerbesElementsUtils.listerCandidatsCible(action.cibleCeci, jeu, eju).length) {
          return;
        }
        suggestion = {
          infinitif: action.infinitif,
          action,
          commande: action.infinitif,
          attendCeci: true,
          attendCela: action.cela,
          prepositionCeci: action.prepositionCeci ?? undefined,
          prepositionCela: action.cela ? (action.prepositionCela ?? undefined) : undefined,
          probablementRefusee: false,
        };
        variante = action.infinitif + '|ceci' + VerbesElementsUtils.cleVariantePrepositionCela(action);
      }
      if (!parVariante.has(variante)) {
        parVariante.set(variante, suggestion);
      }
    });

    const suggestions = Array.from(parVariante.values());
    suggestions.sort((a, b) => {
      const rangA = VerbesElementsUtils.rangVerbe(a.infinitif);
      const rangB = VerbesElementsUtils.rangVerbe(b.infinitif);
      if (rangA !== rangB) {
        return rangA - rangB;
      }
      const alpha = a.infinitif.localeCompare(b.infinitif, 'fr');
      if (alpha !== 0) {
        return alpha;
      }
      return (a.attendCela ? 1 : 0) - (b.attendCela ? 1 : 0);
    });

    return suggestions;
  }

  /**
   * Lister les éléments visibles pouvant servir de second complément (cela)
   * à l’action spécifiée.
   */
  public static listerCandidatsCela(action: Action, ceci: ElementJeu, jeu: Jeu, eju: ElementsJeuUtils): ElementJeu[] {
    if (!action.cela || !action.cibleCela) {
      return [];
    }
    return VerbesElementsUtils.listerCandidatsCible(action.cibleCela, jeu, eju, ceci ? [ceci.id] : []);
  }

  /**
   * Lister les éléments visibles correspondant à la cible (ceci ou cela) d’une action.
   */
  public static listerCandidatsCible(cible: CibleAction, jeu: Jeu, eju: ElementsJeuUtils, exclureIds: number[] = []): ElementJeu[] {
    return jeu.objets.filter(obj =>
      !exclureIds.includes(obj.id)
      && obj.id !== jeu.joueur.id
      && obj.intitule?.nom
      && jeu.etats.estVisible(obj, eju)
      && VerbesElementsUtils.cibleCorrespond(obj, cible, jeu, eju)
    );
  }

  /** Prépositions spatiales interchangeables au niveau de la commande (« mettre ceci sur/dans/sous cela »). */
  public static readonly PREPOSITIONS_SPATIALES = ['dans', 'sur', 'sous'];

  /**
   * Construire la commande correspondant à l’action appliquée à ceci (et cela).
   * @param prepositionCela préposition choisie pour cela (sinon : préposition par défaut).
   */
  public static construireCommande(action: Action, ceci: ElementJeu, cela?: ElementJeu, prepositionCela?: string): string {
    let commande = action.infinitif;
    if (action.ceci) {
      commande += ' ' + (action.prepositionCeci ? (action.prepositionCeci + ' ') : '') + VerbesElementsUtils.intituleCommande(ceci);
    }
    if (action.cela && cela) {
      const preposition = prepositionCela ?? VerbesElementsUtils.prepositionCelaParDefaut(action, cela);
      commande += ' ' + (preposition ? (preposition + ' ') : '') + VerbesElementsUtils.intituleCommande(cela);
    }
    return VerbesElementsUtils.contracter(commande);
  }

  /**
   * Préposition de cela la plus naturelle pour l’élément choisi : le moteur ne
   * tient pas compte de la préposition pour retrouver l’action (« mettre ceci
   * sur/dans/sous cela »), on peut donc adapter la commande générée — « sur »
   * pour un support, « dans » pour un contenant.
   */
  public static prepositionCelaParDefaut(action: Action, cela: ElementJeu): string | undefined {
    const declaree = action.prepositionCela ?? undefined;
    if (declaree && VerbesElementsUtils.PREPOSITIONS_SPATIALES.includes(declaree)) {
      if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.support)) {
        return 'sur';
      }
      if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.contenant)) {
        return 'dans';
      }
    }
    return declaree;
  }

  /**
   * Prépositions proposées au joueur pour ajuster la commande (aperçu) :
   * les 3 prépositions spatiales si la préposition déclarée est spatiale, sinon aucune.
   */
  public static prepositionsCelaPossibles(action: Action): string[] {
    const declaree = action.prepositionCela ?? undefined;
    return (declaree && VerbesElementsUtils.PREPOSITIONS_SPATIALES.includes(declaree))
      ? VerbesElementsUtils.PREPOSITIONS_SPATIALES
      : [];
  }

  /**
   * Évaluer « à blanc » les instructions « si …, refuser … » de la phase
   * prérequis de l’action pour l’élément choisi : si une condition de refus
   * est déjà vérifiée, l’action est sans intérêt pour cet élément (ex. parler
   * avec une table) et sera reléguée en fin de menu.
   *
   * Seules les conditions sûres sont évaluées : celles qui ne référencent ni
   * « cela » (pas encore choisi), ni l’horloge (la lecture polluerait le
   * déterminisme du replay). Le générateur aléatoire est restauré après
   * l’évaluation (conditions « au hasard »).
   */
  private static prerequisRefuseraient(action: Action, ceci: ElementJeu, cond: ConditionsUtils): boolean {
    if (!action.phasePrerequis?.length) {
      return false;
    }
    const tour = new ContexteTour(ceci, undefined);
    const instantane = AleatoireUtils.instantane();
    let refus = false;
    try {
      action.phasePrerequis.forEach(instruction => {
        if (!refus && VerbesElementsUtils.estRefusConditionnel(instruction)) {
          const texteCondition = instruction.condition.toString().toLowerCase();
          // condition pas évaluable de façon sûre → ignorer
          if (/\bcela\b|\bheure\b|\bminute\b|\bseconde\b/.test(texteCondition)) {
            return;
          }
          if (cond.siEstVrai(undefined, instruction.condition, tour, undefined, undefined)) {
            refus = true;
          }
        }
      });
    } catch (error) {
      // condition pas évaluable hors d’un vrai tour de jeu → ne pas pénaliser l’action
      refus = false;
    } finally {
      if (instantane) {
        AleatoireUtils.restaurer(instantane);
      }
    }
    return refus;
  }

  /** L’instruction est-elle un refus conditionnel (« si …, refuser … ») ? */
  private static estRefusConditionnel(instruction: Instruction): boolean {
    return !!instruction.condition
      && !!instruction.instructionsSiConditionVerifiee?.length
      && !instruction.instructionsSiConditionPasVerifiee?.length
      && instruction.instructionsSiConditionVerifiee.every(x => x.instruction?.infinitif?.toLowerCase() === 'refuser');
  }

  /**
   * Clé de variante pour la déduplication des suggestions : les prépositions
   * spatiales sont regroupées (« ranger dans » et « ranger sur » → un seul bouton).
   */
  private static cleVariantePrepositionCela(action: Action): string {
    if (!action.cela) {
      return '';
    }
    const preposition = action.prepositionCela ?? '';
    return '|' + (VerbesElementsUtils.PREPOSITIONS_SPATIALES.includes(preposition) ? '@spatiale' : preposition);
  }

  /** Préposition de cela affichée sur le bouton du verbe (« sur/dans/sous » si spatiale). */
  public static affichagePrepositionCela(suggestion: SuggestionVerbe): string | undefined {
    const preposition = suggestion.prepositionCela;
    return (preposition && VerbesElementsUtils.PREPOSITIONS_SPATIALES.includes(preposition))
      ? VerbesElementsUtils.PREPOSITIONS_SPATIALES.join('/')
      : preposition;
  }

  /** Intitulé d’un élément tel qu’utilisé dans une commande (déterminant + nom + épithète). */
  public static intituleCommande(element: ElementJeu): string {
    const determinant = element.intitule.determinant ?? '';
    const epithete = element.intitule.epithete ? (' ' + element.intitule.epithete) : '';
    return determinant + element.intitule.nom + epithete;
  }

  /** Contracter les prépositions (« à le » → « au », « de les » → « des », …). */
  private static contracter(commande: string): string {
    // (espace explicite : \b ne fonctionne pas avec les caractères accentués)
    return commande
      .replace(/ à le /g, ' au ')
      .replace(/ à les /g, ' aux ')
      .replace(/ de le /g, ' du ')
      .replace(/ de les /g, ' des ');
  }

  /** Vérifier si l’élément correspond à la cible (ceci ou cela) de l’action. */
  private static cibleCorrespond(element: ElementJeu, cible: CibleAction, jeu: Jeu, eju: ElementsJeuUtils): boolean {
    // A. la cible est une classe (« un objet », « une personne », …)
    if (cible.determinant?.match(/^(un|une|des|deux|1|2)( )?$/)) {
      const nomClasse = ClasseUtils.getIntituleNormalise(cible.nom);
      // les cibles trop génériques (intitulé, direction) ne désignent pas un objet précis
      if (nomClasse === EClasseRacine.intitule || nomClasse === EClasseRacine.direction) {
        return false;
      }
      if (!ClasseUtils.heriteDe(element.classe, nomClasse)) {
        return false;
      }
      return VerbesElementsUtils.controlerEtats(element, cible.epithete, jeu, eju);
      // B. la cible est un sujet précis
    } else {
      return element.intitule.nom === cible.nom && element.intitule.epithete === cible.epithete;
    }
  }

  /**
   * Contrôler si l’élément possède les états spécifiés (liste « et » / « ou »).
   * Une liste vide est toujours vérifiée.
   */
  private static controlerEtats(element: ElementJeu, listeEtats: string | null, jeu: Jeu, eju: ElementsJeuUtils): boolean {
    if (!listeEtats) {
      return true;
    }
    const estListeEt = /\bet\b/.test(listeEtats);
    const etats = PhraseUtils.separerListeIntitulesEtOu(listeEtats, true);
    let unEtatVerifie = false;
    let unEtatPasVerifie = false;
    etats.forEach(etat => {
      if (jeu.etats.possedeEtatElement(element, etat, eju)) {
        unEtatVerifie = true;
      } else {
        unEtatPasVerifie = true;
      }
    });
    return estListeEt ? !unEtatPasVerifie : unEtatVerifie;
  }

  /** Rang d’un verbe dans la liste des verbes courants (Infinity si pas courant). */
  private static rangVerbe(infinitif: string): number {
    const index = VerbesElementsUtils.VERBES_COURANTS.indexOf(infinitif);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

}
