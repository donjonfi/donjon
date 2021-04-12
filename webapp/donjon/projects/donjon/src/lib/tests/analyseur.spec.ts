import { EClasseRacine } from "../models/commun/constantes";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";
import { ContexteAnalyse } from "../models/compilateur/contexte-analyse";
import { Definition } from "../models/compilateur/definition";
import { PositionSujetString } from "../models/compilateur/position-sujet";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";
import { Analyseur } from "../utils/compilation/analyseur/analyseur";
import { AnalyseurElementPosition } from "../utils/compilation/analyseur/analyseur.element.position";
import { AnalyseurElementSimple } from "../utils/compilation/analyseur/analyseur.element.simple";
import { AnalyseurType } from "../utils/compilation/analyseur/analyseur.type";
import { AnalyseurUtils } from "../utils/compilation/analyseur/analyseur.utils";
import { Compilateur } from "../utils/compilation/compilateur";

describe('Analyseur − Définition de nouveaux éléments', () => {

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
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
        // tester l’analyse spécifique
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
        AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBeNull(); // desrcription pas définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(0); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Élément sans pos: « Paris (f) est un lieu gris. "Vous êtes dans Paris.". »', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            'Paris (f) est un lieu gris. "Vous êtes dans Paris.".'
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(2); // 2 morceaux
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
        // tester l’analyse spécifique
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
        AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBe('Vous êtes dans Paris.'); // desrcription définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(1); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Élément sans pos: « La château du comte est un lieu au nord du village. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "La château du comte est un lieu au nord du village."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
        // tester l’analyse spécifique
        const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Élément sans pos: « Un lutin est une personne. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Un lutin est une personne."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        // tester l’analyse spécifique
        const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

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
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
        // tester l’analyse spécifique
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
        expect(el.positionString).toEqual(new PositionSujetString('château du comte', 'village', 'au nord du ')); // position
        AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
        expect(el.description).toBeNull(); // desrcription pas définie
        expect(el.capacites).toHaveSize(0); // aucune capacité
        expect(el.attributs).toHaveSize(0); // aucun attribut
        expect(el.proprietes).toHaveSize(0); // aucune propriété
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });


    it('Élément pos: « L’abri est un lieu sombre. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "L’abri est un lieu sombre."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
        // tester l’analyse spécifique
        const resultat = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse);
        expect(resultat).toBeNull(); // résultat PAS trouvé.
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });
});

describe('Analyseur − Définition de nouveaux types', () => {


    // =========================================================
    // NOUVEAUX TYPES
    // =========================================================

    it('Nouveau type : « Un meuble est un objet. » ', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Un meuble est un objet."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        // tester l’analyse spécifique
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.type); // trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // nouveau type ajouté
        expect(ctxAnalyse.typesUtilisateur.has('meuble')).toBeTrue(); // nouveau type retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('meuble').intitule).toBe('meuble'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('meuble').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('meuble').typeParent).toBe('objet'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('meuble').etats).toHaveSize(0); // aucun attribut spécifique
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Nouveau type : « Une fée est une personne magique. » ', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Une fée est une personne magique."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        // tester l’analyse spécifique
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.type); // trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // nouveau type ajouté
        expect(ctxAnalyse.typesUtilisateur.has('fée')).toBeTrue(); // nouveau type retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('fée').intitule).toBe('fée'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('fée').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('fée').typeParent).toBe('personne'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('fée').etats).toHaveSize(1); // attribut spécifique défini
        expect(ctxAnalyse.typesUtilisateur.get('fée').etats[0]).toBe('magique'); // attribut spécifique
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Nouveau type : « Une fée est magique. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Une fée est magique."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
        // tester l’analyse spécifique      
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.aucun); // pas trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(0); // pas de nouveau type ajouté
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });


    it('Nouveau type : « La fée est une personne. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "La fée est une personne."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
        // tester l’analyse spécifique
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.aucun); // pas trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(0); // pas de nouveau type ajouté
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    // =========================================================
    // PRÉCISIONS TYPES
    // =========================================================

    it('Précision type : « Une statue est fixée. » ', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Une statue est fixée."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
        // tester l’analyse spécifique
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerPrecisionType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.precisionType); // trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // nouveau type ajouté
        expect(ctxAnalyse.typesUtilisateur.has('statue')).toBeTrue(); // nouveau type retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('statue').intitule).toBe('statue'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('statue').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('statue').typeParent).toBe('objet'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('statue').etats).toHaveSize(1); // attribut spécifique
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Précision type : « Un lutin est bavard, farceur et petit. » ', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Un lutin est bavard, farceur et petit."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
        // tester l’analyse spécifique
        // -> raz contexte
        ctxAnalyse = new ContexteAnalyse();
        // -> pré-remplir avec le type « lutin » qui hérite de personne
        ctxAnalyse.typesUtilisateur.set('lutin', new Definition('lutin', 'personne', Nombre.s, ['gentil']));
        const resultat = AnalyseurType.testerPrecisionType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.precisionType); // trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // pas de nouveau type ajouté
        expect(ctxAnalyse.typesUtilisateur.has('lutin')).toBeTrue(); // type existant retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').intitule).toBe('lutin'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('lutin').typeParent).toBe('personne'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('lutin').etats).toHaveSize(4); // attributs spécifiques (1 + 3)
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Précision type : Type défini 2x doit générer erreur', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = Compilateur.convertirCodeSourceEnPhrases(
            "Un lutin est une personne farceuse. Un lutin est une créature-magique aimable."
        );
        expect(phrases).toHaveSize(2); // 2 phrases
        // tester l’analyse complète
        expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        expect(Analyseur.analyserPhrase(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // 1 nouveau type ajouté (et pas 2)
        expect(ctxAnalyse.typesUtilisateur.has('lutin')).toBeTrue(); // type existant retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').intitule).toBe('lutin'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('lutin').typeParent).toBe('créature-magique'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('lutin').etats).toHaveSize(2); // attributs spécifiques (1+1)
        expect(ctxAnalyse.erreurs).toHaveSize(1); // 1 erreur a été générée
    });

});