import { EClasseRacine } from "../models/commun/constantes";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";
import { ContexteAnalyse } from "../models/compilateur/contexte-analyse";
import { PositionSujetString } from "../models/compilateur/position-sujet";
import { Analyseur } from "../utils/compilation/analyseur/analyseur";
import { AnalyseurElementPosition } from "../utils/compilation/analyseur/analyseur.element.position";
import { AnalyseurElementSimple } from "../utils/compilation/analyseur/analyseur.element.simple";
import { Compilateur } from "../utils/compilation/compilateur";

describe('Analyseur', () => {

    // =========================================================
    // ÉLÉMENTS SANS POSITION
    // =========================================================

    it('Élément sans pos: « La cuisine est un lieu. »', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "La cuisine est un lieu."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse); // analyser phrase
        expect(el).not.toBeNull(); // élément trouvé
        ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
        expect(el.determinant).toEqual('la '); // déterminant
        expect(el.nom).toEqual('cuisine'); // nom
        expect(el.epithete).toBeUndefined(); // épithète pas défini
        expect(el.genre).toEqual(Genre.f); // genre
        expect(el.nombre).toEqual(Nombre.s); // nombre
        expect(el.quantite).toEqual(1); // quantité
        expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
        expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
        expect(el.positionString).toBeNull(); // position pas définie
        Analyseur.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBeNull(); // desrcription pas définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(0); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
    });

    it('Élément sans pos: « Paris (f) est un lieu gris. "Vous êtes dans Paris.". »', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            'Paris (f) est un lieu gris. "Vous êtes dans Paris.".'
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(2); // 2 morceaux
        const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse); // analyser phrase
        expect(el).not.toBeNull(); // élément trouvé
        ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
        expect(el.determinant).toBeNull(); // déterminant
        expect(el.nom).toEqual('Paris'); // nom
        expect(el.epithete).toBeUndefined(); // épithète pas défini
        expect(el.genre).toEqual(Genre.f); // genre
        expect(el.nombre).toEqual(Nombre.s); // nombre
        expect(el.quantite).toEqual(1); // quantité
        expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
        expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
        expect(el.positionString).toBeNull(); // position pas définie
        Analyseur.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBe('Vous êtes dans Paris.'); // desrcription définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(1); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
    });

    it('Élément sans pos: « La château du comte est un lieu au nord du village. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "La château du comte est un lieu au nord du village."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
    });

    it('Élément sans pos: « Un lutin est une personne. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Un lutin est une personne."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
    });


    // =========================================================
    // ÉLÉMENT AVEC POSITION
    // =========================================================


    it('Élément pos: « Le château du comte est un lieu au nord du village. »', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Le château du comte est un lieu au nord du village."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        const el = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse); // analyser phrase
        expect(el).not.toBeNull(); // élément trouvé
        ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
        expect(el.determinant).toEqual('le '); // déterminant
        expect(el.nom).toEqual('château du comte'); // nom de l’élément
        expect(el.epithete).toBeUndefined(); // épithète pas défini
        expect(el.genre).toEqual(Genre.m); // genre
        expect(el.nombre).toEqual(Nombre.s); // nombre
        expect(el.quantite).toEqual(1); // quantité
        expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
        expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
        expect(el.positionString).not.toBeNull(); // position définie
        expect(el.positionString).toEqual(new PositionSujetString('château du comte',  'village', 'au nord du ')); // position
        Analyseur.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBeNull(); // desrcription pas définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(0); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
    });

    
    it('Élément pos: « L’abri est un lieu sombre. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "L’abri est un lieu sombre."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        const resultat = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
    });


});