
import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Synonymes', () => {

    it('Attribut ele : « interpréter Alain comme le capitaine » ', () => {
        const result = ExprReg.xSynonymes.exec('interpréter Alain comme le capitaine');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('Alain'); // synonymes
        expect(result[2]).toEqual('le capitaine'); // original
    });

    it('Attribut ele : « interpréter Alain et le marin comme l’apprenti du village » ', () => {
        const result = ExprReg.xSynonymes.exec('interpréter Alain et le marin comme l’apprenti du village');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('Alain et le marin'); // synonymes
        expect(result[2]).toEqual('l’apprenti du village'); // original
    });

    it('Attribut ele : « interpréter le marin, Alain et le boss comme le capitaine crochet » ', () => {
        const result = ExprReg.xSynonymes.exec('interpréter le marin, Alain et le boss comme le capitaine crochet');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('le marin, Alain et le boss'); // synonymes
        expect(result[2]).toEqual('le capitaine crochet'); // original
    });

    it('Attribut ele : « Interpréter marcher comme se déplacer » ', () => {
        const result = ExprReg.xSynonymes.exec('Interpréter marcher comme se déplacer');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('marcher'); // synonymes
        expect(result[2]).toEqual('se déplacer'); // original
    });

    it('Attribut ele : « interpréter marcher, courrir, sauter, s’étirer et danser comme s’exercer » ', () => {
        const result = ExprReg.xSynonymes.exec('interpréter marcher, courrir, sauter, s’étirer et danser comme s’exercer');
        expect(result).not.toEqual(null);
        expect(result[1]).toEqual('marcher, courrir, sauter, s’étirer et danser'); // synonymes
        expect(result[2]).toEqual('s’exercer'); // original
    });

    // => Pas contrôlé dans l’expression régulière mais devra l’être par l’analyseur
    // it('Attribut ele : « interpréter courir comme le pied de bois » (💥) ', () => {
    //     const result = ExprReg.xSynonymes.exec('interpréter courir comme le pied de bois');
    //     expect(result).toEqual(null);
    // });

});