import { ActionsUtils, CompilateurV8, Generateur } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";
import { TestUtils } from "../utils/test-utils";

describe('Commande diverses', () => {


  it('Commande « tester » (objet présent, invisible et absent)', () => {

    // on force les objets du premier lieu à « vu » étant donné que pas exécuté la commande regardé.

    const scenario =
      'La salle est un lieu.\n' +
      '  le cube est un objet vu ici.\n' +
      '  le triangle est un objet invisible ici.\n' +
      '  le rectangle est un objet inaccessible et vu ici.\n' +
      'L’autre salle (f) est un lieu.\n' +
      '  le cercle est un objet ici.\n' +
      'action tester ceci:\n' +
      '  dire "Je teste [intitulé ceci]."\n' +
      'fin action\n' +
      '';
    let ctxPartie = TestUtils.genererEtCommencerLeJeu(scenario, false);

    // 1) tester le cube qui est présent
    let ctxCommande = ctxPartie.com.executerCommande('tester le cube');
    expect(ctxCommande.commandeValidee).toBeTrue();
    expect(ctxCommande.sortie).toEqual('Je teste le cube.{N}');
    // 2) tester le triangle qui est invisible
    ctxCommande = ctxPartie.com.executerCommande('tester le triangle');
    expect(ctxCommande.commandeValidee).toBeFalse();
    expect(ctxCommande.sortie).toEqual('Je ne l’ai pas encore vu.{N}');
    // 3) tester le rectangle qui n’est pas accessible
    ctxCommande = ctxPartie.com.executerCommande('tester le rectangle');
    expect(ctxCommande.commandeValidee).toBeFalse();
    expect(ctxCommande.sortie).toEqual('Je n’y ai pas accès.{N}');
    // 4) tester le cercle qui n’est pas présent
    ctxCommande = ctxPartie.com.executerCommande('tester le cercle');
    expect(ctxCommande.commandeValidee).toBeFalse();
    expect(ctxCommande.sortie).toEqual('Je ne l’ai pas encore vu.{N}');

  });

});

