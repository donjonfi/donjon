import { AnalyseurCondition } from "../utils/compilation/analyseur/analyseur.condition";
import { LienCondition } from "../models/compilateur/lien-condition";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] VÉRIFICACTIONS STRUCTURE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Conditions − Vérifier parenthèses', () => {

  // VÉRIFIER PARENTHÈSES

  it('Parenthèses :  « (si a ou (b et c)) »', () => {
    const result = AnalyseurCondition.parenthesesValides('(si a ou (b et c))');
    expect(result).toEqual(true);
  });

  it('Parenthèses :  « si ((a ou b) et (c et (d ou a))) »', () => {
    const result = AnalyseurCondition.parenthesesValides('si ((a ou b) et (c et (d ou a)))');
    expect(result).toEqual(true);
  });

  it('Parenthèses :  « si ((a ou (c et (d ou a))) » (💥)', () => {
    const result = AnalyseurCondition.parenthesesValides('si ((a ou b et (c et (d ou a)))');
    expect(result).toEqual(false);
  });

  it('Parenthèses :  « ( a )ou) b ( » (💥)', () => {
    const result = AnalyseurCondition.parenthesesValides('( a )ou) b (');
    expect(result).toEqual(false);
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] VÉRIFICACTIONS DÉCOUPAGE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Conditions − Décomposer conditions', () => {

  // DÉCOUPER CONDITIONS

  it('Décomposer : « (a ou (b et c)) et d ou (e et f ou (d et c)) »', () => {
    const result = AnalyseurCondition.decomposerConditionBrute('(a ou (b et c)) et d ou (e et f ou (d et c)) ou g et f');
    expect(result).not.toBeNull();
    expect(result.sousConditions.length).toEqual(3); // 3 sous-conditions
    // => (a ou (b et c)) et d
    expect(result.sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].conditionBrute).toEqual("@sc0@ et d");
    // => ou (e et f ou (d et c))
    expect(result.sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[1].conditionBrute).toEqual("e et f ou (d et c)");
    //  ==> e et f
    expect(result.sousConditions[1].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[1].sousConditions[0].conditionBrute).toEqual('e et f');
    //  ==> ou (d et c)
    expect(result.sousConditions[1].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[1].sousConditions[1].conditionBrute).toEqual('d et c');
    //   ===> d
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].conditionBrute).toEqual('d');
    //   ===> et c
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].lien).toEqual(LienCondition.et)
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].conditionBrute).toEqual('c');
    // => ou g et f
    expect(result.sousConditions[2].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[2].conditionBrute).toEqual("g et f");
    //  ==> g
    expect(result.sousConditions[2].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[2].sousConditions[0].conditionBrute).toEqual('g');
    //  ==> et f
    expect(result.sousConditions[2].sousConditions[1].lien).toEqual(LienCondition.et)
    expect(result.sousConditions[2].sousConditions[1].conditionBrute).toEqual('f');
  });

  it('Décomposer : « le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici »', () => {
    const result = AnalyseurCondition.decomposerConditionBrute('le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici');
    expect(result).not.toBeNull();
    expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions

    // => le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu
    expect(result.sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].conditionBrute).toEqual("le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu");
    expect(result.sousConditions[0].sousConditions.length).toEqual(3); // 3 sous-conditions
    //  ==> le ruban est rouge ou vert
    expect(result.sousConditions[0].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].sousConditions[0].conditionBrute).toEqual("le ruban est rouge ou vert");
    expect(result.sousConditions[0].sousConditions[0].sousConditions.length).toEqual(2); // 2 sous-conditions
    //   ===> rouge
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].conditionBrute).toEqual('le ruban est rouge');
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].sousConditions).toBeNull(); // 0 sous-conditions
    //   ===> ou vert
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].conditionBrute).toEqual('vert');
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    //  ==> ainsi que porté
    expect(result.sousConditions[0].sousConditions[1].lien).toEqual(LienCondition.ainsiQue)
    expect(result.sousConditions[0].sousConditions[1].conditionBrute).toEqual("porté");
    expect(result.sousConditions[0].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    //  ==> mais pas usé ou décousu
    expect(result.sousConditions[0].sousConditions[2].lien).toEqual(LienCondition.maisPas)
    expect(result.sousConditions[0].sousConditions[2].conditionBrute).toEqual("usé ou décousu");
    expect(result.sousConditions[0].sousConditions[2].sousConditions.length).toEqual(2); // 2 sous-conditions

    //   ===> usé
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].conditionBrute).toEqual('usé');
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].sousConditions).toBeNull(); // 0 sous-conditions
    //   ===> ou décousu
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].conditionBrute).toEqual('décousu');
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    // => le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu
    expect(result.sousConditions[1].lien).toEqual(LienCondition.etSi)
    expect(result.sousConditions[1].conditionBrute).toEqual("le joueur est ici");
    expect(result.sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

  });


});