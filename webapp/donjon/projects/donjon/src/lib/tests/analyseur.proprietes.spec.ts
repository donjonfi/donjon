import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Propriétes/Réactions d’un élément jeu', () => {

    it('Prop. élé : « Son texte est "Voici ce qui est écrit" »', () => {
        const result = ExprReg.xProprieteReaction.exec('Son texte est "Voici ce qui est écrit"');
        expect(result).not.toEqual(null);
        expect(result[3]).toBeUndefined // élément jeu
        expect(result[1]).toEqual('texte'); // propriété
        expect(result[6]).toEqual('est'); // est/vaut
        expect(result[7]).toEqual('"Voici ce qui est écrit"'); // valeur
    });

    it('Prop. élé : « Sa valeur vaut 3 »', () => {
        const result = ExprReg.xProprieteReaction.exec('Sa valeur vaut 3');
        expect(result).not.toEqual(null);
        expect(result[3]).toBeUndefined // élément jeu
        expect(result[1]).toEqual('valeur'); // propriété
        expect(result[6]).toEqual('vaut'); // est/vaut
        expect(result[7]).toEqual('3'); // valeur
    });

    it('Prop. élé : « La description du bateau est "C’est un fameux rafio" » ', () => {
        const result = ExprReg.xProprieteReaction.exec('La description du bateau est "C’est un fameux rafio"');
        expect(result).not.toEqual(null);
        expect(result[3]).toEqual('bateau'); // élément jeu
        expect(result[2]).toEqual('description'); // propriété
        expect(result[6]).toEqual('est'); // est/vaut
        expect(result[7]).toEqual('"C’est un fameux rafio"'); // valeur
    });

    it('Prop. élé : « La réaction du capitaine du bateau concernant le trésor est "Vous ne l’aurez pas !" » ', () => {
        const result = ExprReg.xProprieteReaction.exec('La réaction du capitaine du bateau concernant le trésor est "Vous ne l’aurez pas !"');
        expect(result).not.toEqual(null);
        expect(result[3]).toEqual('capitaine du bateau'); // élément jeu
        expect(result[2]).toEqual('réaction'); // propriété
        expect(result[4]).toEqual('concernant'); // concernant/au sujet
        expect(result[5]).toEqual('trésor'); // sujets
        expect(result[6]).toEqual('est'); // est
        expect(result[7]).toEqual('"Vous ne l’aurez pas !"'); // valeur
    });

    it('Prop. élé : « La réaction de la cavalière hantée au sujet des bois, de la prairie ou des fleurs est dire "C’est naturel"; dire "Quoi d’autre ?" » ', () => {
        const result = ExprReg.xProprieteReaction.exec('La réaction de la cavalière hantée au sujet des bois, de la prairie ou des fleurs est dire "C’est naturel"; dire "Quoi d’autre ?"');
        expect(result).not.toEqual(null);
        expect(result[3]).toEqual('cavalière hantée'); // élément jeu
        expect(result[2]).toEqual('réaction'); // propriété
        expect(result[4]).toEqual('au sujet'); // concernant/au sujet
        expect(result[5]).toEqual('bois, de la prairie ou des fleurs'); // sujets
        expect(result[6]).toEqual('est'); // est
        expect(result[7]).toEqual('dire "C’est naturel"; dire "Quoi d’autre ?"'); // valeur
    });

    it('Prop. élé : « Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !" » ', () => {
        const result = ExprReg.xProprieteReaction.exec('Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !"');
        expect(result).not.toEqual(null);
        expect(result[3]).toBeUndefined // élément jeu
        expect(result[1]).toEqual('réaction'); // propriété
        expect(result[4]).toEqual('concernant'); // concernant/au sujet
        expect(result[5]).toEqual('pomme'); // sujets
        expect(result[6]).toEqual('est'); // est
        expect(result[7]).toEqual('changer le joueur possède la pomme; dire "Je vous la donne !"'); // valeur
    });

    it('Prop. élé : « Sa réaction est "Bonjour !" » ', () => {
        const result = ExprReg.xProprieteReaction.exec('Sa réaction est "Bonjour !"');
        expect(result).not.toEqual(null);
        expect(result[3]).toBeUndefined // élément jeu
        expect(result[1]).toEqual('réaction'); // propriété
        expect(result[6]).toEqual('est'); // est
        expect(result[7]).toEqual('"Bonjour !"'); // valeur
    });

});
