/**
 * Configuration d'affichage d'une ressource dans le cartouche (HUD).
 *
 * À la différence d'un {@link Compteur} (valeur unique et globale), une ressource est
 * un objet quantifiable qui peut exister en plusieurs piles. La configuration ci-dessous
 * est figée à la compilation (ancrée sur la DÉFINITION de la ressource) ; la quantité
 * affichée est calculée en direct à l'exécution en sommant les piles possédées par le
 * joueur (voir ElementsJeuUtils.sommeQuantiteRessourcePossedee). Ainsi, dépenser une
 * ressource jusqu'à 0 (suppression des piles vides) laisse l'entrée du cartouche afficher
 * « 0 » au lieu de disparaître.
 *
 * Le périmètre sommé dépend du {@link scope} :
 *  - 'possede'    (défaut) : piles directement dans l'inventaire du joueur ;
 *  - 'disponible'          : toutes les autres piles du jeu (coffres, lieux, PNJ…),
 *                            c.-à-d. tout SAUF l'inventaire du joueur.
 */
export type ScopeRessourceAffichee = 'possede' | 'disponible';

export class RessourceAffichee {

  constructor(
    /** Nom de la ressource (sert à retrouver/sommer ses piles à l'exécution). */
    public nom: string,
    /** Coin du cartouche où afficher la ressource. */
    public positionAffichage: 'haut-gauche' | 'haut-droite' | 'bas-gauche' | 'bas-droite',
    /** Nom à afficher (intitulé de la ressource). */
    public intituleNom: string,
    /** Périmètre des piles à sommer (possédées par le joueur, ou disponibles ailleurs). */
    public scope: ScopeRessourceAffichee = 'possede',
    /** Unité de comptage (singulier) — ex: « pièce ». */
    public unite: string | null = null,
    /** Unité de comptage (pluriel) — ex: « pièces ». */
    public unites: string | null = null,
    /** Titre libre affiché à la place du nom. */
    public titre: string | null = null,
    /** Si vrai, ne pas afficher l'intitulé dans le cartouche. */
    public sansIntitule: boolean = false,
    /** Si vrai, ne pas afficher l'unité dans le cartouche. */
    public sansUnite: boolean = false,
  ) { }

}
