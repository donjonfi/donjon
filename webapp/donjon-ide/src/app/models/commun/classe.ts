import { Etat } from './etat';
import { StringUtils } from 'src/app/utils/commun/string.utils';

export class Classe {

  constructor(
    public nom: string,
    public intitule: string,
    public parent: Classe,
    public niveau: number,
    public etats: Etat[]
  ) { }

  static heriteDe(candidat: Classe, classe: string): boolean {
    let retVal = false;
    if (candidat) {
      const recherche = StringUtils.normaliserMot(classe);
      if (candidat.nom === recherche || candidat.intitule === classe) {
        retVal = true;
      } else {
        retVal = Classe.heriteDe(candidat.parent, classe);
      }
    }
    return retVal;
  }

  public static getClasseIntitule(classeElement: string): EClasseRacine | string {
    let retVal: EClasseRacine | string = EClasseRacine.objet;

    if (classeElement) {
      switch (classeElement.trim().toLocaleLowerCase()) {
        case "animal":
        case "animaux":
          retVal = EClasseRacine.animal;
          break;
        case "personne":
        case "homme":
        case "hommes":
        case "femme":
        case "femmes":
          retVal = EClasseRacine.personne;
          break;
        // case "clé":
        // case "cle":
        // case "clef":
        // case "clefs":
        // case "clés":
        // case "cles":
        //   retVal = ClasseRacine.cle;
        //   break;
        case "contenant":
        case "contenants":
          retVal = EClasseRacine.contenant;
          break;
        case "support":
        case "supports":
          retVal = EClasseRacine.support;
          break;
        // case "décors":
        // case "décor":
        // case "decor":
        // case "decors":
        //   retVal = ClasseRacine.decor;
        //   break;
        case "personne":
        case "personnes":
          retVal = EClasseRacine.personne;
          break;
        case "objet":
        case "objets":
          retVal = EClasseRacine.objet;
          break;
        case "porte":
        case "portes":
          retVal = EClasseRacine.porte;
          break;
        case "lieu":
          retVal = EClasseRacine.lieu;
          break;

        case "joueur":
          retVal = EClasseRacine.joueur;
          break;

        default:
          retVal = classeElement; // EClasseRacine.objet;
          break;
      }
    }
    return retVal;
  }

}


export enum EClasseRacine {
  element = 'element',
  lieu = 'lieu',
  objet = 'objet',
  vivant = 'vivant',
  animal = 'animal',
  personne = 'personne',
  porte = 'porte',
  contenant = 'contenant',
  support = 'support',
  // types spéciaux
  joueur = 'joueur',
  inventaire = 'inventaire',
}

export class ClassesRacines {

  public static Element = new Classe(EClasseRacine.element, "Élément", null, 0, []);
  public static Lieu = new Classe(EClasseRacine.lieu, "Lieu", ClassesRacines.Element, 1, []);
  public static Objet = new Classe(EClasseRacine.objet, "Objet", ClassesRacines.Element, 1, []);
  public static Vivant = new Classe(EClasseRacine.vivant, "Vivant", ClassesRacines.Objet, 2, []);
  public static Animal = new Classe(EClasseRacine.animal, "Animal", ClassesRacines.Vivant, 3, []);
  public static Personne = new Classe(EClasseRacine.personne, "Personne", ClassesRacines.Vivant, 3, []);
  public static Porte = new Classe(EClasseRacine.porte, "Porte", ClassesRacines.Objet, 2, []);
  public static Contenant = new Classe(EClasseRacine.contenant, "Contenant", ClassesRacines.Objet, 2, []);
  public static Support = new Classe(EClasseRacine.support, "Support", ClassesRacines.Objet, 2, []);

}

