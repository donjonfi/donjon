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
