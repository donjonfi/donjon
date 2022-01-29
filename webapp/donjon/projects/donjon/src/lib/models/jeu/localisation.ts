import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { EClasseRacine } from "../commun/constantes";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "./intitule";
import { Nombre } from "../commun/nombre.enum";

/**
 * Localisation:
 * nord, nord-est, est, sud-est, sud, sud-ouest, ouest, nord-ouest,
 * haut, bas, intérieur, extérieur.
 */
export enum ELocalisation {
  inconnu = '?',
  /** Nord */
  nord = 'n',
  /** Nord-Est */
  nord_est = 'ne',
  /** Est */
  est = 'e',
  /** Sud-Est */
  sud_est = 'se',
  /** Sud */
  sud = 's',
  /** Sud-Ouest */
  sud_ouest = 'so',
  /** Ouest */
  ouest = 'o',
  /** Nord-Ouest */
  nord_ouest = 'no',
  /** Haut */
  haut = 'h',
  /** Bas */
  bas = 'b',
  /** Intérieur */
  interieur = 'i',
  /** Extérieur */
  exterieur = 'x',
}

export class Localisation extends Intitule {

  public static readonly Nord = new Localisation(ELocalisation.nord, "le ", "nord");
  public static readonly NordEst = new Localisation(ELocalisation.nord_est, "le ", "nord-est");
  public static readonly Est = new Localisation(ELocalisation.est, "l'", "est");
  public static readonly SudEst = new Localisation(ELocalisation.sud_est, "le ", "sud-est");
  public static readonly Sud = new Localisation(ELocalisation.sud, "le ", "sud");
  public static readonly SudOuest = new Localisation(ELocalisation.sud_ouest, "le ", "sud-ouest");
  public static readonly Ouest = new Localisation(ELocalisation.ouest, "l'", "ouest");
  public static readonly NordOuest = new Localisation(ELocalisation.nord_ouest, "le ", "nord-ouest");
  public static readonly Haut = new Localisation(ELocalisation.haut, "le ", "haut");
  public static readonly Bas = new Localisation(ELocalisation.bas, "le ", "bas");
  public static readonly Interieur = new Localisation(ELocalisation.interieur, "l'", "intérieur");
  public static readonly Exterieur = new Localisation(ELocalisation.exterieur, "l'", "extérieur");

  constructor(
    public id: ELocalisation,
    determinant: string,
    nom: string
  ) {
    super(nom, new GroupeNominal(determinant, nom, null), ClassesRacines.Direction);
  }

  public static getLocalisation(localisation: ELocalisation): Localisation {
    switch (localisation) {
      case ELocalisation.nord:
        return Localisation.Nord;
      case ELocalisation.nord_est:
        return Localisation.NordEst;
      case ELocalisation.est:
        return Localisation.Est;
      case ELocalisation.sud_est:
        return Localisation.SudEst;
      case ELocalisation.sud:
        return Localisation.Sud;
      case ELocalisation.sud_ouest:
        return Localisation.SudOuest;
      case ELocalisation.ouest:
        return Localisation.Ouest;
      case ELocalisation.nord_ouest:
        return Localisation.NordOuest;
      case ELocalisation.haut:
        return Localisation.Haut;
      case ELocalisation.bas:
        return Localisation.Bas;
      case ELocalisation.interieur:
        return Localisation.Interieur;
      case ELocalisation.exterieur:
        return Localisation.Exterieur;
      default:
        throw new Error("Localisation > getLocalisation > Localisation inconnue.");
    }
  }

  public override toString(): string {
    return this.intitule.nom;
  }
}


