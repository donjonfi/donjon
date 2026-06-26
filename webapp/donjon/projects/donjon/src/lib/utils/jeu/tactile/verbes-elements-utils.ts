import { Action } from '../../../models/compilateur/action';
import { ActionsTactilesUtils } from './actions-tactiles-utils';
import { AleatoireUtils } from '../aleatoire-utils';
import { CibleAction } from '../../../models/compilateur/cible-action';
import { ClasseUtils } from '../../commun/classe-utils';
import { ConditionsUtils } from '../conditions-utils';
import { ContexteTour } from '../../../models/jouer/contexte-tour';
import { EClasseRacine } from '../../../models/commun/constantes';
import { ELocalisation, Localisation } from '../../../models/jeu/localisation';

import { ElementJeu } from '../../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../../commun/elements-jeu-utils';
import { Instruction } from '../../../models/compilateur/instruction';
import { Jeu } from '../../../models/jeu/jeu';
import { PhraseUtils } from '../../commun/phrase-utils';
import { RechercheUtils } from '../../commun/recherche-utils';
import { TypeRegle } from '../../../models/compilateur/type-regle';

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
  /** Le premier complément est-il un texte libre (cible « un intitulé ») plutôt qu’un élément ? */
  ceciLibre?: boolean;
  /** Le premier complément est-il une direction (cible « une direction ») plutôt qu’un élément ? */
  ceciDirection?: boolean;
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
 * Verbes applicables à un élément, regroupés par infinitif pour le menu
 * tactile : un bouton par infinitif (tap = variante la plus simple), un
 * appui long ouvre les variantes avec compléments.
 */
