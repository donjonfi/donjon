// [F107] Instruction « afficher … » (image / écran) et « effacer … » (écran / objet)
// Couverture des branches de instruction-afficher.ts (executerAfficher / executerEffacer / effacerElement).

import { TestUtils } from "../utils/test-utils";
import { TypeInterruption } from "../models/jeu/interruption";

/** Exécute une commande puis reprend le tour après chaque interruption (écran, touche)
 *  jusqu'à épuisement ; renvoie la sortie concaténée et les types d'interruption rencontrés. */
const executerEnDrainant = (ctx: any, commande: string): { sortie: string, types: string[] } => {
  let sortie = ctx.com.executerCommande(commande, false).sortie ?? '';
  const types: string[] = [];
  let garde = 10;
  while (ctx.jeu.tamponInterruptions.length && garde-- > 0) {
    const interruption = ctx.jeu.tamponInterruptions.shift();
    types.push(interruption.typeInterruption);
    sortie += (ctx.com.continuerLeTourInterrompu(interruption.tour) ?? '');
  }
  return { sortie, types };
};

describe('[F107] Instruction afficher / effacer', () => {

  // --- afficher image ---------------------------------------------------

  it("[F107-T001] afficher image : nom de fichier valide produit @@image:...@@", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le hall est un lieu.

action montrer:
  afficher image mon_image.png.
  dire "Affichée.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const sortie = ctx.com.executerCommande('montrer', false).sortie;
    expect(sortie).toContain('@@image:mon_image.png@@');
    expect(sortie).toContain('Affichée');
  });

  // Note : un nom de fichier avec accent (ex. « imagé.png ») n'est pas accepté par
  // l'analyseur (instruction « afficher » jugée incomplète), donc la branche
  // « nom non sécurisé » de executerAfficher n'est pas atteignable via le DSL standard.

  // --- afficher écran ---------------------------------------------------

  it("[F107-T003] afficher l'écran temporaire : déclenche une interruption changerEcran", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action consulter:
  afficher l'écran temporaire.
  dire "Contenu temporaire.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const { sortie, types } = executerEnDrainant(ctx, 'consulter');
    expect(types).toContain(TypeInterruption.changerEcran);
    expect(sortie).toContain('Contenu temporaire');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F107-T004] afficher l'écran précédent : déclenche aussi changerEcran", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action revenir:
  afficher l'écran temporaire.
  afficher l'écran précédent.
  dire "De retour.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const { sortie, types } = executerEnDrainant(ctx, 'revenir');
    expect(types).toContain(TypeInterruption.changerEcran);
    expect(sortie).toContain('De retour');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F107-T007] afficher l'écran principal : déclenche changerEcran", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action principaliser:
  afficher l'écran principal.
  dire "Principal.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const { sortie, types } = executerEnDrainant(ctx, 'principaliser');
    expect(types).toContain(TypeInterruption.changerEcran);
    expect(sortie).toContain('Principal');
  });

  it("[F107-T008] afficher l'écran secondaire : déclenche changerEcran", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action secondariser:
  afficher l'écran secondaire.
  dire "Secondaire.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const { sortie, types } = executerEnDrainant(ctx, 'secondariser');
    expect(types).toContain(TypeInterruption.changerEcran);
    expect(sortie).toContain('Secondaire');
  });

  // Note : les branches d'erreur (nom d'écran inconnu, effacer une porte) ne sont pas
  // testées ici car l'analyseur DSL rejette ces tournures à la compilation
  // (« afficher l'écran latéral » et « effacer la porte ... » → message d'analyse).

  // --- effacer écran ----------------------------------------------------

  it("[F107-T005] effacer l'écran : produit le marqueur @@effacer écran@@", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le bureau est un lieu.

action nettoyer:
  effacer l'écran.
  dire "Écran nettoyé.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const sortie = ctx.com.executerCommande('nettoyer', false).sortie;
    expect(sortie).toContain('@@effacer écran@@');
    expect(sortie).toContain('Écran nettoyé');
  });

  // --- effacer un objet -------------------------------------------------

  it("[F107-T006] effacer un objet : retire l'objet de la liste des objets", () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(`
Le salon est un lieu.
La pomme est un objet mangeable dans le salon.

action croquer:
  effacer la pomme.
  dire "Croquée.".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const avant = ctx.jeu.objets.filter((o: any) => o.nom === 'pomme').length;
    expect(avant).toBeGreaterThan(0);
    const sortie = ctx.com.executerCommande('croquer', false).sortie;
    expect(sortie).toContain('Croquée');
    const apres = ctx.jeu.objets.filter((o: any) => o.nom === 'pomme').length;
    expect(apres).toBe(avant - 1);
  });

});
