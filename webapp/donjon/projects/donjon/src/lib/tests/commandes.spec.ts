import { Compilateur, Generateur } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";

describe('Décomposer des commandes', () => {

  interface ThisContext {
    ctxPartie: ContextePartie;
  }

  beforeEach(function (this: ThisContext) {

    const scenario =
      'chanter est une action. ' +
      'aller vers ceci est une action qui concerne un intitulé. ' +
      'utiliser ceci est une action qui concerne un objet visible. ' +
      'utiliser ceci sur cela est une action qui concerne deux objets visibles. ' +
      'Le bateau est un lieu. ' +
      'Le capitaine est une personne ici. ' +
      'La clé est un objet ici. ' +
      'La clé de bronze est un objet ici. ' +
      'Le coffre du capitaine est un contenant ici. ' +
      'Interpréter le coffre comme le coffre du capitaine. ' +
      'Le trésor du pirate est un objet dedans. ' +
      'Berlin est une ville. ' +
      'Le comte de Berlin est une personne. ' +
      '';
    const rc = Compilateur.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    this.ctxPartie = new ContextePartie(jeu);
  });

  it('commande « chanter »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('chanter');
    expect(ctxCom.brute).toEqual('chanter');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('chanter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeFalse();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « aller au nord »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('aller au nord');
    expect(ctxCom.brute).toEqual('aller au nord');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('aller');
    // préposition0: au
    expect(ctxCom.candidats[0].els.preposition0).toEqual('au');
    // ceci: nord
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('nord');
    // pas de préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // pas de cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « aller dans salle de bain »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('aller dans salle de bain');
    expect(ctxCom.brute).toEqual('aller dans salle de bain');
    expect(ctxCom.candidats.length).toEqual(2);
    // infinitif: aller
    expect(ctxCom.candidats[0].els.infinitif).toEqual('aller');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('dans');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('salle de bain');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « aller salle à manger »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('aller salle à manger');
    expect(ctxCom.brute).toEqual('aller salle à manger');
    expect(ctxCom.candidats.length).toEqual(2);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('aller');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('salle à manger');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « utiliser la clé sur le coffre »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé sur le coffre');
    expect(ctxCom.brute).toEqual('utiliser la clé sur le coffre');
    expect(ctxCom.candidats.length).toEqual(2);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre');

  });

  it('commande « utiliser la clé sur le coffre du capitaine »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé sur le coffre du capitaine');
    expect(ctxCom.brute).toEqual('utiliser la clé sur le coffre du capitaine');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci: nord
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé');
    // pas de préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur');
    // pas de cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre du capitaine');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // ceci: nord
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('la clé sur le coffre');
    // pas de préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('du');
    // pas de cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('capitaine');

  });

  it('commande « utiliser la clé du capitaine sur le coffre du capitaine »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé du capitaine sur le coffre du capitaine');
    expect(ctxCom.brute).toEqual('utiliser la clé du capitaine sur le coffre du capitaine');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé du capitaine');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre du capitaine');
  });

  it('commande « utiliser la clé du capitaine sur le coffre »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé du capitaine sur le coffre');
    expect(ctxCom.brute).toEqual('utiliser la clé du capitaine sur le coffre');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toEqual(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('du');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('capitaine sur le coffre');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('utiliser');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('la clé du capitaine');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('sur');
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('le coffre');

  });

  it('commande « utiliser la clé de bronze sur le coffre »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé de bronze sur le coffre');
    expect(ctxCom.brute).toEqual('utiliser la clé de bronze sur le coffre');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé de bronze');
    //  préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('utiliser');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('la clé');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('de');
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('bronze sur le coffre');

  });

  it('commande « parler au comte de berlin de la salle de bain »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('parler au comte de berlin de la salle de bain');
    expect(ctxCom.brute).toEqual('parler au comte de berlin de la salle de bain');
    expect(ctxCom.candidats.length).toEqual(1);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('comte de berlin');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('la salle de bain');
  });

  it('commande « parler de berlin au comte de berlin »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('parler de berlin au comte de berlin');
    expect(ctxCom.brute).toEqual('parler de berlin au comte de berlin');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('comte de berlin');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('berlin');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toEqual('de');
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('berlin au comte');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('de');
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('berlin');
  });

  it('commande « parler au comte de berlin de berlin »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('parler au comte de berlin de berlin');
    expect(ctxCom.brute).toEqual('parler au comte de berlin de berlin');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('comte de berlin');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('berlin');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('comte');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('berlin de berlin');
  });

  it('commande « parler au capitaine du bateau »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('parler au capitaine du bateau');
    expect(ctxCom.brute).toEqual('parler au capitaine du bateau');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('capitaine');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('bateau');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('capitaine du bateau');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toBeUndefined();
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeFalse();
    expect(ctxCom.candidats[1].celaIntituleV1).toBeUndefined();
  });

  it('commande « parler du bateau au capitaine »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('parler du bateau au capitaine');
    expect(ctxCom.brute).toEqual('parler du bateau au capitaine');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('capitaine');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('bateau');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toEqual('concernant');
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('bateau au capitaine');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toBeUndefined();
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeFalse();
    expect(ctxCom.candidats[1].celaIntituleV1).toBeUndefined();
  });

});