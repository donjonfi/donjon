import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que les exemples de la page wiki « Ressources » sont réellement testables.
// (Les .djn vivent sous ressources/scenarios/exemples/wiki/ressources/ ; l'éditeur ajoute
//  automatiquement les actions de base — ici on les préfixe via `actions`.)

describe('Exemples wiki — ressources', () => {

  const totalParNom = (ctx: any, nom: string, cibleId?: number) =>
    ctx.jeu.objets
      .filter((o: any) => o.nom === nom && (cibleId === undefined || o.position?.cibleId === cibleId))
      .reduce((s: number, o: any) => s + o.quantite, 0);

  it('[F057-T300] exemple « définir » → affichage des trois styles', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
L'atelier est un lieu.
Le bois est une ressource.
Il y a 30 unités de bois ici.
L'argent est une ressource exprimée en pièces.
Il y a 5 pièces d'argent ici.
Les fruits sont une ressource.
Il y a 4 fruits dans l'atelier.`);
    const s = ctx.com.executerCommande('regarder', false).sortie;
    expect(s).toContain('30 unités de bois');
    expect(s).toContain('5 pièces d’argent');
    expect(s).toContain('4 fruits');
  });

  it('[F057-T301] exemple « commandes » → prendre / donner / manger', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le marché est un lieu.
Le marchand est une personne ici.
L'argent est une ressource exprimée en pièces.
Il y a 10 pièces d'argent ici.
Les fruits sont une ressource mangeable.
Il y a 5 fruits dans le marché.`);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre les pièces', false);
    ctx.com.executerCommande('donner 3 pièces d’argent au marchand', false);
    const marchand = ctx.jeu.objets.find((o: any) => o.nom === 'marchand');
    expect(totalParNom(ctx, 'argent', marchand.id)).toBe(3);
    expect(totalParNom(ctx, 'argent', ctx.jeu.joueur.id)).toBe(7);
    ctx.com.executerCommande('prendre les fruits', false);
    ctx.com.executerCommande('manger 2 fruits', false);
    expect(totalParNom(ctx, 'fruits', ctx.jeu.joueur.id) + totalParNom(ctx, 'fruit', ctx.jeu.joueur.id)).toBe(3);
  });

  it('[F057-T302] exemple « instructions » → invoquer / piller / dépenser', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le sanctuaire est un lieu.
Le coffre est un contenant ouvert ici.
L'or est une ressource exprimée en pépites.
Il y a 8 pépites d'or dans le coffre.
action invoquer:
  phase exécution:
    créer 3 pépites d'or dans l'inventaire.
fin action
action piller:
  phase exécution:
    déplacer les pépites d'or depuis l'intérieur du coffre vers l'inventaire.
fin action
action dépenser:
  phase exécution:
    consommer 5 pépites d'or.
fin action`);
    ctx.com.executerCommande('invoquer', false);
    expect(totalParNom(ctx, 'or', ctx.jeu.joueur.id)).toBe(3);
    ctx.com.executerCommande('piller', false);
    expect(totalParNom(ctx, 'or', ctx.jeu.joueur.id)).toBe(11);
    ctx.com.executerCommande('dépenser', false);
    expect(totalParNom(ctx, 'or', ctx.jeu.joueur.id)).toBe(6);
  });

  it('[F057-T303] exemple complet « campement » → alimenter / invoquer / manger', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le titre du jeu est "Le campement".
Le campement est un lieu.
Le feu est un objet ici.
L'or est une ressource exprimée en pièces.
Il y a 12 pièces d'or ici.
Le bois est une ressource.
Il y a 20 unités de bois ici.
Les rations sont une ressource mangeable.
Il y a 4 rations dans le campement.
action alimenter ceci:
  définitions:
    ceci est un objet.
  phase exécution:
    consommer 5 unités de bois.
  phase épilogue:
    dire "Le feu crépite.".
fin action
action invoquer:
  phase exécution:
    créer 3 pièces d'or dans l'inventaire.
fin action`);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('alimenter le feu', false);
    expect(totalParNom(ctx, 'bois')).toBe(15);
    ctx.com.executerCommande('invoquer', false);
    expect(totalParNom(ctx, 'or', ctx.jeu.joueur.id)).toBe(3);
    ctx.com.executerCommande('prendre les rations', false);
    ctx.com.executerCommande('manger 2 rations', false);
    expect(totalParNom(ctx, 'rations', ctx.jeu.joueur.id) + totalParNom(ctx, 'ration', ctx.jeu.joueur.id)).toBe(2);
  });

});
