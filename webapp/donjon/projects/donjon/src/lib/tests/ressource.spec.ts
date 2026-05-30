import { ClasseUtils, EClasseRacine } from "../../public-api";

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// =====================================================================================
//  RESSOURCE — objet quantifiable et consommable (hérite de objet)
//  [F057-Txxx]
// =====================================================================================

describe('Ressource — type & héritage (A)', () => {

  it('[F057-T100] « Le bois est une ressource » → objet, hérite ressource+objet, pas compteur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLe bois est une ressource ici.`);
    const bois = ctx.jeu.objets.find((o: any) => o.nom === 'bois');
    expect(bois).toBeDefined();
    expect(ClasseUtils.heriteDe(bois.classe, EClasseRacine.ressource)).toBeTrue();
    expect(ClasseUtils.heriteDe(bois.classe, EClasseRacine.objet)).toBeTrue();
    expect(ClasseUtils.heriteDe(bois.classe, EClasseRacine.compteur)).toBeFalse();
    // une ressource n'est PAS un compteur du jeu
    expect(ctx.jeu.compteurs.length).toBe(0);
  });

  it('[F057-T101] « Les fruits sont une ressource » → pluriel, hérite ressource', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLes fruits sont une ressource ici.`);
    const fruits = ctx.jeu.objets.find((o: any) => o.nom === 'fruits' || o.nom === 'fruit');
    expect(fruits).toBeDefined();
    expect(ClasseUtils.heriteDe(fruits.classe, EClasseRacine.ressource)).toBeTrue();
    expect(ClasseUtils.heriteDe(fruits.classe, EClasseRacine.objet)).toBeTrue();
  });

});

describe('Ressource — unité (B + D)', () => {

  it('[F057-T110] « exprimée en pièces » → unite=pièce, unites=pièces', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'argent est une ressource exprimée en pièces.`);
    const argent = ctx.jeu.objets.find((o: any) => o.nom === 'argent');
    expect(argent).toBeDefined();
    expect(argent.unite).toBe('pièce');
    expect(argent.unites).toBe('pièces');
  });

  it('[F057-T111] « avec l’unité litre » → unite=litre, unites=litres', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'essence est une ressource avec l'unité litre.`);
    const essence = ctx.jeu.objets.find((o: any) => o.nom === 'essence');
    expect(essence).toBeDefined();
    expect(essence.unite).toBe('litre');
    expect(essence.unites).toBe('litres');
  });

  it('[F057-T112] sans unité déclarée → unite null (défaut appliqué à l’affichage)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLe bois est une ressource.`);
    const bois = ctx.jeu.objets.find((o: any) => o.nom === 'bois');
    expect(bois).toBeDefined();
    expect(bois.unite).toBeNull();
  });

  it('[F057-T113] « Son unité est le litre » → unite=litre, unites=litres', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'essence est une ressource.\nSon unité est le litre.`);
    const essence = ctx.jeu.objets.find((o: any) => o.nom === 'essence');
    expect(essence).toBeDefined();
    expect(essence.unite).toBe('litre');
    expect(essence.unites).toBe('litres');
  });

});

describe('Ressource — quantité par défaut (type non placé = 0)', () => {

  it('[F057-T140] « Les fruits sont une ressource » (sans placement) → quantité 0 (pas illimité)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLes fruits sont une ressource.`);
    const fruits = ctx.jeu.objets.find((o: any) => o.nom === 'fruits' || o.nom === 'fruit');
    expect(fruits).toBeDefined();          // le type/gabarit persiste
    expect(fruits.quantite).toBe(0);       // mais 0 (pas -1 illimité)
  });

  it('[F057-T141] « Le bois est une ressource » (sans placement) → quantité 0', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLe bois est une ressource.`);
    const bois = ctx.jeu.objets.find((o: any) => o.nom === 'bois');
    expect(bois).toBeDefined();
    expect(bois.quantite).toBe(0);
  });

});

describe('Ressource — affichage avec unité (F)', () => {

  it('[F057-T150] affichage « 30 unités de bois » (unité par défaut via le placement)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLe bois est une ressource.\nIl y a 30 unités de bois ici.`
    );
    const sortie = ctx.com.executerCommande('regarder', false);
    expect(sortie.sortie).toContain('30 unités de bois');
  });

  it('[F057-T151] affichage « 5 pièces d’argent » (unité déclarée + élision)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nL'argent est une ressource exprimée en pièces.\nIl y a 5 pièces d'argent ici.`
    );
    const sortie = ctx.com.executerCommande('regarder', false);
    expect(sortie.sortie).toContain('5 pièces d’argent');
  });

  it('[F057-T152] sans unité (ressource plurielle) → compté par le nom « 5 fruits »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLes fruits sont une ressource.\nIl y a 5 fruits dans la salle.`
    );
    const sortie = ctx.com.executerCommande('regarder', false);
    expect(sortie.sortie).toContain('5 fruits');
  });

});

