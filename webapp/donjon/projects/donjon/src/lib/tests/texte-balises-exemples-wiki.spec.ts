import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que les exemples testables de la page « Balises dynamiques » (pronoms/accords,
// cibles spéciales, listes) compilent et se comportent comme documenté. Les corps sont
// IDENTIQUES aux .djn de ressources/scenarios/exemples/wiki/texte/.
//
// Ces balises de propriété ([Cest], [lui], [Singulier]…) acceptent les cibles spéciales
// (ceci, cela, ici, origine, destination, orientation, réponse) ET, depuis F074, un élément
// nommé ([lui pomme]) — voir balises-cibles-nommees.spec.ts.

const PRONOMS_ACCORDS = `
Le verger est un lieu.
La pomme est un objet mangeable dans le verger.
Les cerises (f) sont un objet dans le verger.

règle après prendre la pomme:
  dire "[Cest ceci] dans le panier ! Vous ne partirez pas sans [lui ceci].".
  dire "Au singulier : [Singulier ceci] — au pluriel : [Pluriel ceci] — quantité : [quantité ceci].".
fin règle

règle après prendre les cerises:
  dire "[Cest ceci] dans le panier ! Vous ne partirez pas sans [lui ceci].".
  dire "Au singulier : [Singulier ceci] — au pluriel : [Pluriel ceci] — quantité : [quantité ceci].".
fin règle

règle avant commencer le jeu:
  dire "Essayez : {/prendre la pomme/} puis {/prendre les cerises/}.".
fin règle`;

const ORIGINE_DESTINATION = `
Le salon est un lieu.
Sa description est "Le jardin est au nord. Une étagère est fixée au mur.".
Le jardin est un lieu au nord du salon.
L'étagère est un support dans le salon.
La bille est un objet dans le salon.

règle après aller dans le jardin:
  dire "Vous quittez [intitulé origine] et arrivez dans [intitulé destination] (direction : [intitulé orientation]).".
fin règle

règle après poser la bille sur l'étagère:
  dire "Vous l’avez posée [préposition cela] [intitulé cela].".
fin règle

règle avant commencer le jeu:
  dire "Essayez : {/regarder/}, {/prendre la bille/}, {/poser la bille sur l’étagère/}, {/aller au nord/}.".
fin règle`;

describe('Exemples wiki — texte : pronoms, accords et cibles spéciales', () => {

  it('[F073-T001] pronoms/accords — féminin singulier (la pomme)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + PRONOMS_ACCORDS);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('prendre la pomme', false).sortie;
    expect(sortie).withContext(sortie).toContain('C’est dans le panier');
    expect(sortie).withContext(sortie).toContain('sans elle.');
    expect(sortie).withContext(sortie).toContain('Au singulier : La pomme — au pluriel : Les pommes — quantité : 1.');
  });

  it('[F073-T002] pronoms/accords — féminin pluriel via le marqueur (f) (les cerises)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + PRONOMS_ACCORDS);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('prendre les cerises', false).sortie;
    expect(sortie).withContext(sortie).toContain('Ce sont dans le panier');
    expect(sortie).withContext(sortie).toContain('sans elles.');
    expect(sortie).withContext(sortie).toContain('Au singulier : Une cerise — au pluriel : Les cerises — quantité : -1.');
  });

  it('[F073-T003] cibles spéciales — origine, destination, orientation et préposition', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + ORIGINE_DESTINATION);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('prendre la bille', false);
    const poser = ctx.com.executerCommande('poser la bille sur l’étagère', false).sortie;
    expect(poser).withContext(poser).toContain('posée sur l’étagère');
    const aller = ctx.com.executerCommande('aller au nord', false).sortie;
    expect(aller).withContext(aller).toContain('Vous quittez le salon et arrivez dans le jardin (direction : le nord).');
  });

  it('[F073-T004] listes — [énumérer], [lister] et [décrire] (formes documentées)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
La cuisine est un lieu.
La liste des courses est une liste.
action réciter:
  changer la liste des courses contient "du pain".
  changer la liste des courses contient "du lait".
  dire "Il vous faut : [énumérer la liste des courses].".
fin action`);
    const sortie = ctx.com.executerCommande('réciter', false).sortie;
    expect(sortie).withContext(sortie).toContain('Il vous faut : "du pain" et "du lait".');
  });

  // Calibration : un objet caché déjà affiché/mentionné n'est plus filtré par « sauf cachés »
  // (révélé = plus à cacher) — d'où l'ordre : le filtre s'évalue avant tout affichage du contenu.
  it('[F073-T006] [décrire objets dans X sauf cachés / sauf mentionnés]', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le débarras est un lieu.
Le coffre est un contenant ouvert ici.
La lanterne est un objet dans le coffre.
Le rubis est un objet caché dans le coffre.
La corde est un objet dans le coffre.

action inspecter:
  dire "Sauf cachés : [décrire objets dans le coffre sauf cachés]".
  dire "Tout : [décrire objets dans le coffre]".
  dire "Sauf mentionnés : [décrire objets dans le coffre sauf mentionnés]RIEN".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('inspecter', false).sortie;
    expect(s).withContext(s).toContain('Sauf cachés :  Dedans, il y a une lanterne et une corde.');
    expect(s).withContext(s).toContain('Tout :  Dedans, il y a une lanterne, un rubis et une corde.');
    // tout a déjà été mentionné dans ce tour → « sauf mentionnés » ne liste plus rien
    expect(s).withContext(s).toContain('Sauf mentionnés : RIEN');
  });

  it('[F073-T007] [obstacle vers ceci] et [statut ceci] (cibles spéciales uniquement)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
La cave est un lieu.
Le cellier est un lieu au nord de la cave.
La grille (f) est une porte fermée et verrouillée au nord de la cave.

action sonder ceci:
  définitions:
    ceci est un intitulé.
  phase exécution:
    dire "Obstacle : [obstacle vers ceci]".
fin action

action ausculter ceci:
  dire "Statut : [statut ceci]".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    // l'obstacle dans une direction : description accordée en genre
    expect(ctx.com.executerCommande('sonder le nord', false).sortie).toContain('Obstacle : La grille est fermée.');
    expect(ctx.com.executerCommande('ausculter la grille', false).sortie).toContain('Statut : Elle est fermée.');
  });

  it('[F073-T008] [v s’ouvrir ipr ceci] (pronominal + négation) et alias [Il X]', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le hall est un lieu.
Le coffre est un contenant fermé ici.
La pomme est un objet ici.

action tester ceci:
  dire "[Intitulé ceci] [v s'ouvrir ipr ceci] facilement.".
  dire "[Intitulé ceci] [v s'ouvrir ipr pas ceci].".
  dire "[Il la pomme] est rouge. [Il le coffre] est lourd.".
  dire "Vous venez de [infinitif action] [intitulé ceci].".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('tester le coffre', false).sortie;
    expect(s).withContext(s).toContain('Le coffre s’ouvre facilement.');
    expect(s).withContext(s).toContain('Le coffre ne s’ouvre pas.');
    // [il X]/[Il X] : alias de [pronom X]/[Pronom X], accordé en genre
    expect(s).withContext(s).toContain('Elle est rouge. Il est lourd.');
    // [infinitif action] : le verbe de l'action en cours
    expect(s).withContext(s).toContain('Vous venez de tester le coffre.');
  });

  it('[F073-T005] [aide cela] — fiche d’aide dans une commande d’aide personnalisée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le salon est un lieu.
L'aide pour l'action danser est "Pour danser, tapez danser.".
règle remplacer afficher ceci pour cela:
  définitions:
    ceci est un intitulé.
    cela est un intitulé.
  phase exécution:
    si ceci est l'aide, dire "AIDE:[aide cela]FIN".
fin règle`);
    const sortie = ctx.com.executerCommande('afficher aide pour danser', false).sortie;
    expect(sortie).withContext(sortie).toContain('AIDE:Pour danser, tapez danser.FIN');
  });

});
