import { ClasseUtils, EClasseRacine, Genre } from "../../public-api";

import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// =====================================================================================
//  RESSOURCE — genre grammatical de l'unité & accord des messages
//  [F057-T4xx]
//  L'unité a son propre genre (« pièce » féminin) qui peut différer de celui de la
//  ressource (« or » masculin). Il pilote les accords des messages.
// =====================================================================================

describe('Ressource — genre de l\'unité (K1)', () => {

  const uniteGenre = (ctx: any, nom: string) => ctx.jeu.objets.find((o: any) => o.nom === nom)?.uniteGenre;

  it('[F057-T400] « exprimée en pièces (f) » → unité féminine', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'or est une ressource exprimée en pièces (f).`);
    expect(ctx.jeu.objets.find((o: any) => o.nom === 'or').unite).toBe('pièce');
    expect(uniteGenre(ctx, 'or')).toBe(Genre.f);
  });

  it('[F057-T401] « exprimée en pièces » (sans marqueur) → masculin par défaut', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'argent est une ressource exprimée en pièces.`);
    expect(uniteGenre(ctx, 'argent')).toBe(Genre.m);
  });

  it('[F057-T402] « avec l\'unité litre (m) » → masculin', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nL'eau est une ressource avec l'unité litre (m).`);
    expect(uniteGenre(ctx, 'eau')).toBe(Genre.m);
  });

  it('[F057-T403] « Son unité est la pièce » → féminin (déduit de l\'article)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLe butin est une ressource.\nSon unité est la pièce.`);
    expect(ctx.jeu.objets.find((o: any) => o.nom === 'butin').unite).toBe('pièce');
    expect(uniteGenre(ctx, 'butin')).toBe(Genre.f);
  });

  it('[F057-T404] « Son unité est le grain » → masculin (déduit de l\'article)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`La salle est un lieu.\nLe sable est une ressource.\nSon unité est le grain.`);
    expect(uniteGenre(ctx, 'sable')).toBe(Genre.m);
  });

});

describe('Ressource — accord des messages (K5)', () => {

  const scOr =
    `${actions}\nLa salle est un lieu.\nL'or est une ressource exprimée en pièces (f).\nIl y a 10 pièces d'or ici.`;

  it('[F057-T410] prendre 3 pièces d\'or → « ont été ajoutées » (féminin pluriel, via l\'unité)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scOr);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre 3 pièces d’or', false);
    expect(r.sortie).toContain('3 pièces d’or');
    expect(r.sortie).toContain('ont été ajoutées');
    expect(r.sortie).not.toContain('ajoutés');
  });

  it('[F057-T411] prendre 1 pièce d\'or → « a été ajoutée » (féminin singulier)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scOr);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre 1 pièce d’or', false);
    expect(r.sortie).toContain('ajoutée');
    expect(r.sortie).not.toContain('ajoutés');
  });

});

describe('Ressource — désigner par le nom avec une quantité (K3)', () => {

  const scOr =
    `${actions}\nLa salle est un lieu.\nL'or est une ressource exprimée en pièces (f).\nIl y a 30 pièces d'or ici.`;
  const possede = (ctx: any, nom: string) => ctx.jeu.objets
    .filter((o: any) => o.nom === nom && o.position?.cibleId === ctx.jeu.joueur.id)
    .reduce((s: number, o: any) => s + o.quantite, 0);

  it('[F057-T420] « prendre 10 or » (nom + quantité) → 10 pièces prises', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scOr);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('prendre 10 or', false);
    expect(r.sortie).not.toContain('pas trouvé');
    expect(possede(ctx, 'or')).toBe(10);
  });

  it('[F057-T421] « prendre or » (nom seul) → 1 pièce ; « prendre 10 pièces » → 10', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scOr);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre or', false);
    expect(possede(ctx, 'or')).toBe(1);
    ctx.com.executerCommande('prendre 10 pièces', false);
    expect(possede(ctx, 'or')).toBe(11);
  });

});

