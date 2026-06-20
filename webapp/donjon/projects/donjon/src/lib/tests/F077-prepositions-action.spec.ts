import { ActionsUtils, CompilateurV8, Generateur } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";

/**
 * Prépositions probables / possibles d’une action (bloc « définitions: ») :
 *
 *   action crier sur ceci:
 *     définitions:
 *       prépositions ceci probables: sur.
 *       prépositions ceci possibles: dans et sous.
 *
 * - les « probables » sont induites par l’en-tête (« … sur ceci » → « sur ») et peuvent
 *   être redéfinies (la liste déclarée remplace alors l’induite ; sa 1re entrée devient
 *   la forme de base affichée) ;
 * - les « possibles » sont des prépositions également acceptées mais moins sûres ;
 * - lors du découpage d’une commande du joueur, une préposition probable est mieux notée
 *   qu’une possible, elle-même mieux notée qu’une préposition imprévue ;
 * - une liste de probables (ex. « à, au et aux ») met toutes ses entrées au même niveau.
 */
describe('Prépositions probables / possibles d’une action', () => {

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

  it('[F077-T001] probable induite par l’en-tête, possibles déclarées', () => {
    const { rc, jeu } = compiler(`
      action crier sur ceci:
        définitions:
          prépositions ceci possibles: dans et sous.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    expect(rc.erreurs.length).toEqual(0);
    const crier = jeu.actions.find(a => a.infinitif === 'crier');
    // probable induite par l’en-tête « crier sur ceci »
    expect(crier.prepositionCeci).toEqual('sur');
    expect(crier.prepositionsCeciProbables).toEqual(['sur']);
    // possibles : la liste « dans et sous » est découpée et normalisée
    expect(crier.prepositionsCeciPossibles).toEqual(['dans', 'sous']);
  });

  it('[F077-T002] probables explicites : remplacent celle induite par l’en-tête', () => {
    const { jeu } = compiler(`
      action crier sur ceci:
        définitions:
          prépositions ceci probables: contre.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const crier = jeu.actions.find(a => a.infinitif === 'crier');
    // « contre » remplace le « sur » induit par l’en-tête
    expect(crier.prepositionCeci).toEqual('contre');
    expect(crier.prepositionsCeciProbables).toEqual(['contre']);
  });

  it('[F077-T003] probable et possibles du second complément (cela)', () => {
    const { jeu } = compiler(`
      action poser ceci sur cela:
        définitions:
          prépositions cela possibles: dans et sous.
        phase épilogue:
          dire "Posé.".
      fin action
    `);
    const poser = jeu.actions.find(a => a.infinitif === 'poser');
    // probable de cela induite par l’en-tête « … sur cela »
    expect(poser.prepositionCela).toEqual('sur');
    expect(poser.prepositionsCelaPossibles).toEqual(['dans', 'sous']);
  });

  it('[F077-T004] préposition définie pour un complément absent de l’en-tête → problème', () => {
    const { rc } = compiler(`
      action examiner ceci:
        définitions:
          prépositions cela probables: sur.
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
          prépositions ceci probables:
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    expect(rc.messages.some(m => m.titre === 'préposition attendue')).toBeTrue();
  });

  // ---------------------------------------------------------------------------
  // SCORE (scoreInfinitifExisteAvecCeciCela) : probable > possible > imprévue
  // ---------------------------------------------------------------------------

  it('[F077-T006] score gradué d’après la préposition employée (probable > possible > imprévue)', () => {
    const { au } = compiler(`
      action crier sur ceci:
        définitions:
          prépositions ceci possibles: dans et sous.
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const score = (prep: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('crier', true, false, prep, undefined);

    const probable = score('sur');    // préposition probable
    const possible = score('dans');   // préposition possible
    const imprevue = score('vers');   // préposition imprévue
    const aucune = score(undefined);  // pas de préposition

    // probable strictement meilleure que possible, elle-même meilleure qu’imprévue
    expect(probable).toBeGreaterThan(possible);
    expect(possible).toBeGreaterThan(imprevue);
    // une préposition imprévue ne rapporte rien de plus que pas de préposition
    expect(imprevue).toEqual(aucune);
  });

  it('[F077-T007] rétro-compatibilité : sans possible, seule la probable est bonifiée', () => {
    const { au } = compiler(`
      action crier sur ceci:
        phase épilogue:
          dire "Crié.".
      fin action
    `);
    const score = (prep: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('crier', true, false, prep, undefined);
    // sans possible déclarée, une préposition autre que la probable ne rapporte aucun bonus
    expect(score('sur')).toBeGreaterThan(score('dans'));
    expect(score('dans')).toEqual(score('vers'));
  });

  it('[F077-T008] score du second complément (cela) gradué également', () => {
    const { au } = compiler(`
      action poser ceci sur cela:
        définitions:
          prépositions cela possibles: dans.
        phase épilogue:
          dire "Posé.".
      fin action
    `);
    const score = (prepCela: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('poser', true, true, undefined, prepCela);
    expect(score('sur')).toBeGreaterThan(score('dans'));    // probable > possible
    expect(score('dans')).toBeGreaterThan(score('contre')); // possible > imprévue
  });

  it('[F077-T010] liste de probables : toutes les entrées sont au même niveau', () => {
    // « à, au, aux » (la préposition « à » et ses contractions) : toutes probables, même score.
    const { jeu, au } = compiler(`
      action demander ceci à cela:
        définitions:
          prépositions cela probables: à, au et aux.
        phase épilogue:
          dire "Demandé.".
      fin action
    `);
    const demander = jeu.actions.find(a => a.infinitif === 'demander');
    expect(demander.prepositionsCelaProbables).toEqual(['à', 'au', 'aux']);
    // forme de base affichée = 1re de la liste
    expect(demander.prepositionCela).toEqual('à');

    const score = (prepCela: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('demander', true, true, undefined, prepCela);
    // « à », « au » et « aux » sont équivalentes (toutes probables)…
    expect(score('au')).toEqual(score('à'));
    expect(score('aux')).toEqual(score('à'));
    // … et toutes meilleures qu’une préposition imprévue (« de »).
    expect(score('à')).toBeGreaterThan(score('de'));
  });

  it('[F077-T011] normalisation des contractions : déclarer « à » couvre « au »/« aux »', () => {
    // aucune déclaration explicite : « à » est seulement induite par l’en-tête.
    const { au } = compiler(`
      action demander ceci à cela:
        phase épilogue:
          dire "Demandé.".
      fin action
    `);
    const score = (prepCela: string | undefined) => au.scoreInfinitifExisteAvecCeciCela('demander', true, true, undefined, prepCela);
    // « au » et « aux » sont reconnues comme « à » (probable), sans avoir été listées.
    expect(score('au')).toEqual(score('à'));
    expect(score('aux')).toEqual(score('à'));
    expect(score('à')).toBeGreaterThan(score('de'));
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

  it('[F077-T009] déclarer une préposition possible augmente le score de la découpe correspondante', () => {
    // même commande « offrir la rose pour Marie », même découpe (ceci=rose, pour, cela=Marie) :
    // seule la déclaration de la possible « pour » change → le score de cette découpe augmente.
    const sansPossible = scoreDecoupeOffrir(`
      action offrir ceci à cela:
        phase épilogue:
          dire "Offert.".
      fin action
    `);
    const avecPossible = scoreDecoupeOffrir(`
      action offrir ceci à cela:
        définitions:
          prépositions cela possibles: pour.
        phase épilogue:
          dire "Offert.".
      fin action
    `);
    const avecProbable = scoreDecoupeOffrir(`
      action offrir ceci pour cela:
        phase épilogue:
          dire "Offert.".
      fin action
    `);

    // « pour » imprévue < « pour » possible < « pour » probable
    expect(avecPossible).toBeGreaterThan(sansPossible);
    expect(avecProbable).toBeGreaterThan(avecPossible);
  });

});
