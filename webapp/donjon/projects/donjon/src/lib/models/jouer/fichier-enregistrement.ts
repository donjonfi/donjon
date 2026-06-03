import { DeclenchementFutur } from "./sauvegarde";

export class FichierEnregistrement {

  public readonly type: string = "enregistrement";

  public version: number;

  public scenario: string;

  public graine: string;

  public declenchementsFuturs: DeclenchementFutur[];

  /**
   * Sortie attendue pour l'intro du jeu (commencer le jeu + regarder + routines initiales).
   * Capturée avant la première commande joueur, comparée au démarrage du magnéto.
   */
  public sortieIntro?: string;

  /**
   * Lectures d'horloge (epoch ms) effectuées pendant la phase intro, dans l'ordre.
   * Rejouées (au lieu de l'heure réelle) au démarrage du magnéto pour le déterminisme.
   */
  public horlogeIntro?: number[];

  /**
   * Étapes de l'enregistrement.
   * Chaque étape associe une commande/réponse/graine/déclenchement à
   * la sortie attendue (pour c, r et d).
   */
  public etapes: EtapeEnregistrement[];
}

export interface EtapeEnregistrement {
  type: 'c' | 'r' | 'g' | 'd';
  valeur: string;
  /** Sortie textuelle attendue après l'exécution. Présent pour c, r et d
   *  (sur d : permet de détecter qu'une routine forcée a vu son contenu changer entre l'enregistrement et le replay). */
  sortie?: string;
  /**
   * Lectures d'horloge (epoch ms) effectuées pendant l'exécution de cette étape, dans l'ordre.
   * Rejouées (au lieu de l'heure réelle) pour le déterminisme ; éditables à la main / au magnéto.
   * Absent si l'étape ne lit pas l'heure.
   */
  horloge?: number[];
}

/**
 * Résultat retourné par la modale de divergence après interaction utilisateur.
 * Pilote la suite du replay et la mise à jour de l'enregistrement en mémoire.
 */
export type ResultatDivergence =
  | { action: 'accepter' }
  | { action: 'retirer' }
  | { action: 'modifier', nouvelleCommande: string }
  | { action: 'ajouter', position: 'avant' | 'apres', nouvelleCommande: string }
  | { action: 'quitter' }
  /** Pas-à-pas : annuler la commande courante, recule à idx-1. */
  | { action: 'precedent' }
  /** Pas-à-pas : ignorer la divergence, avance à idx+1 sans modifier le .rec. */
  | { action: 'suivant' }
  /** Pas-à-pas : accepter la sortie courante et avancer à idx+1 (alias de « accepter » avec sémantique « reprendre l'auto »). */
  | { action: 'continuer' };
