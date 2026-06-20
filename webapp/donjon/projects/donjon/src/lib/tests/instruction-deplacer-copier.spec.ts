import { TestUtils } from "../utils/test-utils";
import { EEtatsBase } from "../models/commun/constantes";

// [F102] Instructions « déplacer » / « copier » (instruction-deplacer-copier.ts)
//
// Couverture des branches de déplacement/copie : vers contenant (dans), vers support (sur),
// vers le joueur/inventaire (possède), vers un lieu (present/disponible), regroupement de
// quantités (piles), duplication (copier) et messages d'échec (destination/sujet introuvable).
//
// Syntaxe DSL reprise telle quelle des specs déjà verts (instructions-exemples-wiki.spec.ts,
// F059-fond.spec.ts) : « déplacer X dans Y », « déplacer X sur Y », « déplacer X vers le joueur »,
// « copier X dans Y », et les conditions « si X se trouve dans/sur Y ».

describe("[F102] instruction déplacer / copier", () => {

  /** Trouve un objet du jeu par son nom (premier exemplaire). */
  const obj = (ctx: any, nom: string) => ctx.jeu.objets.find((o: any) => o.nom === nom);

  it("[F102-T001] déplacer X dans un contenant : sortie + position vers le contenant", () => {
    const scenario = `
L'entrepôt est un lieu.
La caisse est un contenant ouvert dans l'entrepôt.
La clé est un objet dans l'entrepôt.
Le joueur est dans l'entrepôt.

action tester:
  déplacer la clé dans la caisse.
  si la clé se trouve dans la caisse, dire "Clé rangée.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("Clé rangée");
    // remarque : objet.nom est la forme sans accent (« cle »), l'accent vit dans intitule.
    const caisse = obj(ctx, "caisse");
    const cle = obj(ctx, "cle");
    expect(cle.position.cibleId).toEqual(caisse.id);
  });

  it("[F102-T002] déplacer X sur un support : sortie + position vers le support", () => {
    const scenario = `
L'atelier est un lieu.
L'établi est un support dans l'atelier.
La lampe est un objet dans l'atelier.
Le joueur est dans l'atelier.

action tester:
  déplacer la lampe sur l'établi.
  si la lampe se trouve sur l'établi, dire "Lampe posée.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("Lampe posée");
    const etabli = obj(ctx, "etabli");
    const lampe = obj(ctx, "lampe");
    expect(lampe.position.cibleId).toEqual(etabli.id);
  });

  it("[F102-T003] déplacer X vers le joueur : l'objet devient possédé", () => {
    const scenario = `
Le salon est un lieu.
Le coffre est un contenant ouvert dans le salon.
Le caillou est un objet dans le coffre.
Le joueur est dans le salon.

action tester:
  déplacer le caillou vers le joueur.
  si le joueur possède le caillou, dire "Caillou pris.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("Caillou pris");
    const caillou = obj(ctx, "caillou");
    expect(ctx.jeu.etats.possedeEtatElement(caillou, EEtatsBase.possede, ctx.eju)).toBeTrue();
  });

  it("[F102-T004] déplacer X vers l'inventaire : l'objet devient possédé", () => {
    const scenario = `
Le salon est un lieu.
Le coffre est un contenant ouvert dans le salon.
Le caillou est un objet dans le coffre.
Le joueur est dans le salon.

action tester:
  déplacer le caillou vers l'inventaire.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);
    const caillou = obj(ctx, "caillou");
    expect(ctx.jeu.etats.possedeEtatElement(caillou, EEtatsBase.possede, ctx.eju)).toBeTrue();
  });

  it("[F102-T005] déplacer X dans un lieu : objet présent dans ce lieu, plus possédé", () => {
    const scenario = `
La cave est un lieu.
Le grenier est un lieu. Il est au nord de la cave.
La torche est un objet dans le grenier.
Le joueur est dans la cave.

action tester:
  déplacer la torche dans la cave.
  si la torche se trouve dans la cave, dire "Torche descendue.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("Torche descendue");
    const cave = ctx.jeu.lieux.find((l: any) => l.nom === "cave");
    const torche = obj(ctx, "torche");
    expect(torche.position.cibleId).toEqual(cave.id);
    // déposée dans le lieu courant => présente et plus possédée
    expect(ctx.jeu.etats.possedeEtatElement(torche, EEtatsBase.present, ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(torche, EEtatsBase.possede, ctx.eju)).toBeFalse();
  });

  it("[F102-T006] déplacer le joueur dans un lieu : déplace bien le joueur", () => {
    const scenario = `
L'entrepôt est un lieu.
Le quai est un lieu. Il est au nord de l'entrepôt.
Le joueur est dans l'entrepôt.

action tester:
  déplacer le joueur dans le quai.
  si le joueur se trouve dans le quai, dire "Sur le quai.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("Sur le quai");
    const quai = ctx.jeu.lieux.find((l: any) => l.nom === "quai");
    expect(ctx.jeu.joueur.position.cibleId).toEqual(quai.id);
  });

  it("[F102-T007] déplacer : destination introuvable → l'objet ne bouge pas", () => {
    const scenario = `
Le débarras est un lieu.
La fiole est un objet dans le débarras.
Le joueur est dans le débarras.

action tester:
  déplacer la fiole dans le néant.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // CARACTÉRISATION : la branche « destination introuvable » remplit resultat.sortie avec
    // un message balisé {+[...]+}, mais ce message n'est PAS reversé dans la sortie de la
    // commande au moment du test (sortie vide). On caractérise donc l'effet observable :
    // l'objet n'a pas été déplacé et aucune erreur fatale n'est levée.
    ctx.com.executerCommande("tester", false);
    const debarras = ctx.jeu.lieux.find((l: any) => l.nom === "debarras");
    const fiole = obj(ctx, "fiole");
    expect(fiole.position.cibleId).toEqual(debarras.id);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F102-T008] déplacer : sujet introuvable mais destination connue → aucune modification", () => {
    const scenario = `
Le débarras est un lieu.
La caisse est un contenant ouvert dans le débarras.
Le joueur est dans le débarras.

action tester:
  déplacer le marteau dans la caisse.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // CARACTÉRISATION : « marteau » n'existe pas ; la branche « sujet introuvable » est
    // empruntée. Comme pour T007, le message balisé n'apparaît pas dans la sortie de la
    // commande (sortie vide) — on vérifie l'absence d'effet : rien n'est créé/déplacé.
    ctx.com.executerCommande("tester", false);
    const nbAvant = ["inventaire", "joueur", "caisse"].length;
    expect(ctx.jeu.objets.length).toEqual(nbAvant);
    expect(ctx.jeu.objets.find((o: any) => o.nom === "marteau")).toBeUndefined();
  });

  it("[F102-T009] copier X dans un contenant : duplication, pile au pluriel", () => {
    const scenario = `
La forge est un lieu.
Le moule est un contenant ouvert dans la forge.
La médaille est un objet dans le moule.
Le joueur est dans la forge.

action tester:
  copier la médaille dans le moule.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const moule = obj(ctx, "moule");
    const medailleAvant = obj(ctx, "medaille");
    const quantiteAvant = medailleAvant.quantite;
    ctx.com.executerCommande("tester", false);
    // l'exemplaire déjà présent dans le moule a vu sa quantité augmenter (regroupement de pile)
    const medailleApres = ctx.jeu.objets.find((o: any) =>
      o.nom === "medaille" && o.position && o.position.cibleId === moule.id);
    expect(medailleApres).toBeDefined();
    expect(medailleApres.quantite).toBeGreaterThan(quantiteAvant);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F102-T010] copier X vers un autre contenant : crée un nouvel exemplaire à destination", () => {
    const scenario = `
L'antre est un lieu.
La source est un contenant ouvert dans l'antre.
La cible est un contenant ouvert dans l'antre.
La perle est un objet dans la source.
Le joueur est dans l'antre.

action tester:
  copier la perle dans la cible.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const cible = obj(ctx, "cible");
    const nbPerlesAvant = ctx.jeu.objets.filter((o: any) => o.nom === "perle").length;
    ctx.com.executerCommande("tester", false);
    // un exemplaire de perle existe désormais dans la cible
    const perleDansCible = ctx.jeu.objets.find((o: any) =>
      o.nom === "perle" && o.position && o.position.cibleId === cible.id);
    expect(perleDansCible).toBeDefined();
    // un nouvel objet a été ajouté au jeu (duplication)
    const nbPerlesApres = ctx.jeu.objets.filter((o: any) => o.nom === "perle").length;
    expect(nbPerlesApres).toBeGreaterThan(nbPerlesAvant);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F102-T011] déplacer N exemplaires d'une pile infinie : caractérisation", () => {
    const scenario = `
La salle est un lieu.
Le sac est un contenant ouvert dans la salle.
Les pieces sont des objets dans la salle.
Le joueur est dans la salle.

action tester:
  déplacer trois pieces dans le sac.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // CARACTÉRISATION : « Les pieces sont des objets » crée une pile de quantité infinie (-1).
    // Déplacer « trois pieces » depuis une pile infinie ne fait PAS apparaître d'exemplaire
    // séparé dans le sac (le déterminant numéral « trois » n'est pas extrait en quantité ici) :
    // la pile reste dans la salle, infinie, et aucune erreur n'est levée.
    const salle = ctx.jeu.lieux.find((l: any) => l.nom === "salle");
    ctx.com.executerCommande("tester", false);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const pieces = obj(ctx, "pieces");
    expect(pieces.quantite).toEqual(-1);
    expect(pieces.position.cibleId).toEqual(salle.id);
  });

});
