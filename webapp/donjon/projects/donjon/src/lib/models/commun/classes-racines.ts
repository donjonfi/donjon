import { EClasseRacine, EEtatsBase } from './constantes';

import { Classe } from './classe';

export class ClassesRacines {

  /** Il s’agit d’un mot ou d’un groupe nominal (racine) */
  public static Compteur = new Classe(EClasseRacine.compteur, "compteur", null, 0, []);

  /** Il s’agit d’un mot ou d’un groupe nominal (racine) */
  public static Intitule = new Classe(EClasseRacine.intitule, "intitulé", null, 0, []);

  /** Il s’agit d’une direction (nord, sud, est, ouest, haut, bas, intérieur, extérieur) */
  public static Direction = new Classe(EClasseRacine.direction, "direction", ClassesRacines.Intitule, 1, []);

  /** Il s’agit d’un élément du jeu */
  public static Element = new Classe(EClasseRacine.element, "élément", ClassesRacines.Intitule, 1,
    [EEtatsBase.intact]);

  /** Il s’agit d’un élément spécial du jeu (le jeu lui-même, la licence, …) */
  public static Special = new Classe(EClasseRacine.special, "spécial", ClassesRacines.Element, 2, []);

  /** Il s’agit d’un lieu du jeu */
  public static Lieu = new Classe(EClasseRacine.lieu, "lieu", ClassesRacines.Element, 2,
    [EEtatsBase.clair]);

  /** Il s’agit d’un objet du jeu */
  public static Objet = new Classe(EClasseRacine.objet, "objet", ClassesRacines.Element, 2,
    [EEtatsBase.eteint, EEtatsBase.opaque, EEtatsBase.transportable, EEtatsBase.muet]);

  /** Il s’agit d’un être vivant */
  public static Vivant = new Classe(EClasseRacine.vivant, "vivant", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

  /** Il s’agit d’un animal */
  public static Animal = new Classe(EClasseRacine.animal, "animal", ClassesRacines.Vivant, 4, []);

  /** Il s’agit d’une personne */
  public static Personne = new Classe(EClasseRacine.personne, "personne", ClassesRacines.Vivant, 4,
    [EEtatsBase.parlant]);

  /** Il s’agit d’une porte */
  public static Porte = new Classe(EClasseRacine.porte, "porte", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert, EEtatsBase.ouvrable, EEtatsBase.deverrouille, EEtatsBase.fixe]);

  /** Il s’agit d’un contenant */
  public static Contenant = new Classe(EClasseRacine.contenant, "contenant", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert]);

  /** Il s’agit d’un support */
  public static Support = new Classe(EClasseRacine.support, "support", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

}