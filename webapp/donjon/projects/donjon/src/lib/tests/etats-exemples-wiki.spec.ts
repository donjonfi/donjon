import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que les exemples de relations entre états liés depuis la page wiki
// « reference/memoire/etats » (bascule, implication) sont testables.
// Les scénarios reproduisent ressources/scenarios/exemples/wiki/etats/*.djn.

describe('Exemples wiki — relations entre états', () => {

  const BASCULE = `
Le placard est un lieu.
Le linge est un objet sec ici.

sec et mouillé forment une bascule.

action mouiller ceci:
  changer ceci n'est plus sec.
  dire "[Intitulé ceci] est désormais [si ceci est sec]sec[sinon]mouillé[fin si].".
fin action`;

  // Implication + cascade : enragé ⟹ éveillé, et éveillé chasse endormi (groupe). Enrager un
  // dragon endormi le réveille donc automatiquement (l'état impliqué applique ses propres relations).
  const IMPLICATION = `
Le donjon est un lieu.
Le dragon est un animal endormi ici.

enragé est un état.
éveillé, endormi et hiverné se contredisent.
enragé implique éveillé.

action enrager ceci:
  changer ceci est enragé.
  dire "[Intitulé ceci] est désormais [si ceci est éveillé]éveillé[sinon]endormi[fin si] et [si ceci est enragé]enragé[fin si].".
fin action`;

  it('[F066-T001] bascule — appliquer un état retire automatiquement son opposé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + BASCULE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('mouiller le linge', false).sortie;
    expect(s).toContain('mouillé'); // sec retiré, mouillé ajouté par la bascule
    expect(s).not.toContain('désormais sec');
  });

  it('[F066-T002] implication — appliquer enragé ajoute automatiquement éveillé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + IMPLICATION);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('enrager le dragon', false).sortie;
    expect(s).toContain('enragé');
    expect(s).toContain('éveillé'); // ajouté par l'implication enragé ⟹ éveillé
    expect(s).not.toContain('endormi'); // endormi chassé en cascade par éveillé
  });

  // Exclusion : « A exclut B » est bilatéral à l'exécution (appliquer B retire A), mais
  // l'état cible personnalisé (fendu) doit être déclaré avant la relation, comme pour l'implication.
  it('[F066-T003] exclusion — appliquer fendu retire automatiquement intact', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le coffre est un lieu.
Le vase est un objet intact ici.

fendu est un état.
intact exclut fendu.

action briser ceci:
  changer ceci est fendu.
  dire "[Intitulé ceci] est [si ceci est intact]intact[fin si][si ceci est fendu]fendu[fin si].".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('briser le vase', false).sortie;
    expect(s).toContain('fendu');
    expect(s).not.toContain('intact'); // intact retiré par l'exclusion
  });

  // Vérifie le gros exemple lié wiki_etats_dragon_endormi : compile + la séquence
  // endormir → enrager réveille bien le dragon (réveil explicite, pas via implication).
  const DRAGON = `
enragé est un état.
féroce et paisible forment une bascule.
pure et corrompu forment une bascule.
éveillé, endormi et hiverné se contredisent.
enragé implique éveillé.

La clairière enchantée est un lieu.
La grotte du dragon est un lieu au nord de la clairière enchantée.

Le dragon est un animal féroce et éveillé dans la grotte du dragon.
Sa description est "Un dragon écailleux. [si dragon est endormi]Il dort profondément.[fin si][si dragon est enragé]Il est dans une rage folle.[fin si]".

action enrager ceci:
  si ceci est enragé:
    dire "[Intitulé ceci] est déjà furieux.".
  sinon
    changer ceci est enragé.
    dire "[Intitulé ceci] entre dans une rage folle et se réveille s’il dormait, par implication !".
  fin si
fin action

action endormir ceci:
  si ceci est endormi:
    dire "[Intitulé ceci] dort déjà.".
  sinon
    changer ceci est endormi.
    dire "[Intitulé ceci] s’assoupit doucement.".
  fin si
fin action

Le joueur est dans la grotte du dragon.`;

  it('[F066-T004] gros exemple dragon — endormir puis enrager réveille (pas de « dort » résiduel)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + DRAGON);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('endormir le dragon', false).sortie).toContain('assoupit');
    ctx.com.executerCommande('enrager le dragon', false);
    const s = ctx.com.executerCommande('examiner le dragon', false).sortie;
    expect(s).toContain('rage folle');
    expect(s).not.toContain('dort profondément'); // endormi bien retiré au réveil
  });

});
