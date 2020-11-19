import { EClasseRacine, EEtatsBase } from './constantes';

import { Classe } from './classe';

export class ClassesRacines {

  /** Il s’agit d’un mot ou d’un groupe nominal. */
  public static Intitule = new Classe(EClasseRacine.intitule, "Intitulé", null, 0, []);

  /** Il s’agit d’un élément du jeu */
  public static Element = new Classe(EClasseRacine.element, "Élément", ClassesRacines.Intitule, 1,
    [EEtatsBase.intact]);

  /** Il s’agit d’un élément spécial du jeu (le jeu lui-même, la licence, …) */
  public static Special = new Classe(EClasseRacine.special, "Spécial", ClassesRacines.Element, 2, []);

  /** Il s’agit d’un lieu du jeu */
  public static Lieu = new Classe(EClasseRacine.lieu, "Lieu", ClassesRacines.Element, 2,
    [EEtatsBase.clair]);

  /** Il s’agit d’un objet du jeu */
  public static Objet = new Classe(EClasseRacine.objet, "Objet", ClassesRacines.Element, 2,
    [EEtatsBase.eteint, EEtatsBase.opaque, EEtatsBase.transportable, EEtatsBase.muet]);

  /** Il s’agit d’un être vivant */
  public static Vivant = new Classe(EClasseRacine.vivant, "Vivant", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

  /** Il s’agit d’un animal */
  public static Animal = new Classe(EClasseRacine.animal, "Animal", ClassesRacines.Vivant, 4, []);

  /** Il s’agit d’une personne */
  public static Personne = new Classe(EClasseRacine.personne, "Personne", ClassesRacines.Vivant, 4,
    [EEtatsBase.parlant]);

  /** Il s’agit d’une porte */
  public static Porte = new Classe(EClasseRacine.porte, "Porte", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert, EEtatsBase.ouvrable, EEtatsBase.deverrouille, EEtatsBase.fixe]);

  /** Il s’agit d’un contenant */
  public static Contenant = new Classe(EClasseRacine.contenant, "Contenant", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert]);

  /** Il s’agit d’un support */
  public static Support = new Classe(EClasseRacine.support, "Support", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

}