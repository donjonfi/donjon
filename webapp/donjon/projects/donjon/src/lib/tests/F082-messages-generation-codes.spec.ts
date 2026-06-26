import { CodeMessage } from "../models/compilateur/message-analyse";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ResultatCompilation } from "../models/compilateur/resultat-compilation";

/**
 * [F082] Erreurs de génération (generateur.ts) remontées comme messages codés
 * dans `ResultatCompilation.messages` (avec lien wiki), au lieu d'être noyées
 * dans `jeu.tamponErreurs`.
 */
describe('[F082] Messages de génération codés', () => {

  function genererEtRecuperer(scenario: string): ResultatCompilation {
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    // la génération pousse ses messages codés dans rc.messages
    Generateur.genererJeu(rc);
    return rc;
  }

  function aLeCode(rc: ResultatCompilation, code: CodeMessage): boolean {
    return rc.messages.some(m => m.code === code);
  }

  it('[F082-T001] action définie deux fois → generationActionDupliquee', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `action sauter:\n` +
      `  dire "Vous sautez.".\n` +
      `fin action\n` +
      `action sauter:\n` +
      `  dire "Encore !".\n` +
      `fin action`;
    const rc = genererEtRecuperer(scenario);
    expect(aLeCode(rc, CodeMessage.generationActionDupliquee)).toBeTrue();
  });

  it('[F082-T002] état déclaré deux fois → generationEtatDejaDeclare', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `poli est un état.\n` +
      `poli est un état.`;
    const rc = genererEtRecuperer(scenario);
    expect(aLeCode(rc, CodeMessage.generationEtatDejaDeclare)).toBeTrue();
  });

  it('[F082-T003] scénario valide → aucun message de génération', () => {
    const scenario =
      `Le salon est un lieu.\n` +
      `La table est un support dans le salon.`;
    const rc = genererEtRecuperer(scenario);
    expect(rc.messages).toHaveSize(0);
  });

});
