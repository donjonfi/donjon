// [F111] Débogueur — commande « déboguer <élément> » (inspection / fiche)
//
// Cible les branches NON couvertes par debogage-exemples-wiki.spec.ts (F072) :
// inspection d'un LIEU, d'un CONTENANT (branche contenu), d'un COMPTEUR,
// d'une LISTE, et la branche « pas trouvé ». Le routage (commandeur.ts
// essayerCommandeDeboguer) exige isCeciV1, donc on passe toujours un sujet.
// Seules les branches qui RETOURNENT une chaîne atterrissent dans ctx.sortie
// (« déboguer ici » / « déboguer états » passent par console.warn → ignorés).

import { TestUtils } from "../utils/test-utils";

const SCENARIO = `
La cabane est un lieu.
Sa description est "Une cabane de jardinier.".
Le jardin est un lieu au nord de la cabane.
La pomme est un objet mangeable dans la cabane.
Le coffre est un contenant fermé et ouvrable dans la cabane.
La bille est un objet dans le coffre.
Le score est un compteur initialisé à 42.
L’historique est une liste.

règle avant commencer le jeu:
  ajouter "alpha" à l’historique.
fin règle`;

describe('[F111] Débogueur — inspection « déboguer <élément> »', () => {

  it('[F111-T001] déboguer un LIEU affiche sa fiche (titre, contenu)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer cabane', false).sortie;
    expect(sortie).withContext(sortie).toContain('cabane');
    // afficherDetailLieu liste le contenu du lieu
    expect(sortie.toLowerCase()).withContext(sortie).toContain('pomme');
  });

  it('[F111-T002] déboguer un CONTENANT affiche la branche contenu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer coffre', false).sortie;
    expect(sortie).withContext(sortie).toContain('coffre');
    // la bille est dans le coffre → listée dans la branche estContenant
    expect(sortie.toLowerCase()).withContext(sortie).toContain('bille');
  });

  it('[F111-T003] déboguer un OBJET simple affiche ses états', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer pomme', false).sortie;
    expect(sortie).withContext(sortie).toContain('pomme');
    expect(sortie.toLowerCase()).withContext(sortie).toContain('mangeable');
  });

  it('[F111-T004] déboguer un COMPTEUR affiche sa valeur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer score', false).sortie;
    expect(sortie).withContext(sortie).toContain('score');
    expect(sortie).withContext(sortie).toContain('42');
  });

  it('[F111-T005] déboguer une LISTE affiche sa fiche (type, taille)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer historique', false).sortie;
    expect(sortie).withContext(sortie).toContain('historique');
    // afficherDetailListe affiche le type « liste » et la taille
    expect(sortie.toLowerCase()).withContext(sortie).toContain('liste');
  });

  it('[F111-T006] déboguer un élément inexistant → « pas trouvé »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer licorne', false).sortie;
    expect(sortie.toLowerCase()).withContext(sortie).toContain('pas trouvé');
  });

  // Probes (gardés seulement si verts au run) : direction et concept.
  it('[F111-T007] déboguer une DIRECTION affiche sa fiche', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(SCENARIO);
    const sortie = ctx.com.executerCommande('déboguer nord', false).sortie;
    expect(sortie.toLowerCase()).withContext(sortie).toContain('nord');
  });

});
