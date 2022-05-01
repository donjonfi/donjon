import { CompilateurBeta, ExprReg, Generateur } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";

describe('Expressions régulières', () => {

  it('expression « le fermier concernant le baton »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementSimple.exec('le fermier concernant le baton');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('fermier'); // nom
    expect(resultat[3]).toBeUndefined(); // épithète
    expect(resultat[4]).toEqual('concernant'); // préposition
    expect(resultat[5]).toEqual('le '); // déterminant
    expect(resultat[6]).toEqual('baton'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });

  it('expression « le fermier à propos du baton »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementSimple.exec('le fermier à propos du baton');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('fermier'); // nom
    expect(resultat[3]).toBeUndefined(); // épithète
    expect(resultat[4]).toEqual('à propos'); // préposition
    expect(resultat[5]).toEqual('du '); // déterminant
    expect(resultat[6]).toEqual('baton'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });

  it('expression « magicien à propos d’une fiole »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementSimple.exec('magicien à propos d’une fiole');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toBeFalsy(); // déterminant
    expect(resultat[2]).toEqual('magicien'); // nom
    expect(resultat[3]).toBeUndefined(); // épithète
    expect(resultat[4]).toEqual('à propos'); // préposition
    expect(resultat[5]).toEqual('une '); // déterminant
    expect(resultat[6]).toEqual('fiole'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });

  it('expression « le baton du fermier sur la table »', () => {
    const resultat = ExprReg.xComplementComposePrepositionComplementSimple.exec('le baton du fermier sur la table');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('baton du fermier'); // nom
    expect(resultat[3]).toBeUndefined(); // épithète
    expect(resultat[4]).toEqual('sur'); // préposition
    expect(resultat[5]).toEqual('la '); // déterminant
    expect(resultat[6]).toEqual('table'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });

  it('expression « le baton du fermier sur la table basse »', () => {
    const resultat = ExprReg.xComplementComposePrepositionComplementSimple.exec('le baton du fermier sur la table basse');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('baton du fermier'); // nom
    expect(resultat[3]).toBeUndefined(); // épithète
    expect(resultat[4]).toEqual('sur'); // préposition
    expect(resultat[5]).toEqual('la '); // déterminant
    expect(resultat[6]).toEqual('table'); // nom
    expect(resultat[7]).toEqual('basse'); // épithète
  });

  it('expression « le baton du fermier colérique sur la table de la basse-cour »', () => {
    const resultat = ExprReg.xComplementComposePrepositionComplementCompose.exec('le baton du fermier colérique sur la table de la basse-cour');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('baton du fermier'); // nom
    expect(resultat[3]).toEqual('colérique'); // épithète
    expect(resultat[4]).toEqual('sur'); // préposition
    expect(resultat[5]).toEqual('la '); // déterminant
    expect(resultat[6]).toEqual('table de la basse-cour'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });


  it('expression « des petits pois dans la marmite »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementSimple.exec('des petits pois dans la marmite');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('des '); // déterminant
    expect(resultat[2]).toEqual('petits'); // nom
    expect(resultat[3]).toEqual('pois'); // épithète
    expect(resultat[4]).toEqual('dans'); // préposition
    expect(resultat[5]).toEqual('la '); // déterminant
    expect(resultat[6]).toEqual('marmite'); // nom
    expect(resultat[7]).toBeUndefined(); // épithète
  });

  it('expression « le capitaine à propos de carte aux trésors »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementCompose.exec('le capitaine à propos de carte aux trésors');
    expect(resultat).toBeTruthy();
    expect(resultat[1]).toEqual('le '); // déterminant
    expect(resultat[2]).toEqual('capitaine'); // nom
    expect(resultat[3]).toBeFalsy() // épithète
    expect(resultat[4]).toEqual('à propos'); // préposition
    expect(resultat[5]).toEqual('de '); // déterminant
    expect(resultat[6]).toEqual('carte aux trésors'); // nom
    expect(resultat[7]).toBeFalsy(); // épithète
  });

  it('expression « magicien à propos d’une fiole »', () => {
    const resultat = ExprReg.xComplementSimplePrepositionComplementSimple.exec('magicien à propos d’une fiole')
    expect(resultat[1]).toBeFalsy() // déterminant
    expect(resultat[2]).toEqual('magicien'); // nom
    expect(resultat[3]).toBeFalsy() // épithète
    expect(resultat[4]).toEqual('à propos'); // préposition
    expect(resultat[5]).toEqual('une '); // déterminant
    expect(resultat[6]).toEqual('fiole'); // nom
    expect(resultat[7]).toBeFalsy(); // épithète
  });

});

