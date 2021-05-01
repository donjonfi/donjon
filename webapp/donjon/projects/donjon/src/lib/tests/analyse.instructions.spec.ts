import { ExprReg } from "../utils/compilation/expr-reg";
import { GroupeNominal } from "../models/commun/groupe-nominal";
import { PhraseUtils } from "../utils/commun/phrase-utils";

describe('Epressions régulières − Instruction: verbe + complément', () => {

    // Instruction : verbe + complément

    it('Phrase:  « continuer l’action »', () => {
        const result = ExprReg.xInstruction.exec("continuer l’action");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("continuer"); // verbe
        expect(result[2]).toEqual("l’action"); // complément
    });

    it('Phrase:  « changer le joueur possède la canne à pèche »', () => {
        const result = ExprReg.xInstruction.exec("changer le joueur possède la canne à pèche");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("changer"); // verbe
        expect(result[2]).toEqual("le joueur possède la canne à pèche"); // complément
    });

    it('Phrase:  « dire  »', () => {
        const result = ExprReg.xInstruction.exec("dire ");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("dire"); // verbe
        expect(result[2]).toBeUndefined(); // complément
    });

    it('Phrase:  « dire "Bonjour !" »', () => {
        const result = ExprReg.xInstruction.exec("dire \"Bonjour !\"");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("dire"); // verbe
        expect(result[2]).toEqual("\"Bonjour !\""); // complément
    });

    it('Phrase: « changer le score augmente de 1 »', () => {
        const result = ExprReg.xInstruction.exec("changer le score augmente de 1");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("changer"); // verbe
        expect(result[2]).toEqual("le score augmente de 1"); // complément
    });

    it('Phrase:  « la pomme est verte » (💥)', () => {
        const result = ExprReg.xInstruction.exec("la pomme est verte");
        expect(result).toBeNull();
    });
    
});

describe('Epressions régulières − Complément instruction: Phrase simple avec un verbe conjugé', () => {

    // [le|la|les|...]\(1) (nom|ceci|cela)\(2) [attribut]\(3) [ne|n’|n'] ([se] verbe conjugé)(4) [pas|plus]\(5) complément(6).

    it('Phrase:  « la porte secrète n’est plus fermée »', () => {
        const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("la porte secrète n’est plus fermée");
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual("la "); // déterminant
        expect(result[2]).toEqual("porte"); // nom
        expect(result[3]).toEqual("secrète"); // attribut
        expect(result[4]).toEqual("est"); // verbe conjugué
        expect(result[5]).toEqual("plus"); // négation
        expect(result[6]).toEqual("fermée"); // complément
    });

    it('Phrase:  « la canne à pèche rouge est ouverte »', () => {
        const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("la canne à pèche rouge est ouverte");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("la "); // déterminant
        expect(result[2]).toEqual("canne à pèche"); // nom
        expect(result[3]).toEqual("rouge"); // attribut
        expect(result[4]).toEqual("est"); // verbe conjugué
        expect(result[5]).toBeUndefined() // négation
        expect(result[6]).toEqual("ouverte"); // complément
    });

    it('Phrase:  « ceci n’est plus vide »', () => {
        const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("ceci n’est plus vide");
        expect(result).not.toBeNull();
        expect(result[1]).toBeUndefined(); // déterminant
        expect(result[2]).toEqual("ceci"); // nom
        expect(result[3]).toBeUndefined(); // attribut
        expect(result[4]).toEqual("est"); // verbe conjugué
        expect(result[5]).toEqual("plus"); // négation
        expect(result[6]).toEqual("vide"); // complément
    });

    it('Phrase:  « le score augmente de 1 »', () => {
        const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("le score augmente de 1");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual('le '); // déterminant
        expect(result[2]).toEqual("score"); // nom
        expect(result[3]).toBeUndefined(); // attribut
        expect(result[4]).toEqual("augmente"); // verbe conjugué
        expect(result[5]).toBeUndefined(); // négation
        expect(result[6]).toEqual("de 1"); // complément
    });

    it('Phrase:  « l’action » (💥)', () => {
        const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("l’action");
        expect(result).toEqual(null);
    });
    
});

