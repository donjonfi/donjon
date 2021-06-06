import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] EXPRESSIONS RÉGULIÈRES
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




describe('Epressions régulières − Action', () => {

  // - verbe(1) [[à/de/…]\(2) ceci(3)[[ à/de/sur/…]\(4) cela(5)]] est une action[ qui concerne un|une|deux(6) typeObjetA(7) attributObjetA(8) [prioriteAttributObjetA(9)] [et un|une(10) typeObjetB(11) attributObjetB(12) [prioriteAttributObjetB(13)]]]
  
  it('Action :  « Jeter ceci est une action qui concerne un objet possédé »', () => {
    const result = ExprReg.xAction.exec("Jeter ceci est une action qui concerne un objet possédé");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Jeter"); // verbe
    expect(result[2]).toBeUndefined(); // adverbe ceci
    expect(result[3]).toEqual("ceci"); // ceci
    expect(result[4]).toBeUndefined(); // adverbe cela
    expect(result[5]).toBeUndefined(); // cela
    expect(result[6]).toEqual("un "); // un/une/deux
    expect(result[7]).toEqual("objet"); // classe A
    expect(result[8]).toEqual("possédé"); // attribut A
    expect(result[9]).toBeUndefined(); // attribut prioritaire A
    expect(result[10]).toBeUndefined(); // un
    expect(result[11]).toBeUndefined(); // classe B
    expect(result[12]).toBeUndefined(); // attribut B
    expect(result[13]).toBeUndefined(); // attribut prioritaire B
  });
  
  it('Action :  « Frapper sur ceci est une action qui concerne un objet accessible prioritairement disponible »', () => {
    const result = ExprReg.xAction.exec("Frapper sur ceci est une action qui concerne un objet accessible prioritairement disponible");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Frapper"); // verbe
    expect(result[2]).toEqual("sur"); // adverbe ceci
    expect(result[3]).toEqual("ceci"); // ceci
    expect(result[4]).toBeUndefined(); // adverbe cela
    expect(result[5]).toBeUndefined(); // cela
    expect(result[6]).toEqual("un "); // un/une/deux
    expect(result[7]).toEqual("objet"); // classe A
    expect(result[8]).toEqual("accessible"); // attribut A
    expect(result[9]).toEqual("disponible"); // attribut prioritaire A
    expect(result[10]).toBeUndefined(); // un
    expect(result[11]).toBeUndefined(); // classe B
    expect(result[12]).toBeUndefined(); // attribut B
    expect(result[13]).toBeUndefined(); // attribut prioritaire B
  });

  it('Action :  « prendre ceci avec cela est une action qui concerne un objet prioritairement disponible et un objet visible prioritairement possédé »', () => {
    const result = ExprReg.xAction.exec("prendre ceci avec cela est une action qui concerne un objet prioritairement disponible et un objet visible prioritairement possédé");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("prendre"); // verbe
    expect(result[2]).toBeUndefined(); // adverbe ceci
    expect(result[3]).toEqual("ceci"); // ceci
    expect(result[4]).toEqual("avec"); // adverbe cela
    expect(result[5]).toEqual("cela"); // cela
    expect(result[6]).toEqual("un "); // un/une/deux
    expect(result[7]).toEqual("objet"); // classe A
    expect(result[8]).toBeUndefined(); // attribut A
    expect(result[9]).toEqual("disponible"); // attribut prioritaire A
    expect(result[10]).toEqual("un "); // un
    expect(result[11]).toEqual("objet"); // classe B
    expect(result[12]).toEqual("visible"); // attribut B
    expect(result[13]).toEqual("possédé"); // attribut prioritaire B
  });

  
  it('Action :  « Appuyer sur ceci avec cela est une action qui concerne 2 objets accessibles prioritairement possédés »', () => {
    const result = ExprReg.xAction.exec("Appuyer sur ceci et cela est une action qui concerne deux objets accessibles prioritairement possédés");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Appuyer"); // verbe
    expect(result[2]).toEqual("sur"); // adverbe ceci
    expect(result[3]).toEqual("ceci"); // ceci
    expect(result[4]).toEqual("et"); // adverbe cela
    expect(result[5]).toEqual("cela"); // cela
    expect(result[6]).toEqual("deux "); // un/une/deux
    expect(result[7]).toEqual("objets"); // classe A + B
    expect(result[8]).toEqual("accessibles"); // attribut A + B
    expect(result[9]).toEqual("possédés"); // attribut prioritaire A + B
    expect(result[10]).toBeUndefined(); // un
    expect(result[11]).toBeUndefined(); // classe B
    expect(result[12]).toBeUndefined(); // attribut B
    expect(result[13]).toBeUndefined(); // attribut prioritaire B
  });
  
});