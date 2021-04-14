import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − États (attributs) d’un élément jeu', () => {

    it('Attribut ele : « Le bateau est vieux et troué » ', () => {
        const result = ExprReg.xElementSimpleAttribut.exec('Le bateau est vieux et troué');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('Le '); // déterminant
        expect(result[2]).toEqual('bateau'); // nom
        expect(result[3]).toBeUndefined(); // épithète
        expect(result[4]).toBeUndefined; // (féminin, autre forme)
        expect(result[5]).toEqual('vieux et troué'); // attributs
    });

    it('Attribut ele : « Julien est grand » ', () => {
        const result = ExprReg.xElementSimpleAttribut.exec('Julien est grand');
        expect(result).not.toBeNull();
        expect(result[1]).toBeUndefined(); // déterminant
        expect(result[2]).toEqual('Julien'); // nom
        expect(result[3]).toBeUndefined(); // épithète
        expect(result[4]).toBeUndefined; // (féminin, autre forme)
        expect(result[5]).toEqual('grand'); // attributs
    });

    it('Attribut ele : « L’aliance du lac rouge (f) est petite, fragile, vieille et dorée » ', () => {
        const result = ExprReg.xElementSimpleAttribut.exec('L’aliance du lac rouge (f, aliances du lac) est petite, fragile, vieille et dorée');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('L’'); // déterminant
        expect(result[2]).toEqual('aliance du lac'); // nom
        expect(result[3]).toEqual('rouge'); // épithète
        expect(result[4]).toEqual('(f, aliances du lac)'); // (féminin, autre forme)
        expect(result[5]).toEqual('petite, fragile, vieille et dorée'); // attributs
    });

    it('Attribut ele : « Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides » ', () => {
        const result = ExprReg.xElementSimpleAttribut.exec('Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('Les '); // déterminant
        expect(result[2]).toEqual('pommes de terre'); // nom
        expect(result[3]).toEqual('pourries'); // épithète
        expect(result[4]).toEqual('(f, pomme de terre)'); // (féminin, autre forme)
        expect(result[5]).toEqual('mauves, odorantes et humides'); // attributs
    });

    it('Attribut élé : « Sa réaction est "Bonjour !" » (💥)', () => {
        const result = ExprReg.xElementSimpleAttribut.exec('Sa réaction est "Bonjour !"');
        expect(result).toEqual(null);
    });

});
