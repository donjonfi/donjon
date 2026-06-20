import { ContextePartie } from "../models/jouer/contexte-partie";
import { ExprReg } from "../utils/compilation/expr-reg";
import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Synonymes', () => {

  it('[F009-T001] Attribut ele : « interpréter Alain comme le capitaine » ', () => {
    const result = ExprReg.xSynonymes.exec('interpréter Alain comme le capitaine');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('Alain'); // synonymes
    expect(result[2]).toEqual('le capitaine'); // original
  });

  it('[F009-T002] Attribut ele : « interpréter Alain et le marin comme l’apprenti du village » ', () => {
    const result = ExprReg.xSynonymes.exec('interpréter Alain et le marin comme l’apprenti du village');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('Alain et le marin'); // synonymes
    expect(result[2]).toEqual('l’apprenti du village'); // original
  });

  it('[F009-T003] Attribut ele : « interpréter le marin, Alain et le boss comme le capitaine crochet » ', () => {
    const result = ExprReg.xSynonymes.exec('interpréter le marin, Alain et le boss comme le capitaine crochet');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('le marin, Alain et le boss'); // synonymes
    expect(result[2]).toEqual('le capitaine crochet'); // original
  });

  it('[F009-T004] Attribut ele : « Interpréter marcher comme se déplacer » ', () => {
    const result = ExprReg.xSynonymes.exec('Interpréter marcher comme se déplacer');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('marcher'); // synonymes
    expect(result[2]).toEqual('se déplacer'); // original
  });

  it('[F009-T005] Attribut ele : « interpréter marcher, courrir, sauter, s’étirer et danser comme s’exercer » ', () => {
    const result = ExprReg.xSynonymes.exec('interpréter marcher, courrir, sauter, s’étirer et danser comme s’exercer');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('marcher, courrir, sauter, s’étirer et danser'); // synonymes
    expect(result[2]).toEqual('s’exercer'); // original
  });

  // => Pas contrôlé dans l’expression régulière mais devra l’être par l’analyseur
  // it('[F009-T006] Attribut ele : « interpréter courir comme le pied de bois » (💥) ', () => {
  //     const result = ExprReg.xSynonymes.exec('interpréter courir comme le pied de bois');
  //     expect(result).toEqual(null);
  // });

});



// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] TEST SCÉNARIO
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
describe('Synonymes − Scénario synonyme action)', () => {

  it('[F009-T007] courir comme marcher', () => {
    const scenario = '' +
      'action marcher: fin action ' +
      'action sauter: fin action ' +
      'Interpréter courir comme marcher. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.actions).toHaveSize(2);
    expect(ctx.jeu.actions[0].infinitif).toEqual('marcher');
    expect(ctx.jeu.actions[0].synonymes).toHaveSize(1);
    expect(ctx.jeu.actions[0].synonymes[0]).toEqual('courir');
    expect(ctx.jeu.actions[1].infinitif).toEqual('sauter');
    expect(ctx.jeu.actions[1].synonymes).toHaveSize(0);
  });

  it('[F009-T008] jumper et plonger comme sauter', () => {
    const scenario = '' +
      'action marcher: fin action ' +
      'action sauter: fin action ' +
      'Interpréter jumper et plonger comme sauter. ' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.actions).toHaveSize(2);
    expect(ctx.jeu.actions[0].infinitif).toEqual('marcher');
    expect(ctx.jeu.actions[0].synonymes).toHaveSize(0);
    expect(ctx.jeu.actions[1].infinitif).toEqual('sauter');
    expect(ctx.jeu.actions[1].synonymes).toHaveSize(2);
    expect(ctx.jeu.actions[1].synonymes[0]).toEqual('jumper');
    expect(ctx.jeu.actions[1].synonymes[1]).toEqual('plonger');
  });

  it('[F009-T009] courir comme marcher et sauter (💥)', () => {
    const scenario = '' +
      'Marcher est une action. ' +
      'Sauter est une action. ' +
      'Interpréter courir comme marcher. ' +
      'Interpréter courir comme sauter. ' +
      '';
    let ctx: ContextePartie;
    expect(function () { ctx = TestUtils.genererEtCommencerLeJeu(scenario) }).toThrowError();
  });


  it('[F009-T010] fruit et pomme comme pomme rouge (sans synonymes auto)', () => {
    const scenario = '' +
      'Désactiver les synonymes auto. ' +
      'La pomme rouge est un fruit. ' +
      'La table est un support. ' +
      'Interpréter pomme et fruit comme la pomme rouge.' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    // (index 0 et 1 utilisés pour inventaire et joueur)
    expect(ctx.jeu.objets).toHaveSize(4);
    expect(ctx.jeu.objets[2].nom).toEqual('pomme rouge');
    expect(ctx.jeu.objets[2].synonymes).toHaveSize(2);
    expect(ctx.jeu.objets[2].synonymes[0].nom).toEqual('pomme');
    expect(ctx.jeu.objets[2].synonymes[0].epithete).toBeFalsy();
    expect(ctx.jeu.objets[2].synonymes[1].nom).toEqual('fruit');
    expect(ctx.jeu.objets[2].synonymes[1].epithete).toBeFalsy();
    expect(ctx.jeu.objets[3].nom).toEqual('table');
    expect(ctx.jeu.objets[3].synonymes).toHaveSize(0);
  });

  it('[F009-T011] fruit et pomme comme pomme rouge (avec synonymes auto)', () => {
    const scenario = '' +
      'Activer les synonymes auto. ' +
      'La pomme rouge est un fruit. ' +
      'La table est un support. ' +
      'Interpréter pomme et fruit comme la pomme rouge.' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    // (index 0 et 1 utilisés pour inventaire et joueur)
    expect(ctx.jeu.objets).toHaveSize(4);
    expect(ctx.jeu.objets[2].nom).toEqual('pomme rouge');
    // synonymes auteur (pomme, fruit) + auto au singulier ET pluriel (pommes, rouge, rouges)
    expect(ctx.jeu.objets[2].synonymes).toHaveSize(5);
    expect(ctx.jeu.objets[2].synonymes[0].nom).toEqual('pomme');
    expect(ctx.jeu.objets[2].synonymes[0].epithete).toBeFalsy();
    expect(ctx.jeu.objets[2].synonymes[1].nom).toEqual('fruit');
    expect(ctx.jeu.objets[2].synonymes[1].epithete).toBeFalsy();
    expect(ctx.jeu.objets[2].synonymes[2].nom).toEqual('pommes');
    expect(ctx.jeu.objets[2].synonymes[3].nom).toEqual('rouge');
    expect(ctx.jeu.objets[2].synonymes[3].epithete).toBeFalsy();
    expect(ctx.jeu.objets[2].synonymes[4].nom).toEqual('rouges');
    expect(ctx.jeu.objets[3].nom).toEqual('table');
    expect(ctx.jeu.objets[3].synonymes).toHaveSize(0);
  });

  // ——— forme « a aussi … comme synonyme(s) » (ordre inversé vs « interpréter ») ———

  it('[F009-T012] regex xSynonymesAjout : original puis liste de synonymes', () => {
    const result = ExprReg.xSynonymesAjout.exec('Le coffre a aussi malle et caisse comme synonymes');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('Le coffre'); // original
    expect(result[2]).toEqual('malle et caisse'); // synonymes
  });

  it('[F009-T013] regex xSynonymesAjout : singulier « comme synonyme »', () => {
    const result = ExprReg.xSynonymesAjout.exec('La fiole a aussi flacon comme synonyme');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual('La fiole');
    expect(result[2]).toEqual('flacon');
  });

  it('[F009-T014] regex xSynonymesAjout : « comme action courante » n’est pas un synonyme', () => {
    expect(ExprReg.xSynonymesAjout.exec('Le coffre a aussi ouvrir comme action courante')).toEqual(null);
  });

  it('[F009-T015] « Le coffre a aussi malle et caisse comme synonymes » (élément)', () => {
    const scenario = '' +
      'Désactiver les synonymes auto. ' +
      'Le coffre est un contenant. ' +
      'La table est un support. ' +
      'Le coffre a aussi malle et caisse comme synonymes.' +
      '';
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.objets[2].nom).toEqual('coffre');
    expect(ctx.jeu.objets[2].synonymes).toHaveSize(2);
    expect(ctx.jeu.objets[2].synonymes[0].nom).toEqual('malle');
    expect(ctx.jeu.objets[2].synonymes[1].nom).toEqual('caisse');
    expect(ctx.jeu.objets[3].nom).toEqual('table');
    expect(ctx.jeu.objets[3].synonymes).toHaveSize(0);
  });

});