describe('Ressource — description par défaut dynamique (K2)', () => {

  it('[F057-T440] examiner une ressource à unité (pile de 23) → « Ce sont 23 pièces d\'or. »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nL'or est une ressource exprimée en pièces (f).\nIl y a 23 pièces d'or ici.`
    );
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('examiner l’or', false);
    expect(r.sortie).toContain('Ce sont 23 pièces d’or.');
  });

  it('[F057-T441] pile de 1 → « C\'est 1 pièce d\'or. »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nL'or est une ressource exprimée en pièces (f).\nIl y a 1 pièce d'or ici.`
    );
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('examiner l’or', false);
    expect(r.sortie).toContain('C’est 1 pièce d’or.');
  });

  it('[F057-T442] comptée par nom (pluriel) → « Ce sont 4 fruits. »', () => {
    const ctx4 = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nLes fruits sont une ressource.\nIl y a 4 fruits dans la salle.`
    );
    ctx4.com.executerCommande('regarder', false);
    expect(ctx4.com.executerCommande('examiner les fruits', false).sortie).toContain('Ce sont 4 fruits.');
  });

  it('[F057-T443] « Il y a 1 fruit » (singulier d’une ressource déclarée au pluriel) → ressource, « C\'est 1 fruit. »', () => {
    // le singulier « 1 fruit » est résolu vers la ressource « fruits » (pas un objet ordinaire).
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nLes fruits sont une ressource.\nIl y a 1 fruit dans la salle.`
    );
    const fruit = ctx.jeu.objets.find((o: any) => o.nom === 'fruits' || o.nom === 'fruit');
    expect(fruit).toBeDefined();
    expect(ClasseUtils.heriteDe(fruit.classe, EClasseRacine.ressource)).toBeTrue();
    expect(fruit.quantite).toBe(1);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('examiner les fruits', false).sortie).toContain('C’est 1 fruit.');
  });

  it('[F057-T444] ressource en quantité illimitée (« sont des ressources ») → « des pommes », pas « -1 »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLe verger est un lieu.\nLe pommier est un support ici.\n` +
      `Les pommes (f) sont des ressources mangeables sur le pommier.`
    );
    const sortie = ctx.com.executerCommande('regarder', false).sortie;
    expect(sortie).toContain('des pommes');
    expect(sortie).not.toContain('-1');
  });

});

describe('Ressource — règles & actions référençant « une <ressource> » (classe par-nom)', () => {

  const verger =
    `${actions}\nLe verger est un lieu.\nLe pommier est un support ici.\n` +
    `Les pommes (f) sont des ressources mangeables sur le pommier.\n` +
    `règle après manger une pomme:\n  dire "Miam!".\nfin règle\n` +
    `action cueillir une pomme:\n  créer une pomme dans l'inventaire.\nfin action`;

  it('[F057-T450] la ressource est une CLASSE par-nom héritant de « ressource »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(verger);
    const pommes = ctx.jeu.objets.find((o: any) => o.nom === 'pommes' || o.nom === 'pomme');
    expect(pommes).toBeDefined();
    expect(pommes.classe.nom).toBe('pomme');
    expect(ClasseUtils.heriteDe(pommes.classe, EClasseRacine.ressource)).toBeTrue();
    expect(ClasseUtils.heriteDe(pommes.classe, EClasseRacine.objet)).toBeTrue();
  });

  it('[F057-T451] « règle après manger une pomme » se déclenche → « Miam! »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(verger);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('manger une pomme', false);
    expect(r.sortie).toContain('Miam!');
  });

  it('[F057-T452] « action cueillir une pomme » crée 1 pomme dans l\'inventaire', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(verger);
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('cueillir une pomme', false);
    expect(r.sortie).not.toContain('ne convient pas');
    const possede = ctx.jeu.objets
      .filter((o: any) => (o.nom === 'pommes' || o.nom === 'pomme') && o.position?.cibleId === ctx.jeu.joueur.id)
      .reduce((s: number, o: any) => s + (o.quantite ?? 0), 0);
    expect(possede).toBe(1);
  });

});

describe('Ressource — description & aperçu personnalisés (K6)', () => {

  it('[F057-T450] la description d\'auteur écrase le défaut dynamique', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(
      `${actions}\nLa salle est un lieu.\nL'or est une ressource exprimée en pièces (f).\n` +
      `La description de l'or est "Des pièces étincelantes frappées à l'effigie du roi.".\nIl y a 23 pièces d'or ici.`
    );
    ctx.com.executerCommande('regarder', false);
    const r = ctx.com.executerCommande('examiner l’or', false);
    expect(r.sortie).toContain('Des pièces étincelantes');
    expect(r.sortie).not.toContain('Ce sont 23');
  });

});

describe('Ressource — écho de commande quantité+unité (K4)', () => {

  const scEau =
    `${actions}\nLa salle est un lieu.\nL'eau est une ressource avec l'unité litre.\nIl y a 5 litres d'eau ici.\n` +
    `L'or est une ressource exprimée en pièces (f).\nIl y a 30 pièces d'or ici.`;

  it('[F057-T430] « prendre 2 litres » → commande comprise « 2 litres d\'eau »', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scEau);
    ctx.com.executerCommande('regarder', false);
    const cc = ctx.com.executerCommande('prendre 2 litres', false);
    expect(cc.evenement.commandeComprise).toContain('2 litres d’eau');
  });

  it('[F057-T431] « prendre pièce » → « 1 pièce d\'or » (singulier)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scEau);
    ctx.com.executerCommande('regarder', false);
    const cc = ctx.com.executerCommande('prendre pièce', false);
    expect(cc.evenement.commandeComprise).toContain('1 pièce d’or');
  });

  it('[F057-T432] « prendre les pièces » → « les pièces d\'or » (toute la pile)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scEau);
    ctx.com.executerCommande('regarder', false);
    const cc = ctx.com.executerCommande('prendre les pièces', false);
    expect(cc.evenement.commandeComprise).toContain('les pièces d’or');
  });

});
