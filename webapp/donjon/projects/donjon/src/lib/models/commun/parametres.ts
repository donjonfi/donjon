
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
    /** Interface tactile (mode mobile) du lecteur. Désactivable par jeu : « Désactiver le mode mobile. » */
    public activerInterfaceTactile = true;
    /** Créer automatiquement les états inconnus rencontrés (définitions, changer, relations).
     *  Actif par défaut. Si désactivé, un état non déclaré provoque une erreur (hors conditions). */
    public activerCreationAutomatiqueEtats = true;
    public afficherTitreLieu: 'haut' | 'bas' | 'aucun' = 'haut';
}
