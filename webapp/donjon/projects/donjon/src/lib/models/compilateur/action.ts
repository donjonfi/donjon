import { CibleAction } from './cible-action';
import { ElementJeu } from '../jeu/element-jeu';
import { Instruction } from './instruction';
import { Intitule } from '../jeu/intitule';
import { StringUtils } from '../../utils/commun/string.utils';
import { Verification } from './verification';

export class Action {

  constructor(
    infinitif: string,
    prepositionCeci: string,
    public ceci: boolean,
    prepositionCela: string,
    public cela: boolean,
  ) {
    this.infinitif = infinitif;
    // La préposition de l’en-tête initialise la liste des prépositions « probables » du
    // complément. prepositionCeci/Cela (getters) renvoient la 1re de cette liste : forme de
    // base servant à l’affichage (la contraction au/aux/du/des est faite à l’affichage).
    this.prepositionsCeciProbables = prepositionCeci ? [prepositionCeci.toLowerCase()] : [];
    this.prepositionsCelaProbables = prepositionCela ? [prepositionCela.toLowerCase()] : [];
  }

  /** Forme de base de la préposition de ceci (1re des « probables ») — affichage/reconstruction. */
  public get prepositionCeci(): string { return this.prepositionsCeciProbables[0]; }
  /** Forme de base de la préposition de cela (1re des « probables ») — affichage/reconstruction. */
  public get prepositionCela(): string { return this.prepositionsCelaProbables[0]; }

  private _infinitif: string;
  private _infinitifSansAccent: string;
  public cibleCeci: CibleAction = null;
  public cibleCela: CibleAction = null;

  /**
   * Prépositions acceptées pour ceci/cela, par niveau de confiance lors du découpage
   * d’une commande du joueur :
   * - « probables » : séparateurs attendus (induits par l’en-tête ou déclarés par
   *   « prépositions ceci probables: … ») — mieux notés ;
   * - « possibles » : séparateurs également acceptés mais moins sûrs (ex. ambigus avec
   *   un mot composé) — notés un peu moins, mais mieux qu’un séparateur imprévu.
   * Les valeurs sont stockées en minuscules (comparaison insensible à la casse). La 1re
   * « probable » est la forme de base affichée (cf. getters prepositionCeci/Cela).
   */
  public prepositionsCeciProbables: string[] = [];
  public prepositionsCelaProbables: string[] = [];
  public prepositionsCeciPossibles: string[] = [];
  public prepositionsCelaPossibles: string[] = [];

  /** Bonus de score pour une préposition « probable » employée par le joueur. */
  public static readonly BONUS_PREPOSITION_PROBABLE = 10;
  /** Bonus de score pour une préposition « possible » employée par le joueur. */
  public static readonly BONUS_PREPOSITION_POSSIBLE = 5;

  /** Palier de correspondance (bonus de score) d’une préposition employée pour ceci. */
  public bonusPrepositionCeci(preposition: string | undefined): number {
    return Action.bonusPreposition(this.prepositionsCeciProbables, this.prepositionsCeciPossibles, preposition);
  }

  /** Palier de correspondance (bonus de score) d’une préposition employée pour cela. */
  public bonusPrepositionCela(preposition: string | undefined): number {
    return Action.bonusPreposition(this.prepositionsCelaProbables, this.prepositionsCelaPossibles, preposition);
  }

  /**
   * Normalise une préposition vers sa forme de base pour la comparaison : les variantes
   * contractées en genre/nombre sont ramenées à leur préposition simple
   * (au/aux → à ; du/des/d’ → de ; idem « à propos … »). Ainsi déclarer la seule forme
   * de base (« à », « de ») suffit pour reconnaître « au »/« aux »/« du »/« des » tapées
   * par le joueur — inutile de lister les contractions.
   */
  public static normaliserPreposition(preposition: string): string {
    const p = preposition.toLowerCase().trim();
    switch (p) {
      case 'au': case 'aux': return 'à';
      case 'du': case 'des': case "d'": case 'd’': return 'de';
      case 'à propos du': case 'à propos des': case "à propos d'": case 'à propos d’': return 'à propos de';
      default: return p;
    }
  }