describe('Ressource — désambiguïsation par emplacement (H)', () => {

  it('[F057-T230] 2 piles mentionnées → question listant les emplacements', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLa table est un support ici.\nLa chaise est un support ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 5 pièces d'argent sur la table.\nIl y a 3 pièces d'argent sur la chaise.`
    );
    ctx.com.executerCommande('regarder', false);   // mentionne les deux piles (sur supports)
    const r: any = ctx.com.executerCommande('prendre les pièces', false);
    const choix = r?.questions?.QcmCeci?.Choix;
    expect(choix?.length).toBe(2);
    const libelles = (choix ?? []).map((c: any) => c.valeurs[0]).join(' | ');
    expect(libelles).toContain('table');
    expect(libelles).toContain('chaise');
  });

});

describe('Ressource — désigner par l’unité dans les commandes (G)', () => {

  const scenarioArgent =
    `La salle est un lieu.\nL'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent ici.`;

  it('[F057-T160] « prendre les pièces » (par l’unité) → 10 pièces dans l’inventaire', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `\n` + scenarioArgent);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre les pièces', false);
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(auJoueur.length).toBe(1);
    expect(auJoueur[0].quantite).toBe(10);
  });

  it('[F057-T161] « prendre 3 pièces d’argent » → 3 prises, 7 restantes', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `\n` + scenarioArgent);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre 3 pièces d’argent', false);
    const salle = ctx.jeu.lieux.find((l: any) => l.nom === 'salle');
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    const dansSalle = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === salle.id);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
    expect(dansSalle.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(7);
  });

  it('[F057-T162] « prendre les pièces d’argent » (unité + ressource) → 10 prises', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `\n` + scenarioArgent);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre les pièces d’argent', false);
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(10);
  });

  it('[F057-T163] « donner 3 pièces d’argent au marchand » → marchand 3, joueur 7', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLe marchand est une personne ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent ici.`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    ctx.com.executerCommande('donner 3 pièces d’argent au marchand', false);
    const marchand = ctx.jeu.objets.find((o: any) => o.nom === 'marchand');
    const auMarchand = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === marchand.id);
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(auMarchand.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(7);
  });

  it('[F057-T164] « lâcher les pièces » (après les avoir prises) → de retour dans le lieu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `\n` + scenarioArgent);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    ctx.com.executerCommande('lâcher les pièces', false);
    const salle = ctx.jeu.lieux.find((l: any) => l.nom === 'salle');
    const dansSalle = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === salle.id);
    expect(dansSalle.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(10);
  });

  it('[F057-T220] « déplacer les pièces d’argent depuis l’intérieur du coffre vers l’inventaire »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLe coffre est un contenant vu ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent dans le coffre.\n` +
      `action transferer:\n  déplacer les pièces d'argent depuis l'intérieur du coffre vers l'inventaire.\nfin action`
    );
    ctx.com.executerCommande('transferer', false);
    const coffre = ctx.jeu.objets.find((o: any) => o.nom === 'coffre');
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    const dansCoffre = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === coffre.id);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(10);
    expect(dansCoffre.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(0);
  });

  it('[F057-T221] « déplacer 5 pièces d’argent depuis l’inventaire vers le dessous du lit »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLe lit est un support vu ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent ici.\n` +
      `action cacher:\n  déplacer 5 pièces d'argent depuis l'inventaire vers le dessous du lit.\nfin action`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    ctx.com.executerCommande('cacher', false);
    const lit = ctx.jeu.objets.find((o: any) => o.nom === 'lit');
    const sousLit = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === lit.id);
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(sousLit.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(5);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(5);
  });

  it('[F057-T210] instruction « créer N <unité> de X dans Y » → crée N à la destination', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLe coffre est un contenant vu ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent ici.\n` +
      `action enrichir:\n  créer 3 pièces d'argent dans le coffre.\nfin action`
    );
    ctx.com.executerCommande('enrichir', false);
    const coffre = ctx.jeu.objets.find((o: any) => o.nom === 'coffre');
    const dansCoffre = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === coffre.id);
    expect(dansCoffre.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
  });

  it('[F057-T211] « créer 3 pièces d’argent dans l’inventaire » → 3 dans l’inventaire', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 10 pièces d'argent ici.\n` +
      `action enrichir:\n  créer 3 pièces d'argent dans l'inventaire.\nfin action`
    );
    ctx.com.executerCommande('enrichir', false);
    const auJoueur = ctx.jeu.objets.filter((o: any) => o.nom === 'argent' && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
  });

  it('[F057-T200] instruction « consommer N <unité> de X » → retire N de l’inventaire', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nL'essence est une ressource.\nIl y a 8 unités d'essence ici.\n` +
      `action gaspiller:\n  consommer 5 unités d'essence.\nfin action`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande("prendre les unités d'essence", false);
    ctx.com.executerCommande('gaspiller', false);
    const essence = ctx.jeu.objets.filter((o: any) => o.nom === 'essence');
    expect(essence.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
  });

  it('[F057-T201] « consommer » plus que disponible → échec, rien retiré', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nL'essence est une ressource.\nIl y a 8 unités d'essence ici.\n` +
      `action gaspiller:\n  consommer 20 unités d'essence.\nfin action`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande("prendre les unités d'essence", false);
    ctx.com.executerCommande('gaspiller', false);
    const essence = ctx.jeu.objets.filter((o: any) => o.nom === 'essence');
    expect(essence.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(8);
  });

  it('[F057-T202] « consommer » tout → l’exemplaire est supprimé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nL'essence est une ressource.\nIl y a 8 unités d'essence ici.\n` +
      `action gaspiller:\n  consommer 8 unités d'essence.\nfin action`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande("prendre les unités d'essence", false);
    ctx.com.executerCommande('gaspiller', false);
    const essence = ctx.jeu.objets.filter((o: any) => o.nom === 'essence');
    expect(essence.length).toBe(0);
  });

  it('[F057-T165] « déposer 2 fruits sur la table » (déposer = poser par défaut) → 2 sur la table, 3 gardés', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      actions + `\nLa salle est un lieu.\nLa table est un support ici.\n` +
      `Les fruits sont une ressource.\nIl y a 5 fruits dans la salle.`
    );
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les fruits', false);
    ctx.com.executerCommande('déposer 2 fruits sur la table', false);
    const table = ctx.jeu.objets.find((o: any) => o.nom === 'table');
    const surTable = ctx.jeu.objets.filter((o: any) => (o.nom === 'fruits' || o.nom === 'fruit') && o.position?.cibleId === table.id);
    const auJoueur = ctx.jeu.objets.filter((o: any) => (o.nom === 'fruits' || o.nom === 'fruit') && o.position?.cibleId === ctx.jeu.joueur.id);
    expect(surTable.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(2);
    expect(auJoueur.reduce((s: number, o: any) => s + o.quantite, 0)).toBe(3);
  });

});

