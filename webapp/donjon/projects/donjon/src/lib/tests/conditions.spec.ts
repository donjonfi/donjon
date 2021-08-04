import { AnalyseurCondition } from "../utils/compilation/analyseur/analyseur.condition";
import { Compilateur } from "../../public-api";
import { Compteur } from "../models/compilateur/compteur";
import { ConditionMulti } from "../models/compilateur/condition-multi";
import { ConditionSolo } from "../models/compilateur/condition-solo";
import { ConditionsUtils } from "../utils/jeu/conditions-utils";
import { Jeu } from "../models/jeu/jeu";
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
    expect(result.estDebutCondition).toBeTrue();
    expect(result.estFrereCadet).toBeFalse();

    // => (a ou (b et c)) et d
    expect(result.sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].estDebutCondition).toBeTrue();
    expect(result.sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].conditionBrute).toEqual("@sc0@ et d");
    // => ou (e et f ou (d et c))
    expect(result.sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[1].estFrereCadet).toBeFalse();
    expect(result.sousConditions[1].conditionBrute).toEqual("e et f ou (d et c)");
    //  ==> e et f
    expect(result.sousConditions[1].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[1].sousConditions[0].estDebutCondition).toBeFalse();
    expect(result.sousConditions[1].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[1].sousConditions[0].conditionBrute).toEqual('e et f');
    //  ==> ou (d et c)
    expect(result.sousConditions[1].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[1].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[1].sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[1].sousConditions[1].conditionBrute).toEqual('d et c');
    //   ===> d
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].estDebutCondition).toBeFalse();
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[1].sousConditions[1].sousConditions[0].conditionBrute).toEqual('d');
    //   ===> et c
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].lien).toEqual(LienCondition.et)
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[1].sousConditions[1].sousConditions[1].conditionBrute).toEqual('c');
    // => ou g et f
    expect(result.sousConditions[2].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[2].estDebutCondition).toBeFalse();
    expect(result.sousConditions[2].estFrereCadet).toBeTrue();
    expect(result.sousConditions[2].conditionBrute).toEqual("g et f");
    //  ==> g
    expect(result.sousConditions[2].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[2].sousConditions[0].estDebutCondition).toBeFalse();
    expect(result.sousConditions[2].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[2].sousConditions[0].conditionBrute).toEqual('g');
    //  ==> et f
    expect(result.sousConditions[2].sousConditions[1].lien).toEqual(LienCondition.et)
    expect(result.sousConditions[2].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[2].sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[2].sousConditions[1].conditionBrute).toEqual('f');
  });

  it('Décomposer : « le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici »', () => {
    const result = AnalyseurCondition.decomposerConditionBrute('le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici');
    expect(result).not.toBeNull();
    expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions
    expect(result.estDebutCondition).toBeTrue();
    expect(result.estFrereCadet).toBeFalse();

    // => le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu
    expect(result.sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].estDebutCondition).toBeTrue();
    expect(result.sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].conditionBrute).toEqual("le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu");
    expect(result.sousConditions[0].sousConditions.length).toEqual(3); // 3 sous-conditions
    //  ==> le ruban est rouge ou vert
    expect(result.sousConditions[0].sousConditions[0].lien).toEqual(LienCondition.aucun);
    expect(result.sousConditions[0].sousConditions[0].estDebutCondition).toBeTrue();
    expect(result.sousConditions[0].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].sousConditions[0].conditionBrute).toEqual("le ruban est rouge ou vert");
    expect(result.sousConditions[0].sousConditions[0].sousConditions.length).toEqual(2); // 2 sous-conditions
    //   ===> le ruban est rouge
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].estDebutCondition).toBeTrue();
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].conditionBrute).toEqual('le ruban est rouge');
    expect(result.sousConditions[0].sousConditions[0].sousConditions[0].sousConditions).toBeNull(); // 0 sous-conditions
    //   ===> ou vert
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].conditionBrute).toEqual('vert');
    expect(result.sousConditions[0].sousConditions[0].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    //  ==> ainsi que porté
    expect(result.sousConditions[0].sousConditions[1].lien).toEqual(LienCondition.ainsiQue)
    expect(result.sousConditions[0].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[0].sousConditions[1].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].sousConditions[1].conditionBrute).toEqual("porté");
    expect(result.sousConditions[0].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    //  ==> mais pas usé ou décousu
    expect(result.sousConditions[0].sousConditions[2].lien).toEqual(LienCondition.maisPas)
    expect(result.sousConditions[0].sousConditions[2].estDebutCondition).toBeFalse();
    expect(result.sousConditions[0].sousConditions[2].estFrereCadet).toBeTrue();
    expect(result.sousConditions[0].sousConditions[2].conditionBrute).toEqual("usé ou décousu");
    expect(result.sousConditions[0].sousConditions[2].sousConditions.length).toEqual(2); // 2 sous-conditions

    //   ===> usé
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].lien).toEqual(LienCondition.aucun)
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].estDebutCondition).toBeFalse();
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].estFrereCadet).toBeFalse();
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].conditionBrute).toEqual('usé');
    expect(result.sousConditions[0].sousConditions[2].sousConditions[0].sousConditions).toBeNull(); // 0 sous-conditions
    //   ===> ou décousu
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].lien).toEqual(LienCondition.ou)
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].estDebutCondition).toBeFalse();
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].conditionBrute).toEqual('décousu');
    expect(result.sousConditions[0].sousConditions[2].sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

    // => le joueur est ici
    expect(result.sousConditions[1].lien).toEqual(LienCondition.etSi)
    expect(result.sousConditions[1].estDebutCondition).toBeTrue();
    expect(result.sousConditions[1].estFrereCadet).toBeTrue();
    expect(result.sousConditions[1].conditionBrute).toEqual("le joueur est ici");
    expect(result.sousConditions[1].sousConditions).toBeNull(); // 0 sous-conditions

  });

  describe('Conditions − Générer condition multi', () => {

    it('Générer condition: « le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici »', () => {

      const resultDec = AnalyseurCondition.decomposerConditionBrute('le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu et si le joueur est ici');
      const result = AnalyseurCondition.genererConditionMulti(resultDec);
      expect(result).not.toBeNull();
      expect(result.condition).toBeNull();
      expect(result.lienFrereAine).toEqual(LienCondition.aucun);
      expect(result.sousConditions).not.toBeNull();
      expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions
      expect(result.typeLienSousConditions).toEqual(LienCondition.et) // et si => et

      // => le ruban est rouge ou vert ainsi que porté mais pas usé ou décousu
      expect(result.sousConditions[0]).not.toBeNull();
      expect(result.sousConditions[0].lienFrereAine).toEqual(LienCondition.aucun);
      expect(result.sousConditions[0].condition).toBeNull();
      expect(result.sousConditions[0].sousConditions).not.toBeNull();
      expect(result.sousConditions[0].sousConditions.length).toEqual(3); // 3 sous conditions
      expect(result.sousConditions[0].typeLienSousConditions).toEqual(LienCondition.et) // ainsi que, mais pas => et


      //  ==> le ruban est rouge ou vert
      expect(result.sousConditions[0].sousConditions[0]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].lienFrereAine).toEqual(LienCondition.aucun);
      expect(result.sousConditions[0].sousConditions[0].condition).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions.length).toEqual(2); // 2 sous conditions
      expect(result.sousConditions[0].sousConditions[0].typeLienSousConditions).toEqual(LienCondition.ou) // ou => ou
      //   ===> le ruban est rouge
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].lienFrereAine).toEqual(LienCondition.aucun);
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].sousConditions).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujet.determinant).toEqual("le ")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujet.nom).toEqual("ruban")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.verbe).toEqual("est")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.complement).toEqual("rouge")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujetComplement.nom).toEqual("rouge")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[0].condition.sujetComplement.epithete).toBeNull();
      //   ===> ou vert
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].lienFrereAine).toEqual(LienCondition.ou);
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.sujet).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.verbe).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.complement).toEqual("vert")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.sujetComplement.nom).toEqual("vert")
      expect(result.sousConditions[0].sousConditions[0].sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      //  ==> ainsi que porté
      expect(result.sousConditions[0].sousConditions[1]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[1].lienFrereAine).toEqual(LienCondition.ainsiQue);
      expect(result.sousConditions[0].sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.sujet).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.verbe).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.complement).toEqual("porté")
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.nom).toEqual("porté")
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      //  ==> mais pas usé ou décousu
      expect(result.sousConditions[0].sousConditions[2]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].lienFrereAine).toEqual(LienCondition.maisPas);
      expect(result.sousConditions[0].sousConditions[2].condition).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions.length).toEqual(2); // 2 sous conditions
      expect(result.sousConditions[0].sousConditions[2].typeLienSousConditions).toEqual(LienCondition.ou) // ou => ou

      //   ===> usé
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].lienFrereAine).toEqual(LienCondition.aucun);
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].sousConditions).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.sujet).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.verbe).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.complement).toEqual("usé")
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.sujetComplement.nom).toEqual("usé")
      expect(result.sousConditions[0].sousConditions[2].sousConditions[0].condition.sujetComplement.epithete).toBeNull();

      //   ===> ou décousu
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1]).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].lienFrereAine).toEqual(LienCondition.ou);
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.sujet).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.verbe).toBeNull();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.complement).toEqual("décousu")
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.sujetComplement.nom).toEqual("décousu")
      expect(result.sousConditions[0].sousConditions[2].sousConditions[1].condition.sujetComplement.epithete).toBeNull();


      // => le joueur est ici
      expect(result.sousConditions[1]).not.toBeNull();
      expect(result.sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[1].lienFrereAine).toEqual(LienCondition.etSi);
      expect(result.sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[1].condition.sujet.determinant).toEqual("le ");
      expect(result.sousConditions[1].condition.sujet.nom).toEqual("joueur");
      expect(result.sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[1].condition.verbe).toEqual("est");
      expect(result.sousConditions[1].condition.complement).toEqual("ici");
      expect(result.sousConditions[1].condition.sujetComplement).not.toBeNull();
      expect(result.sousConditions[1].condition.sujetComplement.nom).toEqual("ici");

      console.warn(result);

    });

  });

  describe('Conditions − Get condition multi', () => {

    it('Get condition: « a dépasse soit b soit c »', () => {
      const result = AnalyseurCondition.getConditionMulti("a dépasse soit b soit c");

      expect(result).toBeInstanceOf(ConditionMulti);
      expect(result.condition).toBeNull();
      expect(result.sousConditions).not.toBeNull();
      expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions
      expect(result.typeLienSousConditions).toEqual(LienCondition.soit);

      // => (a dépasse b)
      expect(result.sousConditions[0].condition).not.toBeNull();
      expect(result.sousConditions[0].sousConditions).toBeNull();
      expect(result.sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);
      expect(result.sousConditions[0].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[0].condition.sujet.nom).toEqual('a');
      expect(result.sousConditions[0].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].condition.verbe).toEqual('dépasse');
      expect(result.sousConditions[0].condition.complement).toEqual('b');
      expect(result.sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].condition.sujetComplement.nom).toEqual('b');
      expect(result.sousConditions[0].condition.sujetComplement.epithete).toBeNull();

      // => soit (a dépasse c)
      expect(result.sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[1].lienFrereAine).toBe(LienCondition.soit);
      expect(result.sousConditions[1].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[1].condition.sujet.nom).toEqual('a');
      expect(result.sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[1].condition.verbe).toEqual('dépasse');
      expect(result.sousConditions[1].condition.complement).toEqual('c');
      expect(result.sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[1].condition.sujetComplement.nom).toEqual('c');
      expect(result.sousConditions[1].condition.sujetComplement.epithete).toBeNull();

    });


    it('Get condition: « x est a ou b mais pas c »', () => {

      // x est a ou b mais pas c <=> ((x est a) ou (x est b)) et (x n’est pas c)
      const result = AnalyseurCondition.getConditionMulti("x est a ou b mais pas c");
      expect(result).toBeInstanceOf(ConditionMulti);
      expect(result.condition).toBeNull();
      expect(result.sousConditions).not.toBeNull();
      expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions

      // => (x est a) ou (x est b)
      expect(result.sousConditions[0].condition).toBeNull();
      expect(result.sousConditions[0].sousConditions).not.toBeNull();
      expect(result.sousConditions[0].sousConditions.length).toEqual(2); // 2 sous-conditions
      expect(result.sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);

      //  ==> (x est a)
      expect(result.sousConditions[0].sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].condition.negation).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].condition.complement).toEqual('a');
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.nom).toEqual('a');
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.epithete).toBeNull();

      //  ==> ou (x est b)
      expect(result.sousConditions[0].sousConditions[1].lienFrereAine).toBe(LienCondition.ou);
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.negation).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.complement).toEqual('b');
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.nom).toEqual('b');
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      // => et (x n’est pas c)
      expect(result.sousConditions[1].condition).not.toBeNull();
      expect(result.sousConditions[1].sousConditions).toBeNull();
      expect(result.sousConditions[1].lienFrereAine).toBe(LienCondition.et);
      expect(result.sousConditions[1].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[1].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[1].condition.negation).toEqual('pas')
      expect(result.sousConditions[1].condition.complement).toEqual('c');
      expect(result.sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[1].condition.sujetComplement.nom).toEqual('c');
      expect(result.sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      console.warn("cond simpl: ", result);
    });

    it('Get condition: « x possède a et b mais ni c ni d »', () => {

      // x possède a et b mais ni c ni d <=> ((x possède a) et (x possède b)) et (x ne possède ni c ni d)
      const result = AnalyseurCondition.getConditionMulti("x possède a et b mais ni c ni d");
      expect(result).toBeInstanceOf(ConditionMulti);
      expect(result.condition).toBeNull();
      expect(result.sousConditions).not.toBeNull();
      expect(result.sousConditions.length).toEqual(2); // 2 sous-conditions

      // => (x possède a) et (x possède b)
      expect(result.sousConditions[0].condition).toBeNull();
      expect(result.sousConditions[0].sousConditions).not.toBeNull();
      expect(result.sousConditions[0].sousConditions.length).toEqual(2); // 2 sous-conditions
      expect(result.sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);

      //  ==> (x possède a)
      expect(result.sousConditions[0].sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[0].sousConditions[0].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].condition.verbe).toEqual('possède');
      expect(result.sousConditions[0].sousConditions[0].condition.negation).toBeNull();
      expect(result.sousConditions[0].sousConditions[0].condition.complement).toEqual('a');
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.nom).toEqual('a');
      expect(result.sousConditions[0].sousConditions[0].condition.sujetComplement.epithete).toBeNull();

      //  ==> et (x possède b)
      expect(result.sousConditions[0].sousConditions[1].lienFrereAine).toBe(LienCondition.et);
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[0].sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.verbe).toEqual('possède');
      expect(result.sousConditions[0].sousConditions[1].condition.negation).toBeNull();
      expect(result.sousConditions[0].sousConditions[1].condition.complement).toEqual('b');
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.nom).toEqual('b');
      expect(result.sousConditions[0].sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      // => et (x ne possède ni c ni d)
      expect(result.sousConditions[1].condition).toBeNull();
      expect(result.sousConditions[1].sousConditions).not.toBeNull();
      expect(result.sousConditions[1].lienFrereAine).toBe(LienCondition.et);

      //  ==> (x ne possède pas c)
      expect(result.sousConditions[1].sousConditions[0].lienFrereAine).toBe(LienCondition.aucun);
      expect(result.sousConditions[1].sousConditions[0].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[1].sousConditions[0].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[1].sousConditions[0].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[1].sousConditions[0].condition.verbe).toEqual('possède');
      expect(result.sousConditions[1].sousConditions[0].condition.negation).toEqual('pas');
      expect(result.sousConditions[1].sousConditions[0].condition.complement).toEqual('c');
      expect(result.sousConditions[1].sousConditions[0].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[1].sousConditions[0].condition.sujetComplement.nom).toEqual('c');
      expect(result.sousConditions[1].sousConditions[0].condition.sujetComplement.epithete).toBeNull();

      //  ==> et (x ne possède pas d)
      expect(result.sousConditions[1].sousConditions[1].lienFrereAine).toBe(LienCondition.et);
      expect(result.sousConditions[1].sousConditions[1].condition.sujet.determinant).toBeUndefined();
      expect(result.sousConditions[1].sousConditions[1].condition.sujet.nom).toEqual('x');
      expect(result.sousConditions[1].sousConditions[1].condition.sujet.epithete).toBeNull();
      expect(result.sousConditions[1].sousConditions[1].condition.verbe).toEqual('possède');
      expect(result.sousConditions[1].sousConditions[1].condition.negation).toEqual('pas');
      expect(result.sousConditions[1].sousConditions[1].condition.complement).toEqual('d');
      expect(result.sousConditions[1].sousConditions[1].condition.sujetComplement.determinant).toBeUndefined();
      expect(result.sousConditions[1].sousConditions[1].condition.sujetComplement.nom).toEqual('d');
      expect(result.sousConditions[1].sousConditions[1].condition.sujetComplement.epithete).toBeNull();

      console.warn("cond simpl: ", result);
    });


  });


});

