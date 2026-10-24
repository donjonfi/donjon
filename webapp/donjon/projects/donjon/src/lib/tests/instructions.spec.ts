import { ClassesRacines, EClasseRacine, ELocalisation, ElementsJeuUtils, Genre, Jeu, Lieu, Nombre, Objet, PhraseUtils, PositionObjet, PrepositionSpatiale, Voisin } from "../../public-api";

import { InstructionDeplacerCopier } from "../utils/jeu/instruction-deplacer-copier";

describe('Instructions − Lieux', () => {

    interface ThisContext {
        jeu: Jeu;
        eju: ElementsJeuUtils;
        insDeplacerCopier: InstructionDeplacerCopier;
        joueur: Objet;
        cuisine: Lieu;
        sdb: Lieu;
        chambre: Lieu;
    }

    const contexte = {} as ThisContext;

    beforeEach(() => {

        contexte.jeu = new Jeu();
        contexte.eju = new ElementsJeuUtils(contexte.jeu, false);
        contexte.insDeplacerCopier = new InstructionDeplacerCopier(contexte.jeu, contexte.eju, false);

        // définir le joueur
        contexte.joueur = new Objet(1, "joueur", PhraseUtils.getGroupeNominalDefini("Le joueur", false), ClassesRacines.Special, 1, Genre.m, Nombre.s);
        contexte.jeu.joueur = contexte.joueur;

        // définition des lieux
        contexte.cuisine = new Lieu(2, // id
        'cuisine', // nom
        PhraseUtils.getGroupeNominalDefini("La cuisine", false), // intitule
        "Cuisine", // titre
        ClassesRacines.Lieu);
        contexte.sdb = new Lieu(3, // id
        'salle de bain', // nom
        PhraseUtils.getGroupeNominalDefini("La salle de bain", false), // intitule
        "Salle de bain", // titre
        ClassesRacines.Lieu);
        contexte.chambre = new Lieu(4, // id
        'chambre', // nom
        PhraseUtils.getGroupeNominalDefini("La chambre à coucher", false), // intitule
        "Chambre", // titre
        ClassesRacines.Lieu);
        // ajouter les lieux au jeu
        contexte.jeu.lieux.push(contexte.cuisine);
        contexte.jeu.lieux.push(contexte.sdb);
        contexte.jeu.lieux.push(contexte.chambre);
        // La salle de bain est au nord de la cuisine
        contexte.cuisine.voisins.push(new Voisin(contexte.sdb.id, contexte.sdb.classe.nom, ELocalisation.nord));
        // La cuisine est au sud de la salle de bain.
        contexte.sdb.voisins.push(new Voisin(contexte.cuisine.id, contexte.cuisine.classe.nom, ELocalisation.sud));
        // La chambre est au sud de la salle de bain
        contexte.sdb.voisins.push(new Voisin(contexte.chambre.id, contexte.chambre.classe.nom, ELocalisation.sud));
        // La salle de bain est au nord de la chambre
        contexte.chambre.voisins.push(new Voisin(contexte.sdb.id, contexte.sdb.classe.nom, ELocalisation.nord));
        // positionner le joueur dans la cuisine
        contexte.jeu.joueur.position = new PositionObjet(PrepositionSpatiale.dans, EClasseRacine.lieu, contexte.cuisine.id);
        contexte.eju.majPresenceDesObjets();
        contexte.eju.majAdjacenceLieux();
    });



    it('[F039-T001] vérifier accessibilité lieux', () => {

        // vérifier que les lieux sont accessibles
        // cuisine est accessible (le joueur est dedans)
        expect(contexte.eju.estLieuAccessible(contexte.cuisine)).toBe(true);
        // sdb est accessible (à coté de la cuisine)
        expect(contexte.eju.estLieuAccessible(contexte.sdb)).toBe(true);
        // chambre n'est pas accessible (trop loin de la cuisine)
        expect(contexte.eju.estLieuAccessible(contexte.chambre)).toBe(false);
    });

    it('[F039-T002] vérifier getLieuxVoisinsVisibles()', () => {

        // cuisine à coté de sdb
        let resultats = contexte.eju.getLieuxVoisinsVisibles(contexte.cuisine);
        expect(resultats.length).toBe(1);
        expect(resultats[0].id).toBe(contexte.sdb.id);

        // sdb à coté de cuisine et chambre
        resultats = contexte.eju.getLieuxVoisinsVisibles(contexte.sdb);
        expect(resultats.length).toBe(2);
        expect(resultats.some(x => x.id == contexte.cuisine.id)).toBe(true);
        expect(resultats.some(x => x.id == contexte.chambre.id)).toBe(true);
        expect(resultats.some(x => x.id == contexte.sdb.id)).toBe(false);
    });

    it('[F039-T003] vérifier trouverLieu', () => {
        // trouver la cuisine
        let resultats = contexte.eju.trouverLieuSurIntituleAvecScore(contexte.cuisine.intitule, false);
        expect(resultats[1].length).toBe(1);
        expect(resultats[1][0]).toBe(contexte.cuisine);
        // trouver la salle de bain
        resultats = contexte.eju.trouverLieuSurIntituleAvecScore(contexte.sdb.intitule, false);
        expect(resultats[1].length).toBe(1);
        expect(resultats[1][0]).toBe(contexte.sdb);
        // trouver la chambre à coucher
        resultats = contexte.eju.trouverLieuSurIntituleAvecScore(contexte.chambre.intitule, false);
        expect(resultats[1].length).toBe(1);
        expect(resultats[1][0]).toBe(contexte.chambre);
    });

    it('[F039-T004] vérifier getLieuObjet(joueur)', () => {
        let lieuId = contexte.eju.getLieuObjet(contexte.joueur);
        expect(lieuId).toEqual(contexte.cuisine.id);
    });

    it('[F039-T005] vérifier exectuterDeplacerObjetVersDestination(joueur)', () => {

        // le joueur est dans la cuisine
        let lieuId = contexte.eju.getLieuObjet(contexte.joueur);
        expect(lieuId).toEqual(contexte.cuisine.id);

        let resultat = contexte.insDeplacerCopier.executerDeplacerObjetVersDestination(contexte.joueur, "dans", contexte.chambre, 1);
        expect(resultat.succes).toEqual(true);

        // le joueur est à présent dans la chambre
        lieuId = contexte.eju.getLieuObjet(contexte.joueur);
        expect(lieuId).toEqual(contexte.chambre.id);
    });

});