describe('Ressource — placement quantifié & multi-emplacements (C)', () => {

  it('[F057-T120] def + « Il y a 5 bois dans le coffre » → quantité 5 reportée, reste ressource', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe coffre est un contenant ici.\nLe bois est une ressource.\nIl y a 5 bois dans le coffre.`
    );
    const bois = ctx.jeu.objets.filter((o: any) => o.nom === 'bois');
    expect(bois.length).toBe(1);
    expect(bois[0].quantite).toBe(5);
    expect(ClasseUtils.heriteDe(bois[0].classe, EClasseRacine.ressource)).toBeTrue();
    const coffre = ctx.jeu.objets.find((o: any) => o.nom === 'coffre');
    expect(bois[0].position?.cibleId).toBe(coffre.id);
  });

  it('[F057-T121] 2 emplacements → 2 exemplaires distincts (5 / 3), chacun ressource', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe coffre est un contenant ici.\nLa table est un support ici.\n` +
      `Le bois est une ressource.\nIl y a 5 bois dans le coffre.\nIl y a 3 bois sur la table.`
    );
    const bois = ctx.jeu.objets.filter((o: any) => o.nom === 'bois');
    expect(bois.length).toBe(2);
    const quantites = bois.map((o: any) => o.quantite).sort((a: number, b: number) => a - b);
    expect(quantites).toEqual([3, 5]);
    bois.forEach((o: any) => expect(ClasseUtils.heriteDe(o.classe, EClasseRacine.ressource)).toBeTrue());
    // emplacements distincts
    const coffre = ctx.jeu.objets.find((o: any) => o.nom === 'coffre');
    const table = ctx.jeu.objets.find((o: any) => o.nom === 'table');
    const cibles = bois.map((o: any) => o.position?.cibleId).sort();
    expect(cibles).toEqual([coffre.id, table.id].sort());
  });

  it('[F057-T122] placement l’emporte sur l’illimité (« Les fruits sont une ressource »)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe coffre est un contenant ici.\nLes fruits sont une ressource.\nIl y a 5 fruits dans le coffre.`
    );
    const fruits = ctx.jeu.objets.filter((o: any) => o.nom === 'fruits' || o.nom === 'fruit');
    expect(fruits.length).toBe(1);
    expect(fruits[0].quantite).toBe(5);
  });

});

