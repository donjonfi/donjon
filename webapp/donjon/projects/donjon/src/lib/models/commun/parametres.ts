
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
    public afficherTitreLieu: 'haut' | 'bas' | 'aucun' = 'haut';
}
