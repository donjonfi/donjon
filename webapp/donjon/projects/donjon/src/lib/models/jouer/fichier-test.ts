import { DeclenchementFutur } from "./sauvegarde";

export class FichierTest {

  public readonly type: string = "test";

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
   * Étapes du fichier de vérification.
   * Chaque étape associe une commande/réponse/graine/déclenchement à
   * la sortie attendue (pour c, r et d).
   */
  public etapesTest: EtapeTest[];
}

export interface EtapeTest {
  type: 'c' | 'r' | 'g' | 'd';
  valeur: string;
  /** Sortie textuelle attendue après l'exécution. Présent pour c, r et d
   *  (sur d : permet de détecter qu'une routine forcée a vu son contenu changer entre l'enregistrement et le replay). */
  sortie?: string;
}

/**
 * Résultat retourné par la modale de divergence après interaction utilisateur.
 * Pilote la suite du replay et la mise à jour du fichier .tst en mémoire.
 */
export type ResultatDivergence =
  | { action: 'accepter' }
  | { action: 'retirer' }
  | { action: 'modifier', nouvelleCommande: string }
  | { action: 'ajouter', position: 'avant' | 'apres', nouvelleCommande: string }
  | { action: 'quitter' }
  /** Pas-à-pas : annuler la commande courante, recule à idx-1. */
  | { action: 'precedent' }
  /** Pas-à-pas : ignorer la divergence, avance à idx+1 sans modifier le .tst. */
  | { action: 'suivant' }
  /** Pas-à-pas : accepter la sortie courante et avancer à idx+1 (alias de « accepter » avec sémantique « reprendre l'auto »). */
  | { action: 'continuer' };
