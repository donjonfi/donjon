import { EClasseRacine, EEtatsBase } from './constantes';

import { Classe } from './classe';

export class ClassesRacines {

  public static Intitule = new Classe(EClasseRacine.intitule, "Intitulé", null, 0, []);
  public static Element = new Classe(EClasseRacine.element, "Élément", ClassesRacines.Intitule, 1, []);
  public static Lieu = new Classe(EClasseRacine.lieu, "Lieu", ClassesRacines.Element, 2,
    [EEtatsBase.ECLAIRE]);
  public static Objet = new Classe(EClasseRacine.objet, "Objet", ClassesRacines.Element, 2,
    [EEtatsBase.ETEINT, EEtatsBase.OPAQUE, EEtatsBase.TRANSPORTABLE, EEtatsBase.MUET]);
  public static Vivant = new Classe(EClasseRacine.vivant, "Vivant", ClassesRacines.Objet, 3,
    [EEtatsBase.FIXE]);
  public static Animal = new Classe(EClasseRacine.animal, "Animal", ClassesRacines.Vivant, 4, []);
  public static Personne = new Classe(EClasseRacine.personne, "Personne", ClassesRacines.Vivant, 4,
    [EEtatsBase.PARLANT]);
  public static Porte = new Classe(EClasseRacine.porte, "Porte", ClassesRacines.Objet, 3,
    [EEtatsBase.OUVERT, EEtatsBase.OUVRABLE, EEtatsBase.DEVERROUILLE, EEtatsBase.FIXE]);
  public static Contenant = new Classe(EClasseRacine.contenant, "Contenant", ClassesRacines.Objet, 3,
    [EEtatsBase.OUVERT]);
  public static Support = new Classe(EClasseRacine.support, "Support", ClassesRacines.Objet, 3,
    [EEtatsBase.FIXE]);

}