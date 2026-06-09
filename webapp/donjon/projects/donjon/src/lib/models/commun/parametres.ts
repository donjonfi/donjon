
export class Parametres {

    public activerAffichageSorties = true;
    public activerAffichageDirectionSorties = true;
    public activerSortiesEnLigne = true;
    public activerAffichageLieuxInconnus = false;
    public activerAffichageObstacles = true;
    public activerDescriptionDesObjetsSupportes = true;
    public activerAudio = false;
    public activerRemplacementDestinationDeplacements = true;
    public activerSynonymesAuto = true;
    public activerChoixNumeriques = false;
    public activerAttendre = true;
    /** Créer automatiquement les états inconnus rencontrés (définitions, changer, relations).
     *  Actif par défaut. Si désactivé, un état non déclaré provoque une erreur (hors conditions). */
    public activerCreationAutomatiqueEtats = true;
    public afficherTitreLieu: 'haut' | 'bas' | 'aucun' = 'haut';
}
