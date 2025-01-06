import { Capacite } from '../commun/capacite';
import { Classe } from '../commun/classe';
import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Nombre } from '../commun/nombre.enum';
import { PositionSujetString } from './position-sujet';
import { ProprieteConcept } from '../commun/propriete-element';
import { RoutineReaction } from './routine-reaction';

export class ElementGenerique implements ElementDonjon {

  /** Numéro de ligne dans le scénario où cet élément est défini. 
   * -1 si l'élément n'est pas défini explicitement dans le scénario.
   */
  public numeroLigne: number = -1;

  public description: string = null;
  // public apercu: string = null;
  // public texte: string = null;
  public proprietes = new Array<ProprieteConcept>();
  public capacites = new Array<Capacite>();
  public reactions = new Array<RoutineReaction>();
  public nomS: string = null;
  public nomP: string = null;
  public epitheteS: string = null;
  public epitheteP: string = null;

  public synonymes: GroupeNominal[] = [];
  public valeursTexte: string[] = [];
  public valeursNombre: number[] = [];
  public valeursIntitule: GroupeNominal[] = [];

  constructor(
    public determinant: string,
    public nom: string,
    public epithete: string,
    public classeIntitule: string,
    public classe: Classe,
    public _positionString: PositionSujetString[],
    public genre: Genre,
    public nombre: Nombre,
    public quantite: number,
    public attributs: string[],
  ) {
    // singulier / pluriel
    if (nombre === Nombre.p) {
      this.nomP = this.nom;
      this.epitheteP = this.epithete;
    } else if (nombre === Nombre.s) {
      this.nomS = this.nom;
      this.epitheteS = this.epithete;
    }

  }

  public get positionString(): ReadonlyArray<PositionSujetString> {
    return this._positionString;
  }

  // Ajoute les positions si elles ne sont pas déjà présente
  public ajouterPositionsString(nouvPositions: ReadonlyArray<PositionSujetString>) {

    nouvPositions.forEach(nouvPosition => {
      this.ajouterPositionString(nouvPosition);
    });

  }


  // Ajoute la position si elle n’est pas déjà présente
  public ajouterPositionString(nouvPosition: PositionSujetString) {

    let dejaPresente = false;

    for (const curPosition of this._positionString) {
      if (curPosition.position == nouvPosition.position && curPosition.sujet == nouvPosition.sujet && curPosition.complement == nouvPosition.complement) {
        dejaPresente = true;
        break;
      }
    }

    if (!dejaPresente) {
      this._positionString.push(nouvPosition);
    }

  }

  public get elIntitule() {
    return this.nom + (this.epithete ? (' ' + this.epithete) : '');
  }

  public static elIntitule(el: ElementGenerique) {
    return el.nom + (el.epithete ? (' ' + el.epithete) : '');
  }

}
