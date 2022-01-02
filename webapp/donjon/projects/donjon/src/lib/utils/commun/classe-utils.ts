import { Classe } from '../../models/commun/classe';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { EClasseRacine } from '../../models/commun/constantes';
import { MotUtils } from './mot-utils';
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

  public static getIntituleNormalise(intituleClasse: string): string {
    // si pas de classe, on renvoit « objet ».
    let retVal: string = EClasseRacine.objet;

    let nomNormalise = intituleClasse?.trim();
    // si classe définie, normaliser le nom
    if (nomNormalise) {
      // enlever caractères spéciaux, déterminant et majuscules.
      nomNormalise = StringUtils.normaliserMot(intituleClasse);
      // mettre le mot au singulier
      nomNormalise = MotUtils.getSingulier(nomNormalise);

      switch (nomNormalise) {

        // homme, femme => personne
        case "homme":
        case "femme":
          retVal = EClasseRacine.personne;
          break;

        default:
          // mettre le mot au singulier selon les gèles les plus courantes en FR
          retVal = nomNormalise;
          break;
      }
    }
    return retVal;
  }

  /**
   * Retrouver la classe correspondante parmis la liste fournie sur base de l’intitulé fourni.
   * Si la classe n’est pas trouvée, elle est crée et ajoutée à la liste, comme nouveau dérivé de la classe « objet ».
   * @param classes Liste des classes 
   * @param intitule Intitulé de la classe à retrouver.
   * @returns Classe trouvée ou créée.
   */
  public static trouverOuCreerClasse(classes: Classe[], intitule: string): Classe {
    // effectuer la recherche sur base de l’intitulé normalisé
    const intituleNormalise = ClasseUtils.getIntituleNormalise(intitule);

    let retVal = classes.find(x => x.nom === intituleNormalise);

    // si aucune classe trouvée, créer nouvelle classe dérivée d’un objet.
    if (retVal == null) {
      retVal = new Classe(intituleNormalise, intitule, ClassesRacines.Objet, 2, []);
      classes.push(retVal);
    }

    return retVal;
  }

  /** Trouver une classe sur base de sont intitulé. Si pas trouvé renvoie null. */
  public static trouverClasse(classes: Classe[], intitule: string) {
    // effectuer la recherche sur base de l’intitulé normalisé
    const intituleNormalise = ClasseUtils.getIntituleNormalise(intitule);

    let retVal = classes.find(x => x.nom === intituleNormalise);

    if (!retVal) {
      retVal = null;
    }

    return retVal;
  }

  public static getHierarchieClasse(classe: Classe): string {
    let retVal = "−";
    if (classe) {
      retVal = classe.intitule;
      let curParent = classe.parent;
      while (curParent != null) {
        retVal += " → " + curParent.intitule;
        // parent suivant
        curParent = curParent.parent;
      }
    }
    return retVal;
  }

}