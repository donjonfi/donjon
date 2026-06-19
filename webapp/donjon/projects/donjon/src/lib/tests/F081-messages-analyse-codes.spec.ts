import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ResultatCompilation } from "../models/compilateur/resultat-compilation";

/**
 * [F081] Migration des erreurs d'analyse historiques (canal `erreurs: string[]`)
 * vers des messages codés (`messages[]` avec `code` → page wiki).
 * Catégories couvertes : placement (lieu/élément préalable, conflit de nom),
 * synonyme (élément introuvable/ambigu, pas un GN), type (parent redéfini).
 */
describe('[F081] Messages d\'analyse codés (placement / synonyme / type)', () => {

  function aLeCode(rc: ResultatCompilation, code: CodeMessage): boolean {
    return rc.messages.some(m => m.code === code);
  }

  // ---- placement ----

  it('[F081-T001] « ici » sans lieu défini → lieuPrealableIntrouvable', () => {
    const scenario = `La pomme est un objet ici.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(aLeCode(rc, CodeMessage.lieuPrealableIntrouvable)).toBeTrue();
  });

  it('[F081-T002] « dessus » sans élément défini → elementPrealableIntrouvable', () => {
    const scenario = `La clé est un objet dessus.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(aLeCode(rc, CodeMessage.elementPrealableIntrouvable)).toBeTrue();
  });

  it('[F081-T003] objet « ici » de même nom que le lieu → conflitNomLieuElement', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `Le salon est un objet ici.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(aLeCode(rc, CodeMessage.conflitNomLieuElement)).toBeTrue();
  });

  // ---- synonyme ----

  it('[F081-T004] synonyme d\'un élément inexistant → synonymeElementOriginalIntrouvable', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `Interpréter cabane comme la maison.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(aLeCode(rc, CodeMessage.synonymeElementOriginalIntrouvable)).toBeTrue();
  });

  // ---- type ----

  it('[F081-T005] type parent redéfini → typeParentRedefini', () => {
    const scenario =
      `Un fruit est un objet.\n` +
      `Un fruit est une plante.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(aLeCode(rc, CodeMessage.typeParentRedefini)).toBeTrue();
  });

  // ---- non-régression : un scénario propre n'émet aucun message ----

  it('[F081-T006] scénario valide → aucun message', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `La table est un support dans le salon.`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    expect(rc.messages).toHaveSize(0);
  });

});
