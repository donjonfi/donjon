/**
 * Type d’un paramètre de routine (ceci ou cela).
 *
 * - `'nombre'` / `'texte'` : valeur capturée à l’appel (lecture seule dans la routine).
 * - `'classe'` : référence à un élément/compteur dont la classe hérite de `classeName`.
 *   La routine peut le modifier (ex. `changer ceci augmente de 1` sur un compteur).
 */
export type TypeParamRoutine = 'nombre' | 'texte' | 'classe';

/**
 * Paramètre typé d’une routine.
 *
 * Pour les paramètres de type `'classe'`, on stocke le **nom brut** de la
 * classe tel qu’écrit dans le scénario (déjà normalisé via
 * `StringUtils.normaliserMot`). La résolution effective vers une instance
 * `Classe` (racine ou définie par le scénario) se fait au runtime, quand
 * `monde.classes` est disponible — l’analyseur n’a pas accès à la liste
 * complète des classes utilisateur.
 */
export class ParamRoutine {
  public constructor(
    public type: TypeParamRoutine,
    /** Présent uniquement si type === 'classe'. Nom de classe normalisé. */
    public classeName?: string,
  ) { }
}
