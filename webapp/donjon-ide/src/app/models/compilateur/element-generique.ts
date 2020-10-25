import { Capacite } from './capacite';
import { Classe } from '../commun/classe';
import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { Nombre } from '../commun/nombre.enum';
import { PositionSujetString } from './position-sujet';
import { Propriete } from './propriete';
import { Reaction } from './reaction';

export class ElementGenerique implements ElementDonjon {

  public description: string;
  public examen: string;
  public proprietes = new Array<Propriete>();
  public capacites = new Array<Capacite>();
  public reactions = new Array<Reaction>();
  public nomF: string;
  public nomM: string;
  public nomS: string;
  public nomP: string;
  public epitheteS: string;
  public epitheteP: string;


  constructor(
    public determinant: string,
    public nom: string,
    public epithete: string,
    public classeIntitule: string,
    public classe: Classe,
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
