import { PositionObjet, PrepositionSpatiale } from "./position-objet";

import { Classe } from "../commun/classe";
import { ElementJeu } from "./element-jeu";
import { Etat } from "../commun/etat";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Liste } from "./liste";
import { ProprieteConcept } from "../commun/propriete-element";
import { Concept } from "../compilateur/concept";

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
  public proprieteElement: ProprieteConcept = null;

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
  public element: Concept = null;

  /** Liste cible */
  public liste: Liste = null;

  // D. POSITION (relative à l’élément cible)

  /** Nom de la position de la classe (ex: sous le lit) */
  public prepositionSpatiale: PrepositionSpatiale = null;

  /** Position de la classe (ex: sous le lit) */
  public position: PositionObjet = null;


  public toString() {

    let retVal: string;

    switch (this.type) {

      // nombre de propriété → élément
      case TypeProprieteJeu.nombreDeProprieteElement:
        retVal = "nombre " + ProprieteJeu.getDe(this.intituleProprieteElement.nom)
          + this.intituleProprieteElement.nom + " → " + this.intituleElement;
        break;

      // propriété → élément
      case TypeProprieteJeu.proprieteElement:
        retVal = this.intituleProprieteElement.nom + " → " + this.intituleElement;
        break;

      // nombre de classe [attribut1 [attribut2]]
      case TypeProprieteJeu.nombreDeClasseAttributs:
        retVal = "nombre " + ProprieteJeu.getDe(this.intituleClasse) + this.intituleClasse;
        // états
        this.nomsEtats.forEach(nomEtat => {
          retVal += " " + nomEtat;
        });
        break;

      // nombre de classe [attribut1 [attribut2]] [position]
      case TypeProprieteJeu.nombreDeClasseAttributsPosition:
        retVal = "nombre " + ProprieteJeu.getDe(this.intituleClasse) + this.intituleClasse;
        // états
        this.nomsEtats.forEach(nomEtat => {
          retVal += " " + nomEtat;
        });
        // position
        retVal += PositionObjet.prepositionSpatialeToString(this.prepositionSpatiale) + " " + this.intituleElement;
        break;

      default:
        retVal = "???!";
        break;
    }
    return retVal;
  }

  /**
   * Récupérer « de » ou « d’ » selon le nom pour pouvoir écrire « Nombre de xxx ».
   */
  public static getDe(nom: string) {
    let retVal = "de ";
    if (nom?.match(/^(a|e|i|o|u|y)/i)) {
      retVal = "d’";
    }
    return retVal;
  }

}
