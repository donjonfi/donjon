import {
  CompilateurV8,
  Generateur,
} from "../../public-api";

// F117 — Branches d'ERREUR / CONSEIL du Generateur autour des états :
//  - appliquerDeclarationsEtats : « … est déjà déclaré » (simple / bascule / groupe) +
//    « impossible de créer la bascule / le groupe » en conflit avec un état existant.
//  - appliquerAttributsAvecNegation : conseil « Plutôt qu'écrire non <bascule> » et
//    erreur « l'état <X> n'existe pas » pour un état inconnu nié.
//
// Harnais : compilation directe (analyserScenarioSeul → genererJeu) ; les messages
// atterrissent dans jeu.tamponErreurs / jeu.tamponConseils. Les libellés du moteur
// emploient l'apostrophe typographique U+2019 et les guillemets « » : on n'assert donc
// que sur des fragments sans apostrophe (cf. analyseur.etats.spec.ts T162).

describe('F117 — Generateur : déclarations d’états & négation (branches erreur/conseil)', () => {

  // ----- appliquerDeclarationsEtats : « déjà déclaré » -----

  it('[F117-T001] état simple en collision avec un état moteur (« ouvert ») → erreur « déjà déclaré »', () => {
    const scenario = `
Le donjon est un lieu.
ouvert est un état.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponErreurs.some(e => /déjà déclaré/.test(e))).toBeTrue();
  });

  it('[F117-T002] bascule en collision avec un état moteur → erreur « impossible de créer la bascule »', () => {
    const scenario = `
Le donjon est un lieu.
ouvert et machin forment une bascule.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponErreurs.some(e => /impossible de créer la bascule/.test(e))).toBeTrue();
    // le nom en conflit est bien l'état moteur « ouvert »
    expect(jeu.tamponErreurs.some(e => /impossible de créer la bascule/.test(e) && /ouvert/.test(e))).toBeTrue();
  });

  it('[F117-T003] groupe (« se contredisent ») en collision avec un état moteur → erreur « impossible de créer le groupe »', () => {
    const scenario = `
Le donjon est un lieu.
ouvert, machin et truc se contredisent.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponErreurs.some(e => /impossible de créer le groupe/.test(e))).toBeTrue();
  });

  // ----- appliquerAttributsAvecNegation : conseil bascule moteur + erreur état inconnu -----

  it('[F117-T004] « non ouvert » (bascule moteur ouvert/fermé) → conseil suggérant l’opposé « fermé »', () => {
    const scenario = `
Le coffre est un contenant non ouvert ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    // pas d'erreur : « ouvert » existe (état moteur), donc on tombe dans la branche conseil
    expect(jeu.tamponErreurs.some(e => /existe pas/.test(e))).toBeFalse();
    expect(jeu.tamponConseils.some(c => /non ouvert/.test(c) && /fermé/.test(c))).toBeTrue();
  });

  it('[F117-T005] négation d’un état inexistant (« non bidule ») → erreur « l’état bidule n’existe pas »', () => {
    const scenario = `
La fiole est un objet non bidule ici.
`;
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponErreurs.some(e => /existe pas/.test(e) && /bidule/.test(e))).toBeTrue();
  });

});
