import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Epressions régulières − infinitifs (verbes)', () => {

  // VERBE À L’INFINITIF
  // - verbe(1)

  it('Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('Verbe infinitif :  « partir »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("partir");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("partir"); // infinitif
  });

  it('Verbe infinitif :  « boire »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("boire");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("boire"); // infinitif
  });

  it('Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('Verbe infinitif :  « se brosser »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("se brosser");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("se brosser"); // infinitif
  });

  it('Verbe infinitif :  « s’égosiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s’égosiller");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("s’égosiller"); // infinitif
  })

  it('Verbe infinitif :  « s\'éveiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s'éveiller");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("s'éveiller"); // infinitif
  });

  it('Verbe infinitif : « oiseau » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("oiseau");
    expect(result).toBeFalsy();
  });

  it('Verbe infinitif : « un boucher » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("un boucher");
    expect(result).toBeFalsy();
  });

  it('Verbe infinitif : « l’armurier » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("l’armurier");
    expect(result).toBeFalsy();
  });

});
