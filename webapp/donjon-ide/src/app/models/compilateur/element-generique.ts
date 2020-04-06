import { Capacite } from './capacite';
import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';
import { PositionSujetString } from './position-sujet';
import { Propriete } from './propriete';
import { TypeElement } from '../commun/type-element.enum';

export class ElementGenerique implements ElementDonjon {

  public description: string;
  public proprietes = new Array<Propriete>();
  public capacites = new Array<Capacite>();
  public nomF: string;
  public nomM: string;
  public nomS: string;
  public nomP: string;

  constructor(
    public determinant: string,
    public nom: string,
    public intituleType: string,
    public type: TypeElement,
    public positionString: PositionSujetString,
    public genre: Genre,
    public nombre: Nombre,
    public quantite: number,
    public attributs: string[],
  ) {

    // masculin / féminin
    if (genre == Genre.f) {
      this.nomF = this.nom;
    } else if (genre == Genre.m) {
      this.nomM = this.nom;
    }
    // singulier / pluriel
    if (nombre == Nombre.p) {
      this.nomP = this.nom;
    } else if (nombre == Nombre.s) {
      this.nomS = this.nom;
    }

  }

}