describe('Conditions − Vérifier résultat sur des compteurs', () => {

  // définir un jeu avec 4 compteurs
  let jeu: Jeu = new Jeu();
  jeu.compteurs = [];
  let cptA = new Compteur('a', 0);
  let cptB = new Compteur('b', 0);
  let cptC = new Compteur('c', 0);
  let cptD = new Compteur('d', 0);
  jeu.compteurs.push(cptA);
  jeu.compteurs.push(cptB);
  jeu.compteurs.push(cptC);
  jeu.compteurs.push(cptD);
  const condUtils = new ConditionsUtils(jeu, false);

  it('vérifier résultat condition: « si a dépasse b et si c vaut d »', () => {
    cptA.valeur = 2;
    cptB.valeur = 1;
    cptC.valeur = 3;
    cptD.valeur = 3;
    expect(condUtils.siEstVrai('si a dépasse b et si c vaut d', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 2;
    cptB.valeur = 2;
    cptC.valeur = 2;
    cptD.valeur = 2;
    expect(condUtils.siEstVrai('si a dépasse b et si c vaut d', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 1
    cptB.valeur = 0;
    cptC.valeur = 1;
    cptD.valeur = 0
    expect(condUtils.siEstVrai('si a dépasse b et si c vaut d', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier résultat condition: « si a vaut 1 et si b vaut 2 ou si c vaut 3 et si d vaut 4 »', () => {

    // (A=1 et B=2) ou (C=3 et d=4)

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('si a vaut 1 et si b vaut 2 ou si c vaut 3 et si d vaut 4', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 0;
    cptD.valeur = 0;
    expect(condUtils.siEstVrai('si a vaut 1 et si b vaut 2 ou si c vaut 3 et si d vaut 4', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 0;
    cptB.valeur = 0;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('si a vaut 1 et si b vaut 2 ou si c vaut 3 et si d vaut 4', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 1;
    cptC.valeur = 3;
    cptD.valeur = 3;
    expect(condUtils.siEstVrai('si a vaut 1 et si b vaut 2 ou si c vaut 3 et si d vaut 4', null, null, null, null, 0)).toBeFalse();

  });

  
  it('vérifier résultat condition: « a vaut 1 et si (b vaut 2 ou si c vaut 3) et si d vaut 4 »', () => {

    // A=1 et (B=2 ou C=3) et D=4

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut 1 et si (b vaut 2 ou si c vaut 3) et si d vaut 4', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 0;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut 1 et si (b vaut 2 ou si c vaut 3) et si d vaut 4', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 0;
    cptD.valeur = 0;
    expect(condUtils.siEstVrai('a vaut 1 et si (b vaut 2 ou si c vaut 3) et si d vaut 4', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 0;
    cptB.valeur = 2;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut 1 et si (b vaut 2 ou si c vaut 3) et si d vaut 4', null, null, null, null, 0)).toBeFalse();

  });

  it('vérifier résultat condition: « si a ne vaut pas b mais bien c »', () => {

    // A != B mais A = C

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('si a ne vaut pas b mais bien c', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 1;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('si a ne vaut pas b mais bien c', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 1;
    cptB.valeur = 2;
    cptC.valeur = 2;
    expect(condUtils.siEstVrai('si a ne vaut pas b mais bien c', null, null, null, null, 0)).toBeFalse();


  });

  it('vérifier résultat condition: « a dépasse b ainsi que c ou d »', () => {

    // (A > B) et (A > C ou D)

    cptA.valeur = 1;
    cptB.valeur = 0;
    cptC.valeur = 0;
    cptD.valeur = 0;
    expect(condUtils.siEstVrai('a dépasse b ainsi que c ou d', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 100;
    cptB.valeur = 2;
    cptC.valeur = 5;
    cptD.valeur = 200;
    expect(condUtils.siEstVrai('a dépasse b ainsi que c ou d', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 100;
    cptB.valeur = 2;
    cptC.valeur = 200;
    cptD.valeur = 1;
    expect(condUtils.siEstVrai('a dépasse b ainsi que c ou d', null, null, null, null, 0)).toBeTrue();
    
    cptA.valeur = 1;
    cptB.valeur = 1;
    cptC.valeur = 1;
    cptD.valeur = 1;
    expect(condUtils.siEstVrai('a dépasse b ainsi que c ou d', null, null, null, null, 0)).toBeFalse();
    
    cptA.valeur = 1;
    cptB.valeur = 10;
    cptC.valeur = 10;
    cptD.valeur = 1;
    expect(condUtils.siEstVrai('a dépasse b ainsi que c ou d', null, null, null, null, 0)).toBeFalse();

  });

  it('vérifier résultat condition: « a vaut soit b soit c mais pas d »', () => {

    // A vaut (soit B soit C) mais pas D

    cptA.valeur = 5;
    cptB.valeur = 5;
    cptC.valeur = 0;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut soit b soit c mais pas d', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 5;
    cptB.valeur = 5;
    cptC.valeur = 5;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut soit b soit c mais pas d', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 5;
    cptB.valeur = 5;
    cptC.valeur = 2;
    cptD.valeur = 5;
    expect(condUtils.siEstVrai('a vaut soit b soit c mais pas d', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 5;
    cptB.valeur = 2;
    cptC.valeur = 3;
    cptD.valeur = 4;
    expect(condUtils.siEstVrai('a vaut soit b soit c mais pas d', null, null, null, null, 0)).toBeFalse();

  });

  it('vérifier résultat condition: « a ne vaut ni b ni c »', () => {

    // A != B et A != C

    cptA.valeur = 2;
    cptB.valeur = 0;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('a ne vaut ni b ni c', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 2;
    cptB.valeur = 10;
    cptC.valeur = 2;
    expect(condUtils.siEstVrai('a ne vaut ni b ni c', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 0;
    cptB.valeur = 0;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('a ne vaut ni b ni c', null, null, null, null, 0)).toBeFalse();

  });

  it('vérifier résultat condition: « a vaut 2 mais ni b ni c »', () => {

    // A vaut 2 mais ni B ni C

    cptA.valeur = 2;
    cptB.valeur = 0;
    cptC.valeur = 10;
    expect(condUtils.siEstVrai('a vaut 2 mais ni b ni c', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 2;
    cptB.valeur = -2;
    cptC.valeur = -10;
    expect(condUtils.siEstVrai('a vaut 2 mais ni b ni c', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 2;
    cptB.valeur = 2;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('a vaut 2 mais ni b ni c', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 2;
    cptB.valeur = 2;
    cptC.valeur = 2;
    expect(condUtils.siEstVrai('a vaut 2 mais ni b ni c', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = -2;
    cptB.valeur = 2;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('a vaut 2 mais ni b ni c', null, null, null, null, 0)).toBeFalse();

  });

  it('vérifier résultat condition: « a vaut 1 ou 2 ou 3 »', () => {

    // A vaut 1 ou 2 ou 3

    cptA.valeur = 1;
    expect(condUtils.siEstVrai('a vaut 1 ou 2 ou 3', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 3;
    expect(condUtils.siEstVrai('a vaut 1 ou 2 ou 3', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 10;
    expect(condUtils.siEstVrai('a vaut 1 ou 2 ou 3', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 0;
    expect(condUtils.siEstVrai('a vaut 1 ou 2 ou 3', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = -2;
    expect(condUtils.siEstVrai('a vaut 1 ou 2 ou 3', null, null, null, null, 0)).toBeFalse();

  });


  it('vérifier résultat condition: « A vaut 1 ou si B dépasse 1 ou si c atteint 1 »', () => {

    // A vaut 1 ou B dépasse 1 ou C atteint 1

    cptA.valeur = 1;
    cptB.valeur = 10;
    cptC.valeur = 10;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 0;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 0;
    cptB.valeur = 50;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 0;
    cptB.valeur = 1;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 0;
    cptB.valeur = 0;
    cptC.valeur = 10;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 0;
    cptB.valeur = 0;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 2;
    cptB.valeur = 1;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('A vaut 1 ou si B dépasse 1 ou si c atteint 1', null, null, null, null, 0)).toBeFalse();


  });

  it('vérifier résultat condition: « a vaut 1 et si b vaut 1 et si c vaut 1 »', () => {

    // A, B et C valent 1

    cptA.valeur = 1;
    cptB.valeur = 1;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('a vaut 1 et si b vaut 1 et si c vaut 1', null, null, null, null, 0)).toBeTrue();

    cptA.valeur = 1;
    cptB.valeur = 0;
    cptC.valeur = 1;
    expect(condUtils.siEstVrai('a vaut 1 et si b vaut 1 et si c vaut 1', null, null, null, null, 0)).toBeFalse();

    cptA.valeur = 0;
    cptB.valeur = 0;
    cptC.valeur = 0;
    expect(condUtils.siEstVrai('a vaut 1 et si b vaut 1 et si c vaut 1', null, null, null, null, 0)).toBeFalse();

  });


});