describe('Ressource — forme « N <unité> de <ressource> » (C4)', () => {

  it('[F057-T130] « Il y a 30 unités de bois ici » (unité par défaut) → bois q=30 dans le lieu', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe bois est une ressource.\nIl y a 30 unités de bois ici.`
    );
    const bois = ctx.jeu.objets.filter((o: any) => o.nom === 'bois');
    expect(bois.length).toBe(1);
    expect(bois[0].quantite).toBe(30);
    expect(ClasseUtils.heriteDe(bois[0].classe, EClasseRacine.ressource)).toBeTrue();
    const salle = ctx.jeu.lieux.find((l: any) => l.nom === 'salle');
    expect(bois[0].position?.cibleId).toBe(salle.id);
  });

  it('[F057-T131] « Il y a 5 pièces d’argent dans le coffre » (unité déclarée) → argent q=5, unité', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe coffre est un contenant ici.\nL'argent est une ressource exprimée en pièces.\nIl y a 5 pièces d'argent dans le coffre.`
    );
    const argent = ctx.jeu.objets.filter((o: any) => o.nom === 'argent');
    expect(argent.length).toBe(1);
    expect(argent[0].quantite).toBe(5);
    expect(argent[0].unite).toBe('pièce');
    expect(argent[0].unites).toBe('pièces');
    const coffre = ctx.jeu.objets.find((o: any) => o.nom === 'coffre');
    expect(argent[0].position?.cibleId).toBe(coffre.id);
  });

  it('[F057-T132] forme unité multi-emplacements → 2 exemplaires distincts (5 / 3)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe coffre est un contenant ici.\nLa table est un support ici.\n` +
      `L'argent est une ressource exprimée en pièces.\nIl y a 5 pièces d'argent dans le coffre.\nIl y a 3 pièces d'argent sur la table.`
    );
    const argent = ctx.jeu.objets.filter((o: any) => o.nom === 'argent');
    expect(argent.length).toBe(2);
    const quantites = argent.map((o: any) => o.quantite).sort((a: number, b: number) => a - b);
    expect(quantites).toEqual([3, 5]);
    argent.forEach((o: any) => expect(o.unites).toBe('pièces'));
  });

  it('[F057-T133] « Il y a 5 pommes de terre » (pas une ressource définie) → erreur d’auteur', () => {
    // « Il y a … » est réservé aux ressources définies ; un objet ordinaire se déclare via
    //  « … est un objet ici ». Référencer un non-ressource via « Il y a » est une erreur.
    expect(() => TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe panier est un contenant ici.\nIl y a 5 pommes de terre dans le panier.`
    )).toThrowError(/Ressource attendue/);
  });

});

describe('Ressource — attributs de la définition = états par défaut de la classe (A)', () => {

  it('[F057-T170] les adjectifs de la définition deviennent les états par défaut de la classe ressource', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLes pommes sont des ressources mangeables, rouges et vertes ici.`
    );
    const classe = ctx.jeu.classes.find((c: any) => c.nom === 'pomme');
    expect(classe).toBeDefined();
    // les états sont stockés tels qu'écrits dans la définition (au pluriel, comme pour toute
    //  classe utilisateur) ; le moteur les normalise au singulier en les appliquant aux éléments
    //  (cf. T171). Le pseudo-attribut « initialisé à N » n'en fait pas partie.
    expect(classe.etats).toEqual(['mangeables', 'rouges', 'vertes']);
  });

  it('[F057-T171] une pile distincte (sans attributs propres) hérite des états de la classe', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nLe panier est un contenant ici.\n` +
      `Les pommes sont des ressources mangeables, rouges et vertes.\nIl y a 3 pommes dans le panier.`
    );
    const panier = ctx.jeu.objets.find((o: any) => o.nom === 'panier');
    // la pile placée dans le panier ne porte aucun attribut explicite : ses états ne peuvent
    //  venir que de la classe « pomme » (héritage via attribuerEtatsParDefaut).
    const pile = ctx.jeu.objets.find((o: any) =>
      (o.nom === 'pommes' || o.nom === 'pomme') && o.position?.cibleId === panier.id);
    expect(pile).toBeDefined();
    expect(pile.quantite).toBe(3);
    expect(ctx.jeu.etats.possedeEtatElement(pile, 'mangeable', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(pile, 'rouge', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(pile, 'vert', ctx.eju)).toBeTrue();
  });

});

describe('Ressource — placement sur un support déclaré après la ressource (C)', () => {

  it('[F057-T180] « Il y a N pommes dessus » : 1re pile sur muret (déclaré après) ET 2e pile sur table', () => {
    // La 1re pile fusionne sur la définition « pomme » (placée tôt) → sa position « sur muret »
    //  référence un support déclaré APRÈS : la résolution doit être différée (2e passe).
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `Une pomme est une ressource mangeable.\n` +
      `Le verger est un lieu.\n` +
      `Le muret est un support ici.\n` +
      `Il y a 2 pommes dessus.\n` +
      `La table est un support dans le verger.\n` +
      `Il y a 3 pommes dessus.`
    );
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    const muret = ctx.jeu.objets.find((o: any) => o.nom === 'muret');
    const table = ctx.jeu.objets.find((o: any) => o.nom === 'table');
    expect(muret).toBeDefined();
    expect(table).toBeDefined();

    // pile sur le muret (placement différé) : quantité 2 + état « disponible » bien appliqué
    const pileMuret = ctx.jeu.objets.find((o: any) => o.nom === 'pomme' && o.position?.cibleId === muret.id);
    expect(pileMuret).toBeDefined();
    expect(pileMuret.quantite).toBe(2);
    expect(ctx.jeu.etats.possedeEtatElement(pileMuret, 'disponible', ctx.eju)).toBeTrue();

    // pile sur la table (résolue en ligne) : quantité 3
    const pileTable = ctx.jeu.objets.find((o: any) => o.nom === 'pomme' && o.position?.cibleId === table.id);
    expect(pileTable).toBeDefined();
    expect(pileTable.quantite).toBe(3);
  });

  it('[F057-T181] cible réellement inexistante → erreur « position pas trouvée » (non avalée)', () => {
    // Le placement différé ne doit PAS masquer une vraie faute d'auteur : « tabouret » n'existe pas.
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `La salle est un lieu.\nUne pomme est une ressource mangeable.\nIl y a 2 pommes sur le tabouret.`
    );
    expect(ctx.jeu.tamponErreurs.some((e: string) => /position pas trouvée/i.test(e))).toBeTrue();
  });

});