describe('Epressions régulières − Complément instruction (1 ou 2 éléments)', () => {

    // => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).

    it('Complément:  « l\'action »', () => {
        const result = ExprReg.xComplementInstruction1ou2elements.exec("l'action");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("l'"); // déterminant 1
        expect(result[2]).toEqual("action"); // nom 1
        expect(result[3]).toBeUndefined(); // épithète 1
        expect(result[4]).toBeUndefined(); // préposition
        expect(result[5]).toBeUndefined(); // déterminant 2
        expect(result[6]).toBeUndefined(); // nom 2
        expect(result[7]).toBeUndefined(); // épithète 2
    });

    it('Complément:  « tomate »', () => {
        const result = ExprReg.xComplementInstruction1ou2elements.exec("tomate");
        expect(result).not.toBeNull();
        expect(result[1]).toBeUndefined(); // déterminant 1
        expect(result[2]).toEqual("tomate"); // nom 1
        expect(result[3]).toBeUndefined(); // épithète 1
        expect(result[4]).toBeUndefined(); // préposition
        expect(result[5]).toBeUndefined(); // déterminant 2
        expect(result[6]).toBeUndefined(); // nom 2
        expect(result[7]).toBeUndefined(); // épithète 2
    });

    it('Complément:  « le trésor vers le joueur »', () => {
        const result = ExprReg.xComplementInstruction1ou2elements.exec("le trésor vers le joueur");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("le "); // déterminant 1
        expect(result[2]).toEqual("trésor"); // nom 1
        expect(result[3]).toBeUndefined(); // épithète 1
        expect(result[4]).toEqual("vers"); // préposition
        expect(result[5]).toEqual("le "); // déterminant 2
        expect(result[6]).toEqual("joueur"); // nom 2
        expect(result[7]).toBeUndefined(); // épithète 2
    });

    
    it('Complément:  « l’arc à flèches rouillé avec la flèche rouge »', () => {
        const result = ExprReg.xComplementInstruction1ou2elements.exec("l’arc à flèches rouillé avec la flèche rouge");
        expect(result).not.toBeNull();
        expect(result[1]).toEqual("l’"); // déterminant 1
        expect(result[2]).toEqual("arc à flèches"); // nom 1
        expect(result[3]).toEqual("rouillé"); // épithète 1
        expect(result[4]).toEqual("avec"); // préposition
        expect(result[5]).toEqual("la "); // déterminant 2
        expect(result[6]).toEqual("flèche"); // nom 2
        expect(result[7]).toEqual("rouge"); // épithète 2
    });

    it('Complément:  « manger le biscuit » (💥)', () => {
        const result = ExprReg.xComplementInstruction1ou2elements.exec("manger le biscuit");
        expect(result).toBeNull();
    });

});

describe('PhrasesUtils − decomposerInstruction', () => {

    // TYPE UTILISATEUR > NOUVEAU TYPE
    // - un/une(1) nouveauType(2) est un/une typeParent(3) {attributs}(4)

    it('Instruction :  « continuer l’action »', () => {
        const result = PhraseUtils.decomposerInstruction("continuer l’action");
        expect(result).not.toBeNull();
        expect(result.infinitif).toEqual("continuer");
        expect(result.sujet.determinant).toEqual("l’");
        expect(result.sujet.nom).toEqual("action");
        expect(result.sujet).toEqual(new GroupeNominal("l’", "action"));
        expect(result.complement1).toBeNull();
        expect(result.sujetComplement1).toBeUndefined();
        expect(result.sujetComplement2).toBeUndefined();
        expect(result.sujetComplement3).toBeUndefined();
        expect(result.sujetComplement4).toBeUndefined();
    });

    
    it('Instruction :  « changer le joueur possède la canne à pèche »', () => {
        const result = PhraseUtils.decomposerInstruction("changer le joueur possède la canne à pèche");
        expect(result).not.toBeNull();
        expect(result.infinitif).toEqual("changer");
        expect(result.sujet).toEqual(new GroupeNominal("le ", "joueur"));
        expect(result.verbe).toEqual("possède");
        expect(result.complement1).toBe("la canne à pèche");
        expect(result.sujetComplement1).toEqual(new GroupeNominal("la ", "canne à pèche"));
        expect(result.sujetComplement2).toBeUndefined();
        expect(result.sujetComplement3).toBeUndefined();
        expect(result.sujetComplement4).toBeUndefined();
    });
});