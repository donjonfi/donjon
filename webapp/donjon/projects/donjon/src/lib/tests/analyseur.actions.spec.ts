import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Epressions régulières − Verbes', () => {

    // VERBE À L’INFINITIF
    // - verbe(1)
  
    it('Verbe infinitif :  « marcher »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("marcher");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("marcher"); // infinitif
    });
  
    it('Verbe infinitif :  « partir »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("partir");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("partir"); // infinitif
    });
  
    it('Verbe infinitif :  « boire »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("boire");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("boire"); // infinitif
    });
  
    it('Verbe infinitif :  « marcher »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("marcher");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("marcher"); // infinitif
    });
  
    it('Verbe infinitif :  « se brosser »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("se brosser");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("se brosser"); // infinitif
    });
  
    it('Verbe infinitif :  « s’égosiller »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("s’égosiller");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("s’égosiller"); // infinitif
    })
  
    it('Verbe infinitif :  « s\'éveiller »', () => {
      const result = ExprReg.xVerbeInfinitif.exec("s'éveiller");
      expect(result).not.toEqual(null);
      expect(result[1]).toEqual("s'éveiller"); // infinitif
    });
  
    it('Verbe infinitif : « oiseau » (💥)', () => {
      const result = ExprReg.xVerbeInfinitif.exec("oiseau");
      expect(result).toEqual(null);
    });
  
    it('Verbe infinitif : « un boucher » (💥)', () => {
      const result = ExprReg.xVerbeInfinitif.exec("un boucher");
      expect(result).toEqual(null);
    });
  
  
  });