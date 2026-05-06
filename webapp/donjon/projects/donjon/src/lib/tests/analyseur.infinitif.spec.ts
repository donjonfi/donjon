import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Epressions régulières − infinitifs (verbes)', () => {

  // VERBE À L’INFINITIF
  // - verbe(1)

  it('[F005-T001] Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('[F005-T002] Verbe infinitif :  « partir »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("partir");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("partir"); // infinitif
  });

  it('[F005-T003] Verbe infinitif :  « boire »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("boire");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("boire"); // infinitif
  });

  it('[F005-T004] Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('[F005-T005] Verbe infinitif :  « se brosser »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("se brosser");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("se brosser"); // infinitif
  });

  it('[F005-T006] Verbe infinitif :  « s’égosiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s’égosiller");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("s’égosiller"); // infinitif
  })

  it('[F005-T007] Verbe infinitif :  « s\'éveiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s'éveiller");
    expect(result).toBeTruthy();
    expect(result[1]).toEqual("s'éveiller"); // infinitif
  });

  it('[F005-T008] Verbe infinitif : « oiseau » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("oiseau");
    expect(result).toBeFalsy();
  });

  it('[F005-T009] Verbe infinitif : « un boucher » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("un boucher");
    expect(result).toBeFalsy();
  });

  it('[F005-T010] Verbe infinitif : « l’armurier » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("l’armurier");
    expect(result).toBeFalsy();
  });

});
