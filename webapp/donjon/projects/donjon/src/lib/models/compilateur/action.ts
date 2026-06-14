import { CibleAction } from './cible-action';
import { ElementJeu } from '../jeu/element-jeu';
import { Instruction } from './instruction';
import { Intitule } from '../jeu/intitule';
import { StringUtils } from '../../utils/commun/string.utils';
import { Verification } from './verification';

export class Action {

  constructor(
    infinitif: string,
    public prepositionCeci: string,
    public ceci: boolean,
    public prepositionCela: string,
    public cela: boolean,
  ) {
    this.infinitif = infinitif;
  }

  private _infinitif: string;
  private _infinitifSansAccent: string;
  public cibleCeci: CibleAction = null;
  public cibleCela: CibleAction = null;

  /**
   * Prépositions secondaires acceptées pour ceci/cela, en plus de la préposition
   * principale (induite par l’en-tête ou redéfinie par « préposition ceci principale: … »).
   * Une découpe de commande employant une préposition principale est mieux notée
   * qu’une secondaire, elle-même mieux notée qu’une préposition non prévue.
   */
  public prepositionsCeciSecondaires: string[] = [];
  public prepositionsCelaSecondaires: string[] = [];

  /** Bonus de score pour une préposition principale employée par le joueur. */
  public static readonly BONUS_PREPOSITION_PRINCIPALE = 10;
  /** Bonus de score pour une préposition secondaire employée par le joueur. */
  public static readonly BONUS_PREPOSITION_SECONDAIRE = 5;

  /** Palier de correspondance (bonus de score) d’une préposition employée pour ceci. */
  public bonusPrepositionCeci(preposition: string | undefined): number {
    return Action.bonusPreposition(this.prepositionCeci, this.prepositionsCeciSecondaires, preposition);
  }

  /** Palier de correspondance (bonus de score) d’une préposition employée pour cela. */
  public bonusPrepositionCela(preposition: string | undefined): number {
    return Action.bonusPreposition(this.prepositionCela, this.prepositionsCelaSecondaires, preposition);
  }

  /**
   * Bonus de score d’une préposition employée par le joueur, selon qu’elle est la
   * préposition principale (meilleur score), une préposition secondaire (score
   * intermédiaire) ou une préposition non prévue (aucun bonus). La comparaison est
   * insensible à la casse ; « pas de préposition » des deux côtés vaut principale.
   */
  private static bonusPreposition(principale: string | undefined, secondaires: string[], employee: string | undefined): number {
    const employeeNorm = employee ? employee.toLowerCase() : undefined;
    const principaleNorm = principale ? principale.toLowerCase() : undefined;
    if (employeeNorm === principaleNorm) {
      return Action.BONUS_PREPOSITION_PRINCIPALE;
    }
    if (employeeNorm && secondaires.includes(employeeNorm)) {
      return Action.BONUS_PREPOSITION_SECONDAIRE;
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
