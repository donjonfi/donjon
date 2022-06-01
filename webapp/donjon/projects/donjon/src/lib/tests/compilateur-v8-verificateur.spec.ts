import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { Verificateur } from "../utils/compilation/verificateur";

describe('Vérificateur - début/fin région', () => {

  it('Phrase: La plante est un objet', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'La plante est un objet.'
    );
    expect(phrases).toHaveSize(1); // 1 phrase

    expect(Verificateur.estNouvelleRegion(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRegion(phrases[0], new ContexteAnalyseV8())).toBeFalse();
  });

  it('Phrases: « action nager: dire "vous nagez" fin action »', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'action nager:\n' +
      '  dire "Vous nagez".\n' +
      'fin action'
    );
    expect(phrases).toHaveSize(3); // 3 phrases
    // action nager
    expect(Verificateur.estNouvelleRegion(phrases[0], new ContexteAnalyseV8())).toBeTrue();
    expect(Verificateur.estFinRegion(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    // dire "Vous nagez"
    expect(Verificateur.estNouvelleRegion(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRegion(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    // fin action
    expect(Verificateur.estNouvelleRegion(phrases[2], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRegion(phrases[2], new ContexteAnalyseV8())).toBeTrue();

  });

  
  it('Phrases: « règle avant manger ceci: dire "Je n’ai pas faim". fin règle »', () => {
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(
      'règle avant manger ceci: dire "Je n’ai pas faim". fin règle.'
    );
    expect(phrases).toHaveSize(3); // 3 phrases
    // règle avant manger ceci:
    expect(Verificateur.estNouvelleRegion(phrases[0], new ContexteAnalyseV8())).toBeTrue();
    expect(Verificateur.estFinRegion(phrases[0], new ContexteAnalyseV8())).toBeFalse();
    // dire "Je n’ai pas faim".
    expect(Verificateur.estNouvelleRegion(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRegion(phrases[1], new ContexteAnalyseV8())).toBeFalse();
    // fin règle.
    expect(Verificateur.estNouvelleRegion(phrases[2], new ContexteAnalyseV8())).toBeFalse();
    expect(Verificateur.estFinRegion(phrases[2], new ContexteAnalyseV8())).toBeTrue();

  });
  
});