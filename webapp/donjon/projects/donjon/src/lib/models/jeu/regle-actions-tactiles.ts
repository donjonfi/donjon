import { GroupeNominal } from '../commun/groupe-nominal';

/** Type de liste d’actions proposées par l’interface tactile. */
export type TypeListeActionsTactiles = 'principales' | 'secondaires';

/**
 * Règle définissant les actions principales ou secondaires proposées par
 * l’interface tactile pour une classe d’éléments ou un élément précis.
 *
 * Exemples :
 * - « Les actions principales pour les objets sont examiner, prendre et utiliser. »
 * - « Ajouter attaquer et insulter aux actions principales du bandit. »
 *
 * La cible n’est pas résolue à la compilation : c’est à la résolution
 * (ActionsTactilesUtils) qu’on détermine si elle désigne un élément précis ou
 * une classe, ce qui permet de cibler une classe ou un élément déclaré après
 * la règle, et de partager le même mécanisme avec les instructions exécutées
 * en cours de partie.
 */
export interface RegleActionsTactiles {
  /** Liste concernée (principales ou secondaires). */
  typeListe: TypeListeActionsTactiles;
  /** Cible de la règle : élément précis ou classe d’éléments. */
  cible: GroupeNominal;
  /** Remplacer la liste héritée ou la compléter. */
  mode: 'remplacer' | 'ajouter';
  /** Infinitifs des actions, dans l’ordre de déclaration. */
  infinitifs: string[];
}
