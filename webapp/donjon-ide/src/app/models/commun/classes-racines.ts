import { EClasseRacine, EEtatsBase } from './constantes';

import { Classe } from './classe';

export class ClassesRacines {

  public static Intitule = new Classe(EClasseRacine.intitule, "Intitulé", null, 0, []);
  public static Element = new Classe(EClasseRacine.element, "Élément", ClassesRacines.Intitule, 1,
    [EEtatsBase.intact]);
  public static Lieu = new Classe(EClasseRacine.lieu, "Lieu", ClassesRacines.Element, 2,
    [EEtatsBase.eclaire]);
  public static Objet = new Classe(EClasseRacine.objet, "Objet", ClassesRacines.Element, 2,
    [EEtatsBase.eteint, EEtatsBase.opaque, EEtatsBase.transportable, EEtatsBase.muet]);
  public static Vivant = new Classe(EClasseRacine.vivant, "Vivant", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);
  public static Animal = new Classe(EClasseRacine.animal, "Animal", ClassesRacines.Vivant, 4, []);
  public static Personne = new Classe(EClasseRacine.personne, "Personne", ClassesRacines.Vivant, 4,
    [EEtatsBase.parlant]);
  public static Porte = new Classe(EClasseRacine.porte, "Porte", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert, EEtatsBase.ouvrable, EEtatsBase.deverrouille, EEtatsBase.fixe]);
  public static Contenant = new Classe(EClasseRacine.contenant, "Contenant", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert]);
  public static Support = new Classe(EClasseRacine.support, "Support", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

}