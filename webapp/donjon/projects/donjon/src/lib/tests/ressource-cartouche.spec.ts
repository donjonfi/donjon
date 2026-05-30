import { ElementsJeuUtils } from "../../public-api";

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// =====================================================================================
//  RESSOURCE — affichage dans le cartouche (HUD), à la manière des compteurs
//  [F057-T3xx]
//
//  Syntaxe (quasi identique aux compteurs) :
//    L'argent est affiché en haut à droite.            → périmètre par défaut = possédé
//    L'argent possédé est affiché en haut à droite.    → piles de l'inventaire du joueur
//    Le bois disponible est affiché en bas à gauche.   → tout SAUF l'inventaire du joueur
//  Options communes : « sans intitulé », « sans unité ».
//
//  La config est figée à la compilation (jeu.ressourcesAffichees) ; la quantité affichée
//  est sommée en direct (ElementsJeuUtils.sommeQuantiteRessource).
// =====================================================================================

describe('Ressource — cartouche : configuration (compilation)', () => {

  it('[F057-T300] « L\'argent est affiché en haut à droite » → config par défaut (possédé)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nL'argent est une ressource exprimée en pièces.\nL'argent est affiché en haut à droite.`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    const ra = ctx.jeu.ressourcesAffichees[0];
    expect(ra.nom).toBe('argent');
    expect(ra.positionAffichage).toBe('haut-droite');
    expect(ra.scope).toBe('possede');
    expect(ra.unite).toBe('pièce');
    expect(ra.unites).toBe('pièces');
    // une ressource affichée n'est PAS un compteur du jeu
    expect(ctx.jeu.compteurs.length).toBe(0);
  });

  it('[F057-T301] « L\'argent possédé est affiché en haut à droite » → scope possede + nom résolu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nL'argent est une ressource exprimée en pièces.\nL'argent possédé est affiché en haut à droite.`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    expect(ctx.jeu.ressourcesAffichees[0].nom).toBe('argent');
    expect(ctx.jeu.ressourcesAffichees[0].scope).toBe('possede');
    expect(ctx.jeu.ressourcesAffichees[0].positionAffichage).toBe('haut-droite');
  });

  it('[F057-T302] « Le bois disponible est affiché en bas à gauche » → scope disponible', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe bois est une ressource.\nLe bois disponible est affiché en bas à gauche.`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    expect(ctx.jeu.ressourcesAffichees[0].nom).toBe('bois');
    expect(ctx.jeu.ressourcesAffichees[0].scope).toBe('disponible');
    expect(ctx.jeu.ressourcesAffichees[0].positionAffichage).toBe('bas-gauche');
  });

  it('[F057-T303] options « sans intitulé sans unité »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nL'argent est une ressource exprimée en pièces.\nL'argent est affiché en haut à droite sans intitulé sans unité.`
    );
    const ra = ctx.jeu.ressourcesAffichees[0];
    expect(ra.sansIntitule).toBeTrue();
    expect(ra.sansUnite).toBeTrue();
  });

  it('[F057-T305] unité effective : explicite vs par défaut (« unité » via placement)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLe campement est un lieu.\n` +
      `L'or est une ressource exprimée en pièces.\nL'or est affiché en haut à droite.\nIl y a 12 pièces d'or ici.\n` +
      `Le bois est une ressource.\nLe bois est affiché en haut à gauche.\nIl y a 20 unités de bois ici.`
    );
    const or = ctx.jeu.ressourcesAffichees.find((r: any) => r.nom === 'or');
    const bois = ctx.jeu.ressourcesAffichees.find((r: any) => r.nom === 'bois');
    // unité explicite
    expect(or.unite).toBe('pièce'); expect(or.unites).toBe('pièces');
    // unité par défaut, matérialisée par le placement « N unités de X »
    expect(bois.unite).toBe('unité'); expect(bois.unites).toBe('unités');
  });

  it('[F057-T306] ressource plurielle-par-nom affichée (« Les fruits sont affichés ») → résolue, unité null', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLes fruits sont une ressource.\nLes fruits sont affichés en bas à droite.`
    );
    const fruits = ctx.jeu.ressourcesAffichees.find((r: any) => r.nom === 'fruits' || r.nom === 'fruit');
    expect(fruits).toBeDefined();
    expect(fruits.positionAffichage).toBe('bas-droite');
    // comptée par son nom → pas d'unité séparée (affichage « fruits : N »)
    expect(fruits.unite).toBeNull();
  });

  it('[F057-T304] ressource sans instruction d\'affichage → liste vide', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nL'argent est une ressource exprimée en pièces.`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(0);
  });

});

