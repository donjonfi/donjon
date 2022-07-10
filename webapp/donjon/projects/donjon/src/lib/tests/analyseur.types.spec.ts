import { AnalyseurBeta } from "../utils/compilation/analyseur/analyseur-beta";
import { AnalyseurType } from "../utils/compilation/analyseur/analyseur.type";
import { CompilateurBeta } from "../utils/compilation/compilateur-beta";
import { ContexteAnalyse } from "../models/compilateur/contexte-analyse";
import { Definition } from "../models/compilateur/definition";
import { ExprReg } from "../utils/compilation/expr-reg";
import { Nombre } from "../models/commun/nombre.enum";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
describe('Epressions régulières − Nouveaux types (classes)', () => {

    // TYPE UTILISATEUR > NOUVEAU TYPE
    // - un/une(1) nouveauType(2) est un/une typeParent(3) {attributs}(4)

    it('Nouveau type :  « Un meuble est un objet »', () => {
        const result = ExprReg.xNouveauType.exec("Un meuble est un objet");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("Un"); // déterminant
        expect(result[2]).toEqual("meuble"); // nouveau type
        expect(result[3]).toEqual("objet"); // type parent
        expect(result[4]).toBeUndefined(); // attribut(s)
    });

    it('Nouveau type :  « Un fruit est un objet mangeable, léger et périssable »', () => {
        const result = ExprReg.xNouveauType.exec("Un fruit est un objet mangeable, léger et périssable");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("Un"); // déterminant
        expect(result[2]).toEqual("fruit"); // nouveau type
        expect(result[3]).toEqual("objet"); // type parent
        expect(result[4]).toEqual("mangeable, léger et périssable"); // attribut(s)
    });

    it('Nouveau type :  « un lutin est une personne bavarde »', () => {
        const result = ExprReg.xNouveauType.exec("un lutin est une personne bavarde");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("un"); // déterminant
        expect(result[2]).toEqual("lutin"); // nouveau type
        expect(result[3]).toEqual("personne"); // type parent
        expect(result[4]).toEqual("bavarde"); // attribut(s)
    });


    it('Nouveau type :  « le lutin est une personne bavarde » (💥)', () => {
        const result = ExprReg.xNouveauType.exec("le lutin est une personne bavarde");
        expect(result).toEqual(null);
    });

    it('Nouveau type :  « Un meuble est fixé » (💥)', () => {
        const result = ExprReg.xNouveauType.exec("Un meuble est fixé");
        expect(result).toEqual(null);
    });

    // TYPE UTILISATEUR > PRÉCISION TYPE
    // - un/une(1) type(2) est {attributs}(3)

    it('Précision type :  « Un meuble est fixé »', () => {
        const result = ExprReg.xPrecisionType.exec("Un meuble est fixé");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("Un"); // déterminant
        expect(result[2]).toEqual("meuble"); // nouveau type
        expect(result[3]).toEqual("fixé"); // attribut(s)
    });

    it('Précision type :  « un chien est affectueux et poilu »', () => {
        const result = ExprReg.xPrecisionType.exec("un chien est affectueux et poilu");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("un"); // déterminant
        expect(result[2]).toEqual("chien"); // nouveau type
        expect(result[3]).toEqual("affectueux et poilu"); // attribut(s)
    });

    it('Précision type :  « Un lutin est bavard, peureux et farceur »', () => {
        const result = ExprReg.xPrecisionType.exec("Un lutin est bavard, peureux et farceur");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("Un"); // déterminant
        expect(result[2]).toEqual("lutin"); // nouveau type
        expect(result[3]).toEqual("bavard, peureux et farceur"); // attribut(s)
    });

    it('Précision type :  « Un meuble est un objet » (💥)', () => {
        const result = ExprReg.xPrecisionType.exec("Un meuble est un objet");
        expect(result).toEqual(null);
    });

    it('Précision type :  « Un fruit est un objet mangeable, léger et périssable » (💥)', () => {
        const result = ExprReg.xPrecisionType.exec("Un fruit est un objet mangeable, léger et périssable");
        expect(result).toEqual(null);
    });

    it('Précision type :  « Un lutin est une personne bavarde » (💥)', () => {
        const result = ExprReg.xPrecisionType.exec("Un lutin est une personne bavarde");
        expect(result).toEqual(null);
    });

    it('Précision type :  « Le meuble est fixé » (💥)', () => {
        const result = ExprReg.xPrecisionType.exec("Le meuble est fixé");
        expect(result).toEqual(null);
    });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] ANALYSEUR
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Analyseur − Nouveaux types (classes)', () => {

    // =========================================================
    // NOUVEAUX TYPES
    // =========================================================

    it('Nouveau type : « Un meuble est un objet. » ', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Un meuble est un objet."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
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
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Une fée est une personne magique."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        // tester l’analyse spécifique
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.type); // trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // nouveau type ajouté
        expect(ctxAnalyse.typesUtilisateur.has('fee')).toBeTrue(); // nouveau type retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('fee').intitule).toBe('fée'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('fee').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('fee').typeParent).toBe('personne'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('fee').etats).toHaveSize(1); // attribut spécifique défini
        expect(ctxAnalyse.typesUtilisateur.get('fee').etats[0]).toBe('magique'); // attribut spécifique
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });

    it('Nouveau type : « Une fée est magique. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Une fée est magique."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
        // tester l’analyse spécifique      
        ctxAnalyse = new ContexteAnalyse(); // (raz contexte)
        const resultat = AnalyseurType.testerNouveauType(phrases[0], ctxAnalyse);
        expect(resultat).toEqual(ResultatAnalysePhrase.aucun); // pas trouvé un nouveau type
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(0); // pas de nouveau type ajouté
        expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

    });


    it('Nouveau type : « La fée est une personne. » (💥)', () => {
        let ctxAnalyse = new ContexteAnalyse();
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "La fée est une personne."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
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
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Une statue est fixée."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
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
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Un lutin est bavard, farceur et petit."
        );
        expect(phrases).toHaveSize(1); // 1 phrase
        expect(phrases[0].morceaux).toHaveSize(1); // 1 morceau
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.precisionType);
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
        let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(
            "Un lutin est une personne farceuse. Un lutin est une créature-magique aimable."
        );
        expect(phrases).toHaveSize(2); // 2 phrases
        // tester l’analyse complète
        expect(AnalyseurBeta.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        expect(AnalyseurBeta.analyserPhrase(phrases[1], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
        expect(ctxAnalyse.typesUtilisateur).toHaveSize(1); // 1 nouveau type ajouté (et pas 2)
        expect(ctxAnalyse.typesUtilisateur.has('lutin')).toBeTrue(); // type existant retrouvé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').intitule).toBe('lutin'); // intitulé
        expect(ctxAnalyse.typesUtilisateur.get('lutin').nombre).toBe(Nombre.s); // nombre
        expect(ctxAnalyse.typesUtilisateur.get('lutin').typeParent).toBe('creature-magique'); // type parent
        expect(ctxAnalyse.typesUtilisateur.get('lutin').etats).toHaveSize(2); // attributs spécifiques (1+1)
        expect(ctxAnalyse.erreurs).toHaveSize(1); // 1 erreur a été générée
    });

});