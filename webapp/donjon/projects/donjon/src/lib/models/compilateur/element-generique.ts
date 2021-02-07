import { Capacite } from '../commun/capacite';
import { Classe } from '../commun/classe';
import { ElementDonjon } from './element-donjon';
import { Genre } from '../commun/genre.enum';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Nombre } from '../commun/nombre.enum';
import { PositionSujetString } from './position-sujet';
import { Propriete } from '../commun/propriete';
import { Reaction } from './reaction';

export class ElementGenerique implements ElementDonjon {

  public description: string = null;
  // public apercu: string = null;
  // public texte: string = null;
  public proprietes = new Array<Propriete>();
  public capacites = new Array<Capacite>();
  public reactions = new Array<Reaction>();
  public nomS: string = null;
  public nomP: string = null;
  public epitheteS: string = null;
  public epitheteP: string = null;

  public synonymes: GroupeNominal[] = [];

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
    // singulier / pluriel
    if (nombre === Nombre.p) {
      this.nomP = this.nom;
      this.epitheteP = this.epithete;
    } else if (nombre === Nombre.s) {
      this.nomS = this.nom;
      this.epitheteS = this.epithete;
    }

  }

  public static elIntitule(el: ElementGenerique) {
    return el.nom;
  }

}