describe('Nombre prépositions fin commande', () => {

  it('fin: magicien à propos d’une fiole', () => {
    const nbPrepositionsTrouvees = ('magicien à propos d’une fiole'.match(ExprReg.xPrepositions) || []).length;
    expect(nbPrepositionsTrouvees).toEqual(1);
  });

  it('fin: le fermier à propos du baton', () => {
    const nbPrepositionsTrouvees = ('le fermier à propos du baton'.match(ExprReg.xPrepositions) || []).length;
    expect(nbPrepositionsTrouvees).toEqual(1);
  });

});

describe('Décomposer commande parler', () => {

  it('commande « parler avec le fermier concernant le baton »', () => {

    const scenario =
      ' ' +
      '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    const ctxCom = ctxPartie.com.decomposerCommande('parler avec le fermier concernant le baton');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('fermier');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('baton');
  });

  it('commande « parler avec le fermier à propos du baton »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler avec le fermier à propos du baton');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('fermier');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('du ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('baton');
  });

  it('commande « parler du baton avec le fermier »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler du baton avec le fermier');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('fermier');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('baton');
  });

  it('commande « parler du poisson rouge avec le pécheur énervé »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler du poisson rouge avec le pécheur énervé');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('pécheur');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('énervé');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('poisson');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('rouge');
  });

  it('commande « parler de la couronne magique avec le sorcier enflammé »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler de la couronne magique avec le sorcier enflammé');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('sorcier');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('enflammé');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('couronne');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('magique');
  });

  it('commande « discuter de la table à manger avec le comte du bois »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('discuter de la table à manger avec le comte du bois');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('discuter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('comte du bois');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('table à manger');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler au marchand ambulant concernant l’argent perdu »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler au marchand ambulant concernant l’argent perdu');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('marchand');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('ambulant')
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('l’');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('argent');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('perdu');
  });


  it('commande «  discuter avec le coq au vin à propos de l’assaisonement »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('discuter avec le coq au vin à propos de l’assaisonement');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('discuter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('coq au vin');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('de l’');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('assaisonement');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande «  parler à pigeon intelligent concernant miettes de pain rassies »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler à pigeon intelligent concernant miettes de pain rassies');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('pigeon');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('intelligent')
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('miettes de pain');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('rassies');
  });

  it('commande «  parler avec le capitaine à propos de carte aux trésors »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler avec le capitaine à propos de carte aux trésors');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('capitaine');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('carte aux trésors');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande «  discuter avec le capitaine du bateau endormi concernant la cabine de navigation ensanglantée »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('discuter avec le capitaine du bateau endormi concernant la cabine de navigation ensanglantée');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('discuter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('capitaine du bateau');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('endormi');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('cabine de navigation');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('ensanglantée');
  });

  it('commande «  interroger le fermier concernant la poule »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('interroger le fermier concernant la poule');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('interroger');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('fermier');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('poule');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « questionner le fermier géant à propos de la poule rousse »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('questionner le fermier géant à propos de la poule rousse');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('questionner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('fermier');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('géant');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('de la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('poule');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('rousse');
  });

  it('commande « questionner le boulanger sur de la farine grise »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('questionner le boulanger sur de la farine grise');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('questionner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('boulanger');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('de la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('farine');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('grise');
  });

  it('commande « questionner le marchand d’armes concernant une épée magique »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('questionner le marchand d\'armes concernant une épée magique');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('questionner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('marchand d\'armes');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('une ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('épée');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('magique');
  });

  it('commande « interroger elf sur de l’eau douce »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('interroger elf sur de l’eau douce');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('interroger');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('elf');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('de l’');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('eau');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('douce');
  });

  it('commande « interroger le comte du bois sauvage sur les elfs aux pouvoirs maléfiques »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('interroger le comte du bois sauvage sur les elfs aux pouvoirs maléfiques');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('interroger');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ')
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('comte du bois');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('sauvage');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('les ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('elfs aux pouvoirs');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('maléfiques');
  });

  it('commande « questionner les lutins concernant du bois à brûler »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('questionner les lutins concernant du bois à brûler');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('questionner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('les ')
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('lutins');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('du ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('bois à brûler');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « interroger Dracula à propos d’une fiole »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('interroger Dracula à propos d’une fiole');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
    expect(ctxCom.candidats[0].els.infinitif).toEqual('interroger');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('Dracula');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('une ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('fiole');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande «  montrer poisson au chat »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    const ctxCom = ctxPartie.com.decomposerCommande('montrer poisson au chat');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('montrer');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('poisson');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('au');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('chat');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande «  montrer poisson au chat »', function () {

    const scenario = 'Le poisson au chat est un animal. ';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    const ctxCom = ctxPartie.com.decomposerCommande('montrer poisson au chat');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('montrer');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('poisson au chat');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();

  });

  it('commande «  donner la pièce du trésor maudit à la princesse aux souhaits énervée »', function () {

    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    const ctxCom = ctxPartie.com.decomposerCommande('donner la pièce du trésor maudit à la princesse aux souhaits énervée');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('donner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('pièce du trésor');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('maudit');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ')
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('princesse aux souhaits');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('énervée');

  });

  it('commande « donner une pièce à la princesse »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('donner une pièce à la princesse');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('donner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('une ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('pièce');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('princesse');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();

    expect(ctxCom.candidats[1].els.infinitif).toEqual('donner');
    // préposition0
    expect(ctxCom.candidats[1].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[1].els.sujet.determinant).toEqual('une ');
    expect(ctxCom.candidats[1].els.sujet.nom).toEqual('pièce à la princesse');
    expect(ctxCom.candidats[1].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[1].els.preposition1).toBeFalsy();
    // interlocuteur
    expect(ctxCom.candidats[1].isCelaV1).toBeFalse();
  });

  it('commande « demander de la nourriture à l’aubergiste »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('demander de la nourriture à l’aubergiste');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('demander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('de');
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('nourriture');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('l’');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('aubergiste');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « commander poison à vendeur ambulant »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('commander poison à vendeur ambulant');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('commander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('poison');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('vendeur');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('ambulant');
  });

  it('commande « parler du somnifère au magicien »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler du somnifère au magicien');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicien');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('somnifère');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });


  it('commande « parler du somnifère au magicien »', function () {
    const scenario = 'Le somnifère au magicien est un objet.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler du somnifère au magicien');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('concernant');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('somnifère au magicien');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeFalse();
  });

  it('commande « parler d’une fiole de poison au magicien maléfique »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler d’une fiole de poison au magicien maléfique');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicien');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('maléfique');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('une ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('fiole de poison');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler magicien à propos d’une fiole »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler magicien à propos d’une fiole');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicien');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('une ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('fiole');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « donner saucisse à griller à vendeur »', function () {
    const scenario = 'La saucisse à griller est un objet.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('donner saucisse à griller à vendeur');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('donner');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('saucisse à griller');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('vendeur');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « montrer saucisse à griller à vendeur à viande »', function () {
    const scenario = 'La saucisse à griller est un objet.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('montrer saucisse à griller à vendeur à viande');
    expect(ctxCom.candidats.length).toEqual(1);

    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('montrer');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('saucisse à griller');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('vendeur à viande');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler de manger à l’aubergiste »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler de manger à l’aubergiste');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('l’');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('aubergiste');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy()
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('manger');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });


  it('commande « demander à manger à l’aubergiste »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('demander à manger à l’aubergiste');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('demander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeUndefined();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('à manger');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('l’');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('aubergiste');
  });

  it('commande « demander à boire au tavernier »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('demander à boire au tavernier');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('demander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeUndefined();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('à boire');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('au');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('tavernier');
  });


  it('commande « demander à dormir longtemps à l’aubergiste cupide »', function () {
    const scenario = '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('demander à dormir longtemps à l’aubergiste cupide');
    expect(ctxCom.candidats.length).toEqual(1);

    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('demander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeUndefined();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('à dormir');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('longtemps');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('l’')
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('aubergiste');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('cupide');
  });

  it('commande « demander à l’aubergiste à dormir »', function () {
    const scenario = 'demander ceci à cela est une action. ' +
      'L\'aubergiste est une personne. ';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('demander à l’aubergiste à dormir');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    // DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER SUJET *À* INTERLOCUTEUR
    expect(ctxCom.candidats[0].els.infinitif).toEqual('demander');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toBeFalsy();
    // sujet
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('à dormir');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('à');
    // interlocuteur
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('l’')
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('aubergiste');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler à mousse de mat »', function () {
    const scenario = 'Le mousse est une personne.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler à mousse de mat');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('mousse');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('mat');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler avec la magicienne étourdie du sort raté »', function () {
    const scenario = 'Le magicien est une personne.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler avec la magicienne étourdie du sort raté');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicienne');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('étourdie');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy()
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('sort');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('raté')
  });

  it('commande « discuter avec Jean-Paul de Jason »', function () {
    const scenario = 'Jean-Paul est une personne. ';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('discuter avec Jean-Paul de Jason');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('discuter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('Jean-Paul');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('Jason');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler au magicien de la potion de vie »', function () {
    const scenario = 'Le magicien est une personne.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler au magicien de la potion de vie');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicien');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('potion de vie');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toBeFalsy();
  });

  it('commande « parler au magicien du bois de la potion magique »', function () {
    const scenario = 'Le magicien du bois est une personne.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('parler au magicien du bois de la potion magique');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeFalsy();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('magicien du bois');
    expect(ctxCom.candidats[0].els.sujet.epithete).toBeFalsy();
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('potion');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('magique');
  });

  it('commande « discuter avec le comte Dracula de la tournure inatendue »', function () {
    const scenario = 'Le magicien du bois est une personne.';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    const ctxCom = ctxPartie.com.decomposerCommande('discuter avec le comte Dracula de la tournure inatendue');
    expect(ctxCom.candidats.length).toEqual(1);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('discuter');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toEqual('le ')
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('comte');
    expect(ctxCom.candidats[0].els.sujet.epithete).toEqual('Dracula')
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('tournure');
    expect(ctxCom.candidats[0].els.sujetComplement1.epithete).toEqual('inatendue');
  });




  it('commande « parler de la table à langer aux parents »', function () {

    const scenario =
      'La table à langer est un support. ' +
      'Les parents sont des personnes. ' +
      '';
    const rc = CompilateurBeta.analyserScenarioSansChargerCommandes(scenario, false);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);

    const ctxCom = ctxPartie.com.decomposerCommande('parler de la table à langer aux parents');
    expect(ctxCom.candidats.length).toEqual(2);
    expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);
    // infinitif
    // PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
    expect(ctxCom.candidats[0].els.infinitif).toEqual('parler');
    // préposition0
    expect(ctxCom.candidats[0].els.preposition0).toEqual('avec');
    // interlocuteur
    expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujet.determinant).toBeUndefined();
    expect(ctxCom.candidats[0].els.sujet.nom).toEqual('parents');
    // préposition1
    expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
    // sujet
    expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
    expect(ctxCom.candidats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(ctxCom.candidats[0].els.sujetComplement1.nom).toEqual('table à langer');
  });



});