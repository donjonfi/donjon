import { ActionsUtils, CompilateurV8, Generateur } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";

/**
 * Prépositions principale / secondaires d’une action (bloc « définitions: ») :
 *
 *   action crier sur ceci:
 *     définitions:
 *       préposition ceci principale: sur.
 *       prépositions ceci secondaires: dans et sous.
 *
 * - la principale est induite par l’en-tête (« … sur ceci » → « sur ») et peut être
 *   redéfinie (elle remplace alors l’induite) ;
 * - les secondaires sont des prépositions également acceptées ;
 * - lors du découpage d’une commande du joueur, une préposition principale est mieux
 *   notée qu’une secondaire, elle-même mieux notée qu’une préposition non prévue.
 */
describe('Prépositions principale / secondaires d’une action', () => {

  function compiler(corpsAction: string) {
    const scenario = `
      Le salon est un lieu.
      La pomme est un objet dans le salon.
      La table est un support dans le salon.
      Marie est une personne dans le salon.
      ${corpsAction}
    `;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    return { rc, jeu, au: new ActionsUtils(jeu, false) };
  }

  // ---------------------------------------------------------------------------
  // ANALYSE (parsing du bloc définitions)
  // ---------------------------------------------------------------------------

  it('[F077-T001] préposition principale induite par l’en-tête, secondaires déclarées', () => {
    const { rc, jeu } = compiler(`
      action crier sur ceci:
        définitions:
          prépositions ceci secondaires: dans et sous.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    expect(rc.erreurs.length).toEqual(0);
    const crier = jeu.actions.find(a => a.infinitif === 'crier');
    // principale induite par l’en-tête « crier sur ceci »
    expect(crier.prepositionCeci).toEqual('sur');
    // secondaires : la liste « dans et sous » est découpée et normalisée
    expect(crier.prepositionsCeciSecondaires).toEqual(['dans', 'sous']);
  });

  it('[F077-T002] préposition principale explicite : remplace celle induite par l’en-tête', () => {
    const { jeu } = compiler(`
      action crier sur ceci:
        définitions:
          préposition ceci principale: contre.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const crier = jeu.actions.find(a => a.infinitif === 'crier');
    // « contre » remplace le « sur » induit par l’en-tête
    expect(crier.prepositionCeci).toEqual('contre');
  });

  it('[F077-T003] prépositions principale et secondaires du second complément (cela)', () => {
    const { jeu } = compiler(`
      action poser ceci sur cela:
        définitions:
          prépositions cela secondaires: dans et sous.
        phase épilogue:
          dire "Posé.".
      fin action
    `);
    const poser = jeu.actions.find(a => a.infinitif === 'poser');
    // principale de cela induite par l’en-tête « … sur cela »
    expect(poser.prepositionCela).toEqual('sur');
    expect(poser.prepositionsCelaSecondaires).toEqual(['dans', 'sous']);
  });

  it('[F077-T004] préposition définie pour un complément absent de l’en-tête → problème', () => {
    const { rc } = compiler(`
      action examiner ceci:
        définitions:
          préposition cela principale: sur.
        phase épilogue:
          dire "Examiné.".
      fin action
    `);
    expect(rc.messages.some(m => m.titre === 'cela défini mais absent de l’entête de l’action')).toBeTrue();
  });

  it('[F077-T005] valeur de préposition manquante → problème', () => {
    const { rc } = compiler(`
      action crier sur ceci:
        définitions:
          préposition ceci principale:
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    expect(rc.messages.some(m => m.titre === 'préposition attendue')).toBeTrue();
  });

  // ---------------------------------------------------------------------------
  // SCORE (scoreInfinitifExisteAvecCeciCela) : principale > secondaire > non prévue
  // ---------------------------------------------------------------------------

  it('[F077-T006] score gradué d’après la préposition employée (principale > secondaire > non prévue)', () => {
    const { au } = compiler(`
      action crier sur ceci:
        définitions:
          prépositions ceci secondaires: dans et sous.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const score = (prep: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('crier', true, false, prep, undefined);

    const principale = score('sur');   // préposition principale
    const secondaire = score('dans');  // préposition secondaire
    const nonPrevue = score('vers');   // préposition non prévue
    const aucune = score(undefined);   // pas de préposition

    // principale strictement meilleure que secondaire, elle-même meilleure que non prévue
    expect(principale).toBeGreaterThan(secondaire);
    expect(secondaire).toBeGreaterThan(nonPrevue);
    // une préposition non prévue ne rapporte rien de plus que pas de préposition
    expect(nonPrevue).toEqual(aucune);
  });

  it('[F077-T007] rétro-compatibilité : sans secondaire, seule la principale est bonifiée', () => {
    const { au } = compiler(`
      action crier sur ceci:
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const score = (prep: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('crier', true, false, prep, undefined);
    // sans secondaire déclarée, une préposition autre que la principale ne rapporte aucun bonus
    expect(score('sur')).toBeGreaterThan(score('dans'));
    expect(score('dans')).toEqual(score('vers'));
  });

  it('[F077-T008] score du second complément (cela) gradué également', () => {
    const { au } = compiler(`
      action poser ceci sur cela:
        définitions:
          prépositions cela secondaires: dans.
        phase épilogue:
          dire "Posé.".
      fin action
    `);
    const score = (prepCela: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('poser', true, true, undefined, prepCela);
    expect(score('sur')).toBeGreaterThan(score('dans'));   // principale > secondaire
    expect(score('dans')).toBeGreaterThan(score('contre')); // secondaire > non prévue
  });

  // ---------------------------------------------------------------------------
  // DÉCOUPAGE : la préposition oriente le candidat retenu
  // ---------------------------------------------------------------------------

  /** Score de la découpe à deux compléments (ceci = rose, prép, cela = Marie) de la commande. */
  function scoreDecoupeOffrir(corpsAction: string): number {
    const { jeu } = compiler(`La rose est un objet dans le salon. ${corpsAction}`);
    const ctxCom = new ContextePartie(jeu).com.decomposerCommande('offrir la rose pour Marie');
    const decoupe = ctxCom.candidats.find(c => c.isCeciV1 && c.isCelaV1
      && c.els.sujet?.nom === 'rose' && c.els.sujetComplement1?.nom === 'Marie' && c.els.preposition1 === 'pour');
    expect(decoupe).withContext('découpe ceci=rose / pour / cela=Marie attendue').toBeTruthy();
    return decoupe.score;
  }

  it('[F077-T009] déclarer une préposition secondaire augmente le score de la découpe correspondante', () => {
    // même commande « offrir la rose pour Marie », même découpe (ceci=rose, pour, cela=Marie) :
    // seule la déclaration de la secondaire « pour » change → le score de cette découpe augmente.
    const sansSecondaire = scoreDecoupeOffrir(`
      action offrir ceci à cela:
        phase épilogue:
          dire "Offert.".
      fin action
    `);
    const avecSecondaire = scoreDecoupeOffrir(`
      action offrir ceci à cela:
        définitions:
          prépositions cela secondaires: pour.
        phase épilogue:
          dire "Offert.".
      fin action
    `);
    const avecPrincipale = scoreDecoupeOffrir(`
      action offrir ceci pour cela:
        phase épilogue:
          dire "Offert.".
      fin action
    `);

    // « pour » non prévue < « pour » secondaire < « pour » principale
    expect(avecSecondaire).toBeGreaterThan(sansSecondaire);
    expect(avecPrincipale).toBeGreaterThan(avecSecondaire);
  });

});