describe('Décomposer des commandes', () => {

  interface ThisContext {
    ctxPartie: ContextePartie;
    actionsUtils: ActionsUtils;
  }

  beforeEach(function (this: ThisContext) {

    const scenario =
      'action chanter: fin action ' +
      'action aller vers ceci: définitions: ceci est un intitulé. fin action ' +
      'action utiliser ceci: définitions: ceci est un objet visible. fin action ' +
      'action utiliser ceci sur cela : définitions: ceci est un objet visible. cela est un objet visible. fin action ' +
      'action ouvrir ceci: définitions: ceci est un objet visible. fin action ' +
      'action ouvrir ceci avec cela : définitions: ceci est un objet visible. cela est un objet visible. fin action ' +
      'action tâcher: fin action ' +
      'action tacher: fin action ' +
      'action pêcher: fin action ' +
      'Le bateau est un lieu. ' +
      'Le capitaine est une personne ici. ' +
      'La clé est un objet ici. ' +
      'La clé de bronze est un objet ici. ' +
      'Le coffre du capitaine est un contenant ici. ' +
      'Interpréter le coffre comme le coffre du capitaine. ' +
      'Le trésor du pirate est un objet dedans. ' +
      'Berlin est une ville. ' +
      'Le comte de Berlin est une personne. ' +
      'La boite aux lettres est un contenant ouvrable. ' +
      'Interpréter la boite comme la boite aux lettres. ' +
      'La lettre est un objet. ' +
      'La tarte à la crème est un objet mangeable. ' +
      'La pomme est un objet mangeable. ' +
      'La table basse est un support ici. ' +
      '';
    const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    this.ctxPartie = new ContextePartie(jeu);
    this.actionsUtils = new ActionsUtils(jeu, false);
  });

  it('commande « chanter »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('chanter');
    expect(ctxCom.brute).toEqual('chanter');
    expect(ctxCom.candidats).toHaveSize(1);
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
    expect(ctxCom.candidats).toHaveSize(1);
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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci: nord
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('clé');
    // expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé');
    // pas de préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur');
    // pas de cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('coffre du capitaine');
    // expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre du capitaine');

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

  it('commande « utiliser la clé avec le coffre du capitaine »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé avec le coffre du capitaine');
    expect(ctxCom.brute).toEqual('utiliser la clé avec le coffre du capitaine');
    expect(ctxCom.candidats).toHaveSize(1);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('utiliser');
    // pas de préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci: nord
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la clé');
    // pas de préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('avec');
    // pas de cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre du capitaine');

  });

  it('commande « utiliser la clé du capitaine sur le coffre du capitaine »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé du capitaine sur le coffre du capitaine');
    expect(ctxCom.brute).toEqual('utiliser la clé du capitaine sur le coffre du capitaine');
    expect(ctxCom.candidats).toHaveSize(1);
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
    expect(ctxCom.candidats).toHaveSize(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

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
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le coffre');

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('utiliser');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('la clé');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('du');
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('capitaine sur le coffre');

  });

  it('commande « utiliser la clé de bronze sur le coffre »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('utiliser la clé de bronze sur le coffre');
    expect(ctxCom.brute).toEqual('utiliser la clé de bronze sur le coffre');
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(1);

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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
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
    expect(ctxCom.candidats).toHaveSize(2);
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


  it('commande « ouvrir boite aux lettres »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('ouvrir boite aux lettres');
    expect(ctxCom.brute).toEqual('ouvrir boite aux lettres');
    expect(ctxCom.candidats).toHaveSize(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('ouvrir');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('boite aux lettres');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();

    // infinitif
    expect(ctxCom.candidats[1].els.infinitif).toEqual('ouvrir');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // ceci
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('boite');
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toEqual('aux')
    // cela
    expect(ctxCom.candidats[1].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[1].celaIntituleV1.toString()).toEqual('lettres');


  });

  it('commande « poser une question »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('poser une question');
    expect(ctxCom.candidats).toHaveSize(1);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('poser');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy()
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('une question');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy()
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });


  it('commande « commander une pomme rouge »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('commander une pomme rouge');
    expect(ctxCom.candidats).toHaveSize(1);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('commander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy()
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('une pomme rouge');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy()
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });


  it('commande « offrir une tarte à la cerise »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('offrir une tarte à la cerise');
    // la tarte à la cerise n’existe pas
    expect(ctxCom.candidats).toHaveSize(2);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('offrir');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy()
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('une tarte');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('la cerise');

  });

  it('commande « offrir une tarte à la crème »', function (this: ThisContext) {
    // la tarte à la crème existe
    const ctxCom = this.ctxPartie.com.decomposerCommande('offrir une tarte à la crème');
    expect(ctxCom.candidats).toHaveSize(2);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('offrir');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy()
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('une tarte à la crème');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy()
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « mettre la pomme sur la table basse »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('mettre la pomme sur la table basse');
    expect(ctxCom.candidats).toHaveSize(2);

    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('mettre');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy()
    // ceci
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('la pomme');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('sur')
    // cela
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('la table basse');

  });

  it('commande « tacher »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('tacher');
    expect(ctxCom.candidats).toHaveSize(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('tacher');
  });

  it('commande « tâcher »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('tâcher');
    expect(ctxCom.candidats).toHaveSize(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('tâcher');
  });

  it('commande « pêcher »', function (this: ThisContext) {
    const ctxCom = this.ctxPartie.com.decomposerCommande('pêcher');
    expect(ctxCom.candidats).toHaveSize(1);
    // infinitif
    expect(ctxCom.candidats[0].els.infinitif).toEqual('pêcher');
  });

  it('commande « pecher »', function (this: ThisContext) {
    // décomposition
    const ctxCom = this.ctxPartie.com.decomposerCommande('pecher');
    expect(ctxCom.candidats).toHaveSize(1);
    expect(ctxCom.candidats[0].els.infinitif).toEqual('pecher');
    // action trouvée
    const candidatsAction = this.actionsUtils.trouverActionPersonnalisee(ctxCom.candidats[0].els, undefined, undefined);

    expect(candidatsAction).toHaveSize(1);
    expect(candidatsAction[0].action.infinitif).toEqual('pêcher');
    expect(candidatsAction[0].action.infinitifSansAccent).toEqual('pecher');
  });

});

