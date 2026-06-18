import { EEtatsBase } from "../../public-api";

import { LiensElementsUtils } from "../utils/jeu/tactile/liens-elements-utils";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// [F079] Mentions `[#nom]` / `[@nom]` / `[&nom]` : en plus de marquer l'élément (mentionné / vu /
// familier), elles rendent le MOT QUI PRÉCÈDE cliquable en interface tactile. Le moteur laisse un
// marqueur `@@lien:<id>@@` dans la sortie ; le lecteur (enrichisseurLiens) le transforme en lien
// `<a href="#E<id>">mot</a>` sur le mot précédent, ou le retire si le tactile est désactivé.

describe('Mentions → liens tactiles (F079)', () => {

  // ----- Côté moteur : marqueur émis + état appliqué -----

  function salonAvecPomme(typeMention: string): { ctx: any, pommeId: number, sortie: string } {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le salon est un lieu.
Sa description est "Vous êtes dans un salon, il y a un fruit[${typeMention}pomme].".
La pomme est un objet mangeable ici.
`);
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    const sortie = ctx.com.executerCommande('regarder', false).sortie;
    return { ctx, pommeId: pomme.id, sortie };
  }

  it('[F079-T001] `[@nom]` : le mot précédent reçoit un marqueur de lien et l’objet devient vu', () => {
    const { ctx, pommeId, sortie } = salonAvecPomme('@');
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(sortie).withContext(sortie).toContain('fruit@@lien:' + pommeId + '@@');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, EEtatsBase.vu, ctx.eju)).toBeTrue();
  });

  it('[F079-T002] `[#nom]` : marqueur de lien + objet mentionné', () => {
    const { ctx, pommeId, sortie } = salonAvecPomme('#');
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(sortie).withContext(sortie).toContain('fruit@@lien:' + pommeId + '@@');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, EEtatsBase.mentionne, ctx.eju)).toBeTrue();
  });

  it('[F079-T003] `[&nom]` : marqueur de lien + objet familier', () => {
    const { ctx, pommeId, sortie } = salonAvecPomme('&');
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(sortie).withContext(sortie).toContain('fruit@@lien:' + pommeId + '@@');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, EEtatsBase.familier, ctx.eju)).toBeTrue();
  });

  // ----- Côté lecteur : transformation du marqueur en lien -----

  it('[F079-T004] enrichirLiens : le mot précédant `@@lien:<id>@@` devient un lien tactile', () => {
    const resultat = LiensElementsUtils.enrichirLiens('<p>il y a un fruit@@lien:5@@.</p>', []);
    expect(resultat).toEqual('<p>il y a un <a class="djn-lien-tactile" href="#E5" role="button">fruit</a>.</p>');
  });

  it('[F079-T005] enrichirLiens : marqueur sans mot précédent (après une balise) → simplement retiré', () => {
    const resultat = LiensElementsUtils.enrichirLiens('<p><b>texte</b>@@lien:5@@ suite</p>', []);
    expect(resultat).toEqual('<p><b>texte</b> suite</p>');
  });

  it('[F079-T006] enrichirLiens : le marqueur est traité même sans autre cible cliquable', () => {
    // (cibles vide : la garde "pas de cible" ne doit pas court-circuiter le traitement du marqueur)
    const resultat = LiensElementsUtils.enrichirLiens('<p>une clé@@lien:12@@</p>', []);
    expect(resultat).toEqual('<p>une <a class="djn-lien-tactile" href="#E12" role="button">clé</a></p>');
  });

  it('[F079-T007] appliquerLiensMentions : crée le lien (caché par CSS hors tactile) sans enrichissement générique', () => {
    // Tactile désactivé : le lien est tout de même créé (rendu invisible/inerte par le CSS tant
    // que `.tactile-actif` est absent), il n’est donc jamais affiché comme marqueur brut au joueur.
    expect(LiensElementsUtils.appliquerLiensMentions('<p>il y a un fruit@@lien:5@@.</p>'))
      .toEqual('<p>il y a un <a class="djn-lien-tactile" href="#E5" role="button">fruit</a>.</p>');
  });

  it('[F079-T008] enrichirLiens : lien de mention + enrichissement générique cohabitent', () => {
    // « fruit » (mention) devient un lien ; « pomme » (libellé d’une cible visible) aussi.
    const cibles = [{ ref: 'E5', libelles: ['pomme'] }];
    const resultat = LiensElementsUtils.enrichirLiens('<p>un fruit@@lien:5@@ près de la pomme</p>', cibles);
    expect(resultat).toContain('<a class="djn-lien-tactile" href="#E5" role="button">fruit</a>');
    expect(resultat).toContain('<a class="djn-lien-tactile" href="#E5" role="button">pomme</a>');
  });

});
