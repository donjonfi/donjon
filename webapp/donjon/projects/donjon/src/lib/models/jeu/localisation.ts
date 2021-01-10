import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { EClasseRacine } from "../commun/constantes";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "./intitule";
import { Nombre } from "../commun/nombre.enum";

/**
 * Localisation:
 * - Nord
 * - Sud
 * - Est
 * - Ouest
 * - Haut
 * - Bas
 * - Intérieur
 * - Extérieur
 */
export enum ELocalisation {
    inconnu = '?',
    /** Nord */
    nord = 'n',
    /** Sud */
    sud = 's',
    /** Est */
    est = 'e',
    /** Ouest */
    ouest = 'o',
    /** Haut */
    haut = 'h',
    /** Bas */
    bas = 'b',
    /** Intérieur */
    interieur = 'i',
    /** Extérieur */
    exterieur = 'x',
    /** Dessous */
    dessous = 'd',
    /** Dessus */
    dessus = 'u',
}

export class Localisation extends Intitule {

    public static readonly Nord = new Localisation(ELocalisation.nord, "le ", "nord");
    public static readonly Sud = new Localisation(ELocalisation.sud, "le ", "sud");
    public static readonly Est = new Localisation(ELocalisation.nord, "l'", "est");
    public static readonly Ouest = new Localisation(ELocalisation.nord, "l'", "ouest");
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
}