export interface GroupeVerbe {
  /** Infinitif de l’action. */
  infinitif: string;
  /** Niveau d’affichage : principale (niveau 1), secondaire (niveau 2), autre (niveau 3). */
  niveau: 'principale' | 'secondaire' | 'autre';
  /** Variante la plus simple (sans second complément de préférence), exécutée au tap. */
  simple: SuggestionVerbe;
  /** Autres variantes (avec compléments, prépositions, …), proposées via un appui long. */
  variantes: SuggestionVerbe[];
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
      // une action masquée n'est jamais proposée (mask prime sur courantes/complémentaires :
      // absente des suggestions, elle n'obtient aucun niveau dans listerGroupesVerbes)
      if (action.masquee) {
        return;
      }
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
   * Lister les actions applicables à l’élément, regroupées par infinitif et
   * réparties en niveaux d’affichage (principales / secondaires / autres)
   * selon les règles d’actions tactiles du jeu (défauts du moteur, déclarations
   * de l’auteur, instructions exécutées en cours de partie).
   *
   * Tri : principales d’abord (dans l’ordre déclaré par l’auteur), puis
   * secondaires (idem), puis les autres dans l’ordre de listerVerbes ; au sein
   * des principales/secondaires, les actions que les prérequis refuseraient
   * sont reléguées en fin de niveau.
   */
  public static listerGroupesVerbes(element: ElementJeu, jeu: Jeu, eju: ElementsJeuUtils): GroupeVerbe[] {
    const suggestions = VerbesElementsUtils.listerVerbes(element, jeu, eju);
    const { principales, secondaires } = ActionsTactilesUtils.resoudreToutes(element, jeu, eju);
    // verbes ciblés par une règle avant/après/remplacer de cet élément précis
    const verbesRegle = VerbesElementsUtils.verbesAvecRegleCiblee(element, jeu);

    // regrouper les variantes par infinitif (ordre de première apparition conservé)
    const parInfinitif = new Map<string, SuggestionVerbe[]>();
    suggestions.forEach(suggestion => {
      if (!parInfinitif.has(suggestion.infinitif)) {
        parInfinitif.set(suggestion.infinitif, []);
      }
      parInfinitif.get(suggestion.infinitif).push(suggestion);
    });

    const groupes: GroupeVerbe[] = [];
    parInfinitif.forEach((variantes, infinitif) => {
      const simple = variantes.find(v => !v.attendCela) ?? variantes[0];
      let niveau: 'principale' | 'secondaire' | 'autre';
      if (principales.includes(infinitif)) {
        niveau = 'principale';
        // une action ou une règle avant/après définie pour cet élément précis
        // (« ceci est le fauteuil », « règle avant pousser le fauteuil ») est
        // proposée d’office en secondaire si l’auteur ne l’a pas classée lui-même
      } else if (secondaires.includes(infinitif) || verbesRegle.has(infinitif) || variantes.some(v => !VerbesElementsUtils.cibleEstClasse(v.action.cibleCeci))) {
        niveau = 'secondaire';
      } else {
        niveau = 'autre';
      }
      groupes.push({ infinitif, niveau, simple, variantes: variantes.filter(v => v !== simple) });
    });

    const rangNiveau = { principale: 0, secondaire: 1, autre: 2 };
    // les secondaires promues automatiquement (pas déclarées) après les déclarées
    const rangDeclare = (groupe: GroupeVerbe) => {
      const index = groupe.niveau === 'principale'
        ? principales.indexOf(groupe.infinitif)
        : secondaires.indexOf(groupe.infinitif);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    // tri stable : les groupes « autre » conservent l’ordre de listerVerbes
    groupes.sort((a, b) => {
      const niveau = rangNiveau[a.niveau] - rangNiveau[b.niveau];
      if (niveau !== 0) {
        return niveau;
      }
      if (a.niveau === 'autre') {
        return 0;
      }
      const refusee = (a.simple.probablementRefusee ? 1 : 0) - (b.simple.probablementRefusee ? 1 : 0);
      if (refusee !== 0) {
        return refusee;
      }
      return rangDeclare(a) - rangDeclare(b);
    });

    return groupes;
  }

  /**
   * Infinitifs des verbes ciblés par une règle avant/après/remplacer visant cet
   * élément précis (« règle avant pousser le fauteuil ») : tout comme une action
   * définie pour cet élément précis, ces verbes sont promus dans le menu tactile
   * (l’auteur a manifesté son intérêt pour ce verbe sur cet objet).
   *
   * Seules les règles à sujet défini (« le fauteuil ») sont retenues — pas
   * celles ciblant une classe (« un objet »), pour rester cohérent avec la
   * promotion des actions à sujet précis. La condition de correspondance est la
   * même que celle du déclencheur (intitulé exact), donc une règle sur « le
   * fauteuil » ne promeut pas « le fauteuil rouge ».
   */
  public static verbesAvecRegleCiblee(element: ElementJeu, jeu: Jeu): Set<string> {
    const infinitifs = new Set<string>();
    const cible = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(element.intitule.nomEpithete).trim();
    (jeu.auditeurs ?? []).forEach(auditeur => {
      if (auditeur.type !== TypeRegle.avant && auditeur.type !== TypeRegle.apres && auditeur.type !== TypeRegle.remplacer) {
        return;
      }
      auditeur.evenements?.forEach(evenement => {
        if (evenement.infinitif && evenement.isCeci && !evenement.classeCeci && evenement.ceci === cible) {
          infinitifs.add(evenement.infinitif.toLowerCase());
        }
      });
    });
    return infinitifs;
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
      // une action masquée n'est jamais proposée par le constructeur de commande global
      if (action.masquee) {
        return;
      }
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
        // (texte libre — « un intitulé » — et directions sont aussi pris en charge)
      } else {
        if (!action.cibleCeci) {
          return;
        }
        const ceciLibre = VerbesElementsUtils.cibleEstIntitule(action.cibleCeci);
        const ceciDirection = !ceciLibre && VerbesElementsUtils.cibleEstDirection(action.cibleCeci);
        if (ceciLibre || ceciDirection) {
          // texte libre / direction + second complément : pas pris en charge par le constructeur
          if (action.cela) {
            return;
          }
          if (ceciDirection && !VerbesElementsUtils.listerSortiesVisibles(jeu, eju).length) {
            return;
          }
        } else if (!VerbesElementsUtils.listerCandidatsCible(action.cibleCeci, jeu, eju).length) {
          return;
        }
        suggestion = {
          infinitif: action.infinitif,
          action,
          commande: action.infinitif,
          attendCeci: true,
          ceciLibre,
          ceciDirection,
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
   * Variantes du constructeur global regroupées par infinitif (un bouton par
   * infinitif), triées par ordre alphabétique. Pas de niveaux
   * principal/secondaire pour le constructeur global.
   */
  public static listerGroupesVerbesGlobaux(jeu: Jeu, eju: ElementsJeuUtils): GroupeVerbe[] {
    const suggestions = VerbesElementsUtils.listerVerbesGlobaux(jeu, eju);

    // regrouper les variantes par infinitif
    const parInfinitif = new Map<string, SuggestionVerbe[]>();
    suggestions.forEach(suggestion => {
      if (!parInfinitif.has(suggestion.infinitif)) {
        parInfinitif.set(suggestion.infinitif, []);
      }
      parInfinitif.get(suggestion.infinitif).push(suggestion);
    });

    const groupes: GroupeVerbe[] = [];
    parInfinitif.forEach((variantes, infinitif) => {
      // la plus simple : sans complément (exécution directe), sinon sans second complément
      const simple = variantes.find(v => !v.attendCeci)
        ?? variantes.find(v => !v.attendCela)
        ?? variantes[0];
      groupes.push({ infinitif, niveau: 'autre', simple, variantes: variantes.filter(v => v !== simple) });
    });

    groupes.sort((a, b) => a.infinitif.localeCompare(b.infinitif, 'fr'));

    return groupes;
  }

  /**
   * Lister les actions applicables à une sortie (direction), regroupées et
   * réparties en niveaux selon les règles d’actions tactiles (« Les actions
   * principales pour les directions sont aller et regarder. »). Chaque
   * suggestion est une commande complète (la direction est connue).
   */
  public static listerGroupesVerbesDirection(direction: Localisation, jeu: Jeu, eju: ElementsJeuUtils): GroupeVerbe[] {
    const parInfinitif = new Map<string, SuggestionVerbe>();

    // Une direction est « regardable » s’il y a un aperçu à voir (aperçu du lieu de destination).
    //  Sans aperçu, les verbes de simple observation (« regarder », « examiner »…) n’ont rien à
    //  montrer : on ne propose alors que les verbes qui AGISSENT (déplacement). Parallèle à
    //  « texte ⇒ lisible » : « aperçu ⇒ regardable ». Un verbe de déplacement reste toujours proposé.
    const voisinLieuID = eju.getVoisinDirectionID(direction, EClasseRacine.lieu);
    const directionAUnApercu = voisinLieuID !== -1 ? !!eju.getLieu(voisinLieuID)?.apercu : false;
    const verbePertinentPourDirection = (action: Action) => directionAUnApercu || !!action.destinationDeplacement;

    jeu.actions.forEach(action => {
      if (action.masquee || !action.ceci || !action.cibleCeci || action.cela) {
        return;
      }
      if (!VerbesElementsUtils.cibleEstDirection(action.cibleCeci)) {
        return;
      }
      if (!verbePertinentPourDirection(action)) {
        return;
      }
      if (!parInfinitif.has(action.infinitif)) {
        parInfinitif.set(action.infinitif, {
          infinitif: action.infinitif,
          action,
          commande: VerbesElementsUtils.construireCommandeDirection(action, direction),
          attendCeci: false,
          attendCela: false,
          prepositionCeci: undefined,
          prepositionCela: undefined,
          probablementRefusee: false,
        });
      }
    });

    const { principales, secondaires } = ActionsTactilesUtils.resoudreToutesPourClasse(direction.classe, jeu);

    // compléter avec les infinitifs déclarés dans les listes dont l’action
    // cible un intitulé (« regarder ») : elles acceptent aussi une direction
    [...principales, ...secondaires].forEach(infinitif => {
      if (parInfinitif.has(infinitif)) {
        return;
      }
      const action = jeu.actions.find(a => a.ceci && !a.cela && a.cibleCeci && !a.masquee
        && (a.infinitif === infinitif || a.synonymes?.includes(infinitif))
        && VerbesElementsUtils.cibleEstIntitule(a.cibleCeci));
      if (action && verbePertinentPourDirection(action)) {
        parInfinitif.set(infinitif, {
          infinitif,
          action,
          commande: VerbesElementsUtils.construireCommandeDirection(action, direction),
          attendCeci: false,
          attendCela: false,
          prepositionCeci: undefined,
          prepositionCela: undefined,
          probablementRefusee: false,
        });
      }
    });

    const groupes: GroupeVerbe[] = [];
    parInfinitif.forEach((simple, infinitif) => {
      const niveau = principales.includes(infinitif) ? 'principale'
        : (secondaires.includes(infinitif) ? 'secondaire' : 'autre');
      groupes.push({ infinitif, niveau, simple, variantes: [] });
    });

    const rangNiveau = { principale: 0, secondaire: 1, autre: 2 };
    const rangDeclare = (groupe: GroupeVerbe) => {
      const index = groupe.niveau === 'principale'
        ? principales.indexOf(groupe.infinitif)
        : secondaires.indexOf(groupe.infinitif);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    groupes.sort((a, b) => {
      const niveau = rangNiveau[a.niveau] - rangNiveau[b.niveau];
      if (niveau !== 0) {
        return niveau;
      }
      if (a.niveau === 'autre') {
        return a.infinitif.localeCompare(b.infinitif, 'fr');
      }
      return rangDeclare(a) - rangDeclare(b);
    });

    return groupes;
  }

  /** Sorties (directions) actuellement visibles depuis le lieu du joueur. */
  public static listerSortiesVisibles(jeu: Jeu, eju: ElementsJeuUtils): Localisation[] {
    const curLieu = eju.curLieu;
    if (!jeu?.joueur?.position || !curLieu) {
      return [];
    }
    return eju.getLieuxVoisinsVisibles(curLieu)
      .filter(voisin => voisin.localisation !== ELocalisation.inconnu)
      .map(voisin => Localisation.getLocalisation(voisin.localisation));
  }

  /** Construire la commande correspondant à l’action appliquée à une direction. */
  public static construireCommandeDirection(action: Action, direction: Localisation): string {
    let commande = action.infinitif;
    if (action.ceci) {
      // Une direction se désigne naturellement avec « vers » (« regarder vers le nord »). Si
      //  l’action déclare déjà une préposition pour ceci (ex. « aller vers »), on la conserve ;
      //  sinon on insère « vers » par défaut (le moteur l’accepte, cf. « examiner vers le nord »).
      const preposition = action.prepositionCeci || 'vers';
      commande += ' ' + preposition + ' ' + direction.intitule.determinant + direction.intitule.nom;
    }
    return VerbesElementsUtils.contracter(commande);
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
   * Lister les éléments visibles correspondant à la cible (ceci ou cela) d’une
   * action, les plus pertinents d’abord : les derniers éléments mentionnés ou
   * manipulés (ordre de récence), puis ceux présents dans le lieu ou dans
   * l’inventaire, puis les autres.
   */
  public static listerCandidatsCible(cible: CibleAction, jeu: Jeu, eju: ElementsJeuUtils, exclureIds: number[] = []): ElementJeu[] {
    // anti-spoiler : si l’action cible un sujet précis (« coincer la rame »),
    // on propose tous les objets de la classe de ce sujet plutôt que le seul
    // objet attendu — sinon le joueur devine que ce verbe va avec cet objet.
    const classeElargie = VerbesElementsUtils.classeDuSujetPrecis(cible, jeu);
    const candidats = jeu.objets.filter(obj =>
      !exclureIds.includes(obj.id)
      && obj.id !== jeu.joueur.id
      && obj.intitule?.nom
      && jeu.etats.estVisible(obj, eju)
      && (classeElargie
        ? ClasseUtils.heriteDe(obj.classe, classeElargie)
        : VerbesElementsUtils.cibleCorrespond(obj, cible, jeu, eju))
    );
    return VerbesElementsUtils.trierCandidats(candidats, jeu, eju);
  }

  /**
   * Classe à proposer pour une cible « sujet précis » (« la rame ») : la classe
   * de ce sujet, afin de proposer tous les objets de cette classe plutôt que
   * dévoiler l’unique objet attendu (anti-spoiler du constructeur global).
   * `null` si la cible est déjà une classe ou si le sujet est introuvable
   * (on retombe alors sur la correspondance exacte).
   */
  private static classeDuSujetPrecis(cible: CibleAction, jeu: Jeu): string | null {
    if (VerbesElementsUtils.cibleEstClasse(cible)) {
      return null;
    }
    const sujet = jeu.objets.find(o =>
      o.intitule?.nom === cible.nom && (o.intitule.epithete ?? null) === (cible.epithete ?? null));
    return sujet?.classe?.nom ?? null;
  }

  /**
   * Trier les candidats d’un complément : derniers mentionnés/manipulés
   * d’abord (plus récent en premier), puis présents ou possédés, puis les
   * autres (tri stable : ordre de déclaration conservé à rang égal).
   */
  private static trierCandidats(candidats: ElementJeu[], jeu: Jeu, eju: ElementsJeuUtils): ElementJeu[] {
    const derniers = jeu.derniersElementIds ?? [];
    const rangs = new Map<number, { recence: number, aPortee: number }>();
    candidats.forEach(candidat => {
      const recence = derniers.indexOf(candidat.id);
      const aPortee = (jeu.etats.possedeEtatIdElement(candidat, jeu.etats.presentID, eju)
        || jeu.etats.possedeEtatIdElement(candidat, jeu.etats.possedeID, eju)) ? 0 : 1;
      rangs.set(candidat.id, { recence: recence === -1 ? Number.MAX_SAFE_INTEGER : recence, aPortee });
    });
    return [...candidats].sort((a, b) => {
      const rangA = rangs.get(a.id);
      const rangB = rangs.get(b.id);
      return (rangA.recence - rangB.recence) || (rangA.aPortee - rangB.aPortee);
    });
  }

  /** Prépositions spatiales interchangeables au niveau de la commande (« mettre ceci sur/dans/sous cela »). */
  public static readonly PREPOSITIONS_SPATIALES = ['dans', 'sur', 'sous'];

  /** Adverbe pronominal correspondant à une préposition spatiale du premier complément (« sur » → « dessus », …). */
  public static readonly ADVERBES_PREPOSITION_CECI: { [preposition: string]: string } = {
    'sur': 'dessus',
    'sous': 'dessous',
    'dans': 'dedans',
  };

  /**
   * Adverbe pronominal de la préposition spatiale du premier complément, pour le
   * libellé court d’un bouton tactile : « monter sur ceci » → « monter dessus »
   * (plutôt que le pronom complément d’objet direct « le monter », incorrect car
   * ceci n’est pas un complément direct). `undefined` si l’action n’attend pas
   * son premier complément derrière une préposition spatiale.
   */
  public static adverbePrepositionCeci(suggestion: SuggestionVerbe): string | undefined {
    const preposition = suggestion?.action?.prepositionCeci ?? undefined;
    return preposition ? VerbesElementsUtils.ADVERBES_PREPOSITION_CECI[preposition] : undefined;
  }

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

  /** La cible désigne-t-elle une classe (« un objet ») plutôt qu’un sujet précis (« le fauteuil ») ? */
  private static cibleEstClasse(cible: CibleAction): boolean {
    return !!cible.determinant?.match(/^(un|une|des|deux|1|2)( )?$/);
  }

  /** La cible est-elle un texte libre (« un intitulé »), ex. « taper {code} » ? */
  public static cibleEstIntitule(cible: CibleAction): boolean {
    return VerbesElementsUtils.cibleEstClasse(cible)
      && ClasseUtils.getIntituleNormalise(cible.nom) === EClasseRacine.intitule;
  }

  /** La cible est-elle une direction (« une direction »), ex. « aller vers {direction} » ? */
  public static cibleEstDirection(cible: CibleAction): boolean {
    return VerbesElementsUtils.cibleEstClasse(cible)
      && ClasseUtils.getIntituleNormalise(cible.nom) === EClasseRacine.direction;
  }

  /** Vérifier si l’élément correspond à la cible (ceci ou cela) de l’action. */
  private static cibleCorrespond(element: ElementJeu, cible: CibleAction, jeu: Jeu, eju: ElementsJeuUtils): boolean {
    // A. la cible est une classe (« un objet », « une personne », …)
    if (VerbesElementsUtils.cibleEstClasse(cible)) {
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
