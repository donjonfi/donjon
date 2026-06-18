import { EEtatsBase } from "../../public-api";

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// [F078] Auto-LISIBLE : un objet doté d'un texte non vide devient automatiquement « lisible »
// (action « lire » disponible + verbe proposé en interface tactile) sans devoir déclarer l'état
// explicitement. S'applique au texte défini à la compilation ET au texte défini en cours de partie
// (« changer le texte de X est "…" »). Un texte vide ne rend pas lisible.

describe('Texte → lisible automatique (F078)', () => {

  it('[F078-T001] un objet avec un texte non vide (compilation) est lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
Le parchemin est un objet dans le bureau.
Son texte est "Fuyez pendant qu'il est encore temps.".
`);
    const parchemin = ctx.jeu.objets.find(o => o.nom === 'parchemin');
    expect(parchemin).toBeTruthy();
    expect(ctx.jeu.etats.possedeEtatIdElement(parchemin, ctx.jeu.etats.lisibleID))
      .withContext("parchemin avec texte → lisible").toBeTrue();
  });

  it('[F078-T002] un objet sans texte n’est pas lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
Le caillou est un objet dans le bureau.
`);
    const caillou = ctx.jeu.objets.find(o => o.nom === 'caillou');
    expect(caillou).toBeTruthy();
    expect(ctx.jeu.etats.possedeEtatIdElement(caillou, ctx.jeu.etats.lisibleID))
      .withContext("caillou sans texte → pas lisible").toBeFalse();
  });

  it('[F078-T003] un texte vide ne rend pas lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
La feuille (f) est un objet dans le bureau.
Son texte est "".
`);
    const feuille = ctx.jeu.objets.find(o => o.nom === 'feuille');
    expect(feuille).toBeTruthy();
    expect(ctx.jeu.etats.possedeEtatIdElement(feuille, ctx.jeu.etats.lisibleID))
      .withContext("feuille au texte vide → pas lisible").toBeFalse();
  });

  it('[F078-T004] l’action « lire » fonctionne sans déclarer l’état lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
Le parchemin est un objet dans le bureau.
Son texte est "Fuyez sans tarder.".
`);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('lire le parchemin', false).sortie;
    expect(sortie).withContext(sortie).toContain('Fuyez sans tarder.');
  });

  it('[F078-T005] définir un texte non vide en cours de partie rend lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
La feuille (f) est un objet dans le bureau.
Son texte est "".
action graver:
  changer le texte de la feuille est "Trésor enterré sous le chêne.".
fin action
`);
    const feuille = ctx.jeu.objets.find(o => o.nom === 'feuille');
    expect(feuille).toBeTruthy();
    // pas lisible au départ (texte vide)
    expect(ctx.jeu.etats.possedeEtatIdElement(feuille, ctx.jeu.etats.lisibleID))
      .withContext("feuille pas lisible avant gravure").toBeFalse();

    ctx.com.executerCommande('graver', false);

    // devenue lisible après avoir reçu un texte non vide
    expect(ctx.jeu.etats.possedeEtatIdElement(feuille, ctx.jeu.etats.lisibleID))
      .withContext("feuille lisible après gravure").toBeTrue();

    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('lire la feuille', false).sortie;
    expect(sortie).withContext(sortie).toContain('Trésor enterré sous le chêne.');
  });

  it('[F078-T006] vider le texte en cours de partie retire l’état lisible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le bureau est un lieu.
Le parchemin est un objet dans le bureau.
Son texte est "Fuyez sans tarder.".
action raturer:
  changer le texte du parchemin est "".
fin action
`);
    const parchemin = ctx.jeu.objets.find(o => o.nom === 'parchemin');
    expect(parchemin).toBeTruthy();
    // lisible au départ (texte non vide défini à la compilation)
    expect(ctx.jeu.etats.possedeEtatIdElement(parchemin, ctx.jeu.etats.lisibleID))
      .withContext("parchemin lisible avant effacement").toBeTrue();

    ctx.com.executerCommande('raturer', false);

    // plus lisible après que le texte a été vidé
    expect(ctx.jeu.etats.possedeEtatIdElement(parchemin, ctx.jeu.etats.lisibleID))
      .withContext("parchemin plus lisible après effacement").toBeFalse();
  });

});