describe('Ressource — cartouche : somme en direct', () => {

  const placerArgent =
    `${actions}\nLa salle est un lieu.\nL'argent est une ressource exprimée en pièces.\n` +
    `L'argent est affiché en haut à droite.\nIl y a 10 pièces d'argent ici.`;

  it('[F057-T310] possédé : « prendre les pièces » → somme possede=10, disponible=0', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(placerArgent);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    const joueurId = ctx.jeu.joueur.id;
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, joueurId, 'argent', 'possede')).toBe(10);
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, joueurId, 'argent', 'disponible')).toBe(0);
  });

  it('[F057-T311] disponible : avant de prendre → possede=0, disponible=10', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(placerArgent);
    const joueurId = ctx.jeu.joueur.id;
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, joueurId, 'argent', 'possede')).toBe(0);
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, joueurId, 'argent', 'disponible')).toBe(10);
  });

  it('[F057-T312] dépense à 0 : la config persiste et la somme possédée vaut 0', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nL'argent est une ressource exprimée en pièces.\n` +
      `L'argent est affiché en haut à droite.\nIl y a 10 pièces d'argent ici.\n` +
      `action depenser:\n  consommer 10 pièces d'argent.\nfin action`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    ctx.com.executerCommande('depenser', false);
    // la pile possédée est supprimée à 0 …
    const piles = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(piles.length).toBe(0);
    // … mais la config d'affichage reste, et la somme vaut 0 (pas de disparition du cartouche)
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, ctx.jeu.joueur.id, 'argent', 'possede')).toBe(0);
  });

  it('[F057-T313] pile illimitée → somme = -1 (affichée « ∞ »)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(placerArgent);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    const pile = ctx.jeu.objets.find((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(pile).toBeDefined();
    pile.quantite = -1;
    expect(ElementsJeuUtils.sommeQuantiteRessource(ctx.jeu.objets, ctx.jeu.joueur.id, 'argent', 'possede')).toBe(-1);
  });

});

describe('Ressource — cartouche : modifier l\'affichage en cours de partie', () => {

  const base =
    `${actions}\nLa salle est un lieu.\nL'argent est une ressource exprimée en pièces.\n`;

  const ra = (ctx: any) => ctx.jeu.ressourcesAffichees.find((r: any) => r.nom === 'argent');

  it('[F057-T320] « changer l\'argent est affiché en bas à gauche » → repositionne', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(base +
      `L'argent est affiché en haut à droite.\n` +
      `action repositionner:\n  changer l'argent est affiché en bas à gauche.\nfin action`
    );
    expect(ra(ctx).positionAffichage).toBe('haut-droite');
    ctx.com.executerCommande('repositionner', false);
    expect(ra(ctx).positionAffichage).toBe('bas-gauche');
  });

  it('[F057-T321] « changer l\'argent n\'est plus affiché » → retire du cartouche', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(base +
      `L'argent est affiché en haut à droite.\n` +
      `action masquer:\n  changer l'argent n'est plus affiché.\nfin action`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    ctx.com.executerCommande('masquer', false);
    expect(ctx.jeu.ressourcesAffichees.length).toBe(0);
  });

  it('[F057-T322] « changer l\'argent est affiché … sans intitulé » → applique les options', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(base +
      `L'argent est affiché en haut à droite.\n` +
      `action anonymiser:\n  changer l'argent est affiché en haut à droite sans intitulé.\nfin action`
    );
    expect(ra(ctx).sansIntitule).toBeFalse();
    ctx.com.executerCommande('anonymiser', false);
    expect(ra(ctx).sansIntitule).toBeTrue();
  });

  it('[F057-T323] « changer l\'argent est affiché … » sur une ressource non affichée → crée l\'entrée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(base +
      `action montrer:\n  changer l'argent est affiché en bas à droite.\nfin action`
    );
    expect(ctx.jeu.ressourcesAffichees.length).toBe(0);
    ctx.com.executerCommande('montrer', false);
    expect(ctx.jeu.ressourcesAffichees.length).toBe(1);
    expect(ra(ctx).positionAffichage).toBe('bas-droite');
    expect(ra(ctx).scope).toBe('possede');
    expect(ra(ctx).unite).toBe('pièce');
  });

});
