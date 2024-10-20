import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { GroupeNominal } from "../commun/groupe-nominal";
import { ProprieteElement } from "../commun/propriete-element";
import { Intitule } from "../jeu/intitule";

export class Concept extends Intitule {

  constructor(
    /** Nom du compteur */
    nom: string,
    /** Intitulé du compteur */
    intitule: GroupeNominal | undefined = undefined,
    /** Classe : compteur */
    classe: Classe = ClassesRacines.Concept,
  ) {
    super(nom, (intitule ? intitule : (new GroupeNominal(null, nom, null))), classe);
  }

  /** Propriétés de l’élément */
  public proprietes: ProprieteElement[] = [];

  /**
   * États actuels de l’élément
   * - ouvrable
   * - verrouillable
   * - ouvert(e)
   * - verrouillé(e)
   * - allumé(e)
   * - cassé(e)
   * - …
   */
  // public etats: string[] = [];
  public etats: number[] = [];

  /** Ils s’agit des autres noms que le joueur peut donner à cet élément du jeu. */
  private _synonymes: GroupeNominal[] = [];

  get synonymes(): GroupeNominal[] {
    return this._synonymes;
  }

  public addSynonymes(synonymes: GroupeNominal[]) {
    synonymes.forEach(synonyme => {
      if (!this._synonymes.some(x => x.toString() == synonyme.toString())) {
        this._synonymes.push(synonyme);
      }
    });
  }

}