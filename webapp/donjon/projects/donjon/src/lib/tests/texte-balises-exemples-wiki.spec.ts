import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que les exemples testables de la page « Balises dynamiques » (pronoms/accords,
// cibles spéciales, listes) compilent et se comportent comme documenté. Les corps sont
// IDENTIQUES aux .djn de ressources/scenarios/exemples/wiki/texte/.
//
// Calibration : ces balises de propriété ([Cest], [lui], [Singulier]…) n'acceptent que les
// cibles spéciales (ceci, cela, ici, origine, destination, orientation, réponse) — avec un
// élément nommé ([lui pomme]) la balise n'est pas résolue (« problème balise »).

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
