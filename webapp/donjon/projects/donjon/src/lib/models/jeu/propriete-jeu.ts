import { PositionObjet, PrepositionSpatiale } from "./position-objet";

import { Classe } from "../commun/classe";
import { ElementJeu } from "./element-jeu";
import { Etat } from "../commun/etat";
import { GroupeNominal } from "../commun/groupe-nominal";
import { ProprieteElement } from "../commun/propriete-element";

export enum TypeProprieteJeu {
  inconnu = '?',
  proprieteElement = 'p',
  nombreDeProprieteElement = 'nbp',
  nombreDeClasseAttributs = 'nbc',
  nombreDeClasseAttributsPosition = 'nbcp',
}


export class ProprieteJeu {

  constructor(
    /** Type de propriete du jeu */
    public type: TypeProprieteJeu,
  ) { }

  // A. PROPRIÉTÉ (de l’élément cible)
  /** Intitulé de la propriété de l’élément cible */
  public intituleProprieteElement: GroupeNominal = null;

  /** Propriete de l’élément cible */
  public proprieteElement: ProprieteElement = null;

  // B. CLASSE CIBLE (éventuellement positionnée par rapport à l’élément cible)

  /** Intitulé de la classe cible. */
  public intituleClasse: string = null;

  /** Classe cible */
  public classe: Classe = null;

  /** Nom des états de la classe cible. */
  public nomsEtats: string[] = null;

  /** États de la classe cible */
  public etats: Etat[] = null;

  // C. ÉLÉMENT CIBLE

  /** Intitulé de l’élément cible */
  public intituleElement: GroupeNominal = null;

  /** Élément cible */
  public element: ElementJeu = null;

  // D. POSITION (relative à l’élément cible)

  /** Nom de la position de la classe (ex: sous le lit) */
  public prepositionSpatiale: PrepositionSpatiale = null;

  /** Position de la classe (ex: sous le lit) */
  public position: PositionObjet = null;

}
