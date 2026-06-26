import { TestUtils } from "../utils/test-utils";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F100] liste-etats.ts — application / retrait / cascade d'états en cours de partie
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    Couvre ListeEtats : bascule (ouvert/fermé), réintroduction de l'opposé au retrait d'une bascule,
//    cascade de groupe (solide/liquide/gazeux), cascade de contradiction (exclut), cascade d'implication
//    (implique), états calculés non modifiables (erreur), et les attributs calculés branchés sur la classe
//    de l'élément : vide (contenant), visible/accessible (objet dans un contenant fermé/opaque ou secret).
//    Assertions via ctx.jeu.etats.possedeEtatElement(...) avant/après « changer ... ».
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('F100 — ListeEtats (application / retrait / cascade)', () => {

  // ————————————————————————————————————————————————————————————————————————
  //  BASCULE de base : ouvert / fermé
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T001] bascule : changer ouvert retire fermé (et inversement)', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le coffre est un contenant fermé dans le salon.
action tester:
  changer le coffre est ouvert.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const coffre = ctx.jeu.objets.find(o => o.nom === 'coffre');
    // précondition : le coffre est fermé à la compilation
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'fermé', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'ouvert', ctx.eju)).toBeFalse();

    ctx.com.executerCommande("tester", false);

    // poser « ouvert » retire automatiquement « fermé » (bascule)
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'ouvert', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'fermé', ctx.eju)).toBeFalse();
  });

  it('[F100-T002] bascule : retirer un membre réintroduit l\'opposé (n\'est plus fermé → ouvert)', () => {
    // retirerEtatElement : retirer un membre d'une bascule pousse automatiquement l'autre membre.
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le coffre est un contenant fermé dans le salon.
action tester:
  changer le coffre n'est plus fermé.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const coffre = ctx.jeu.objets.find(o => o.nom === 'coffre');
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'fermé', ctx.eju)).toBeTrue();

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'fermé', ctx.eju)).toBeFalse();
    // l'opposé de la bascule est réintroduit : le coffre devient ouvert
    expect(ctx.jeu.etats.possedeEtatElement(coffre, 'ouvert', ctx.eju)).toBeTrue();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  CASCADE de GROUPE : solide / liquide / gazeux (groupe intégré)
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T003] groupe : poser un membre retire les autres membres du groupe', () => {
    // Groupe personnalisé (3 états mutuellement exclusifs via « se contredisent »).
    const scenario = `
roche, sable et boue se contredisent.
le labo est un lieu.
le joueur se trouve dans le labo.
la motte est un objet roche dans le labo.
action tester:
  changer la motte est boue.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const motte = ctx.jeu.objets.find(o => o.nom === 'motte');
    expect(ctx.jeu.etats.possedeEtatElement(motte, 'roche', ctx.eju)).toBeTrue();

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(motte, 'boue', ctx.eju)).toBeTrue();
    // les autres membres du groupe sont retirés en cascade
    expect(ctx.jeu.etats.possedeEtatElement(motte, 'roche', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(motte, 'sable', ctx.eju)).toBeFalse();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  CASCADE de CONTRADICTION : « exclut » (états personnalisés)
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T004] contradiction : poser un état retire l\'état contraire déjà présent', () => {
    const scenario = `
parfait est un état.
abimé est un état.
parfait exclut abimé.
le atelier est un lieu.
le joueur se trouve dans le atelier.
le vase est un objet abimé dans le atelier.
action tester:
  changer le vase est parfait.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const vase = ctx.jeu.objets.find(o => o.nom === 'vase');
    expect(ctx.jeu.etats.possedeEtatElement(vase, 'abimé', ctx.eju)).toBeTrue();

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(vase, 'parfait', ctx.eju)).toBeTrue();
    // la contradiction présente est retirée en cascade
    expect(ctx.jeu.etats.possedeEtatElement(vase, 'abimé', ctx.eju)).toBeFalse();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  CASCADE d'IMPLICATION : « implique » (états personnalisés)
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T005] implication : poser un état applique aussi l\'état impliqué', () => {
    const scenario = `
brillant est un état.
poli est un état.
brillant implique poli.
le hall est un lieu.
le joueur se trouve dans le hall.
le bouclier est un objet dans le hall.
action tester:
  changer le bouclier est brillant.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const bouclier = ctx.jeu.objets.find(o => o.nom === 'bouclier');
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, 'brillant', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, 'poli', ctx.eju)).toBeFalse();

    ctx.com.executerCommande("tester", false);

    expect(ctx.jeu.etats.possedeEtatElement(bouclier, 'brillant', ctx.eju)).toBeTrue();
    // l'état impliqué est appliqué en cascade
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, 'poli', ctx.eju)).toBeTrue();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  ÉTAT CALCULÉ : non modifiable directement → erreur
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T006] état calculé : « changer ... est vide » émet une erreur (non modifiable)', () => {
    const scenario = `
la cave est un lieu.
le joueur se trouve dans la cave.
le seau est un contenant dans la cave.
action tester:
  changer le seau est vide.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);

    // « vide » est un état calculé : la modification directe pousse une erreur
    expect(ctx.jeu.tamponErreurs.some(e => /calculé/.test(e))).toBeTrue();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  ATTRIBUT CALCULÉ « vide » branché sur la classe (contenant)
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T007] vide (contenant) : true quand vide, false quand un objet est dedans', () => {
    const scenarioVide = `
le cellier est un lieu.
le joueur se trouve dans le cellier.
le panier est un contenant ouvert dans le cellier.`;
    const ctxVide = TestUtils.genererEtCommencerLeJeu(scenarioVide);
    const panierVide = ctxVide.jeu.objets.find(o => o.nom === 'panier');
    expect(ctxVide.jeu.etats.possedeEtatElement(panierVide, 'vide', ctxVide.eju)).toBeTrue();

    const scenarioPlein = `
le cellier est un lieu.
le joueur se trouve dans le cellier.
le panier est un contenant ouvert dans le cellier.
la pomme est un objet dans le panier.`;
    const ctxPlein = TestUtils.genererEtCommencerLeJeu(scenarioPlein);
    const panierPlein = ctxPlein.jeu.objets.find(o => o.nom === 'panier');
    expect(ctxPlein.jeu.etats.possedeEtatElement(panierPlein, 'vide', ctxPlein.eju)).toBeFalse();
  });

  // ————————————————————————————————————————————————————————————————————————
  //  ATTRIBUT CALCULÉ « visible » / « accessible » branché sur la classe (objet)
  // ————————————————————————————————————————————————————————————————————————

  it('[F100-T008] visible/accessible : objet dans un contenant fermé et opaque non visible', () => {
    const scenario = `
le grenier est un lieu.
le joueur se trouve dans le grenier.
le coffre est un contenant fermé et opaque dans le grenier.
la bague est un objet dans le coffre.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const bague = ctx.jeu.objets.find(o => o.nom === 'bague');
    // contenant fermé + opaque -> ni visible ni accessible
    expect(ctx.jeu.etats.possedeEtatElement(bague, 'visible', ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(bague, 'accessible', ctx.eju)).toBeFalse();
  });

  it('[F100-T009] visible : objet posé directement dans le lieu est visible', () => {
    const scenario = `
le jardin est un lieu.
le joueur se trouve dans le jardin.
la cle est un objet dans le jardin.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const cle = ctx.jeu.objets.find(o => o.nom === 'cle');
    expect(ctx.jeu.etats.possedeEtatElement(cle, 'visible', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(cle, 'accessible', ctx.eju)).toBeTrue();
  });

});
