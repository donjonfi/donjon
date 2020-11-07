import { Classe } from 'src/app/models/commun/classe';
import { EClasseRacine } from 'src/app/models/commun/constantes';
import { StringUtils } from './string.utils';

export class ClasseUtils {

  static heriteDe(candidat: Classe, classe: string): boolean {
    let retVal = false;
    if (candidat) {
      const recherche = StringUtils.normaliserMot(classe);
      if (candidat.nom === recherche || candidat.intitule === classe) {
        retVal = true;
      } else {
        retVal = ClasseUtils.heriteDe(candidat.parent, classe);
      }
    }
    return retVal;
  }

  public static getClasseIntitule(classeElement: string): EClasseRacine | string {
    let retVal: EClasseRacine | string = EClasseRacine.objet;

    if (classeElement) {
      switch (classeElement.trim().toLocaleLowerCase()) {

        case "intitulé":
        case "intitule":
          retVal = EClasseRacine.intitule;
          break;

        case "objet":
        case "objets":
          retVal = EClasseRacine.objet;
          break;

        case "animal":
        case "animaux":
          retVal = EClasseRacine.animal;
          break;
        case "personne":
        case "personnes":
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

