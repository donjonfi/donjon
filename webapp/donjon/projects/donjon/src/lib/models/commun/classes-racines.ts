import { EClasseRacine, EEtatsBase } from './constantes';

import { Classe } from './classe';

export class ClassesRacines {

  /** Il s’agit d’un mot ou d’un groupe nominal (racine) */
  public static Intitule = new Classe(EClasseRacine.intitule, "intitulé", null, 0, []);

  /** Il s’agit d’un nombre ayant un intitulé */
  public static Compteur = new Classe(EClasseRacine.compteur, "compteur", ClassesRacines.Intitule, 1, []);
  /** Il s'agit d'un compteur ayant une unité */
  public static Ressource = new Classe(EClasseRacine.ressource, "ressource", ClassesRacines.Compteur, 2, []);

  /** Il s’agit d’une liste d’éléments (textes, nombres, intitulés, mixte, …)  */
  public static Liste = new Classe(EClasseRacine.liste, "liste", ClassesRacines.Intitule, 1, []);
  public static ListeVide = new Classe(EClasseRacine.listeVide, "liste vide", ClassesRacines.Liste, 2, []);
  public static ListeTexte = new Classe(EClasseRacine.listeTexte, "liste texte", ClassesRacines.Liste, 2, []);
  public static ListeNombre = new Classe(EClasseRacine.listeNombre, "liste nombre", ClassesRacines.Liste, 2, []);
  public static ListeIntitule = new Classe(EClasseRacine.listeIntitule, "liste intitulé", ClassesRacines.Liste, 2, []);
  public static ListeMixte = new Classe(EClasseRacine.listeMixte, "liste mixte", ClassesRacines.Liste, 2, []);

  /** Il s’agit d’une direction (nord, nord-est, est, sud-est, sud, sud-ouest, 
   * ouest, nord-ouest, haut, bas, intérieur, extérieur) */
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
    [EEtatsBase.solide, EEtatsBase.opaque, EEtatsBase.transportable, EEtatsBase.denombrable]);

  /** Il s’agit d’un être vivant */
  public static Vivant = new Classe(EClasseRacine.vivant, "vivant", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

  /** Il s’agit d’un animal */
  public static Animal = new Classe(EClasseRacine.animal, "animal", ClassesRacines.Vivant, 4, []);

  /** Il s’agit d’une personne */
  public static Personne = new Classe(EClasseRacine.personne, "personne", ClassesRacines.Vivant, 4,
    [EEtatsBase.parlant]);

  /** Il s’agit d’un obstacle */
  public static Obstacle = new Classe(EClasseRacine.obstacle, "obstacle", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

  /** Il s’agit d’une porte */
  public static Porte = new Classe(EClasseRacine.porte, "porte", ClassesRacines.Obstacle, 4,
    [EEtatsBase.ouvert, EEtatsBase.ouvrable, EEtatsBase.deverrouille]);

  /** Il s’agit d’un contenant */
  public static Contenant = new Classe(EClasseRacine.contenant, "contenant", ClassesRacines.Objet, 3,
    [EEtatsBase.ouvert]);

  /** Il s’agit d’un support */
  public static Support = new Classe(EClasseRacine.support, "support", ClassesRacines.Objet, 3,
    [EEtatsBase.fixe]);

  /** Il s’agit d’un solide */
  public static Solide = new Classe(EClasseRacine.solide, "solide", ClassesRacines.Objet, 3,
    [EEtatsBase.solide]);

  /** Il s’agit d’un liquide */
  public static Liquide = new Classe(EClasseRacine.liquide, "liquide", ClassesRacines.Objet, 3,
    [EEtatsBase.liquide]);

  /** Il s’agit d’un gaz */
  public static Gaz = new Classe(EClasseRacine.gaz, "gaz", ClassesRacines.Objet, 3,
    [EEtatsBase.gazeux]);

  /** Il s’agit d’une boisson, elle est liquide et buvable. */
  public static Boisson = new Classe(EClasseRacine.boisson, "boisson", ClassesRacines.Liquide, 4,
    [EEtatsBase.buvable]);

  /** Il s’agit d’une aliment, il est solide et mangeable. */
  public static Aliment = new Classe(EClasseRacine.aliment, "aliment", ClassesRacines.Solide, 4,
    [EEtatsBase.mangeable]);
}