  /**
   * Bonus de score d’une préposition employée par le joueur selon qu’elle est
   * « probable » (meilleur score), « possible » (score intermédiaire) ou imprévue
   * (aucun bonus). Comparaison insensible à la casse et aux contractions de genre/nombre
   * (cf. normaliserPreposition). « Aucune préposition » attendue (liste probables vide)
   * ET aucune employée valent « probable ».
   */
  private static bonusPreposition(probables: string[], possibles: string[], employee: string | undefined): number {
    const employeeNorm = employee ? Action.normaliserPreposition(employee) : undefined;
    if (employeeNorm === undefined) {
      return probables.length === 0 ? Action.BONUS_PREPOSITION_PROBABLE : 0;
    }
    if (probables.some(p => Action.normaliserPreposition(p) === employeeNorm)) {
      return Action.BONUS_PREPOSITION_PROBABLE;
    }
    if (possibles.some(p => Action.normaliserPreposition(p) === employeeNorm)) {
      return Action.BONUS_PREPOSITION_POSSIBLE;
    }
    return 0;
  }

  public verificationsBeta: Verification[] = [];

  /** instructions phase « prérequis » */
  public phasePrerequis: Instruction[] = [];
  /** instructions phase « exécution » */
  public phaseExecution: Instruction[] = [];
  /** instructinos phase « épilogue » */
  public phaseEpilogue: Instruction[] = []
  private _synonymes: string[] = [];
  private _synonymesSansAccent: string[] = [];

  /** Les actions simplifiees (le joueur peut xxx) ne peuvent pas être modifiées ensuite */
  public simplifiee: boolean = false;

  /** Cette action remplace une action déjà existante avec la même signature (via « règle remplacer »). */
  public remplace: boolean = false;

  /** Si cette action en a remplacé une autre (« règle remplacer »), référence à l’action originale écrasée
   *  — utilisée par l’aperçu pour afficher côte à côte remplaçante et remplacée. */
  public actionRemplacee: Action | undefined;

  /** Cette action va déplacer le joueur vers destinationDeplacement */
  public destinationDeplacement: string | undefined;

  public set infinitif(infinitif: string) {
    this._infinitif = infinitif;
    this._infinitifSansAccent = StringUtils.normaliserMot(infinitif);
  }

  /** L’infinitif de l’action avec les caractères spéciaux éventuels */
  public get infinitif(): string {
    return this._infinitif;
  }

  /** L’infinitif de l’action sans les caractères spéciaux éventuels */
  public get infinitifSansAccent(): string {
    return this._infinitifSansAccent;
  }

  /** Ajouter un synonyme à l’action */
  public ajouterSynonyme(synonyme: string) {
    this._synonymes.push(synonyme);
    this._synonymesSansAccent.push(StringUtils.normaliserMot(synonyme));
  }

  /** Récupérer la liste des synonymes de l’action */
  public get synonymes(): ReadonlyArray<string> {
    return this._synonymes as ReadonlyArray<string>;
  }

  /** Récupérer la liste des synonymes de l’actions sans les caractères spéciaux */
  public get synonymesSansAccent(): ReadonlyArray<string> {
    return this._synonymesSansAccent as ReadonlyArray<string>;
  }

}

export class ActionCeciCela {

  constructor(
    public action: Action,
    public ceci: ElementJeu | Intitule,
    public cela: ElementJeu | Intitule
  ) { }
}

export class CandidatActionCeciCela {

  constructor(
    public action: Action,
    public ceci: Array<ElementJeu | Intitule>,
    public cela: Array<ElementJeu | Intitule>,
  ) { }
}
