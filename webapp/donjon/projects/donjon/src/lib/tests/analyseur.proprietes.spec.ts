import { ExprReg } from "../utils/compilation/expr-reg";

describe('Epressions régulières − Propriétes d’un élément jeu', () => {

    it('Prop. élé : « La description du bateau est "C’est un fameux rafio" » ', () => {
        const result = ExprReg.xPropriete.exec('La description du bateau est "C’est un fameux rafio"');
        expect(result).not.toEqual(null);
        expect(result[2]).toEqual('description'); // propriété
        expect(result[3]).toEqual('bateau'); // élément jeu concerné
        expect(result[6]).toEqual('est'); // est/vaut
        expect(result[7]).toEqual('"C’est un fameux rafio"'); // valeur
    });

});
