/** Portée d’un fond (objet de décor présent dans plusieurs lieux). */
export type PorteeFond = 'partage' | 'parLieu';

/**
 * Spécification de présence d’un fond.
 * - `partage` (commun) : une seule instance, présente dans les lieux du domaine (présence dynamique au runtime).
 * - `parLieu` (propre) : une instance par lieu du domaine (matérialisée à la génération).
 *
 * Domaine : soit tous les lieux (`tousLesLieux`), soit les lieux possédant l’état `etatDomaine`.
 */
export class PresenceFond {
  constructor(
    public portee: PorteeFond,
    public tousLesLieux: boolean,
    /** Nom (normalisé au singulier) de l’état filtrant les lieux du domaine, si `!tousLesLieux`. */
    public etatDomaine?: string,
  ) { }
}
