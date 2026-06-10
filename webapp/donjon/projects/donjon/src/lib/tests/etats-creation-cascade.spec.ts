import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Fix 1 — paramètre « création automatique des états » (actif par défaut) : les états inconnus
//          utilisés dans une relation (implication/exclusion) sont créés à la volée ; désactivé,
//          ils provoquent une erreur (hors conditions).
// Fix 2 — les implications cascadent : un état impliqué applique à son tour ses propres
//          bascules/groupes/contradictions ; un suivi des ajouts/retraits évite les boucles et
//          signale les incohérences.

describe('États — création automatique & cascade des relations', () => {

  it('[F067-T001] création auto ACTIVE (défaut) : implication d’états non déclarés fonctionne', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le donjon est un lieu.
Le dragon est un animal ici.

enragé implique éveillé.

action enrager ceci:
  changer ceci est enragé.
  dire "[si ceci est enragé]E[fin si][si ceci est éveillé]V[fin si].".
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('enrager le dragon', false).sortie;
    expect(s).toContain('E'); // enragé appliqué
    expect(s).toContain('V'); // éveillé ajouté par l'implication (états auto-créés)
  });

  it('[F067-T002] création auto DÉSACTIVÉE : état non déclaré dans une relation → erreur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
désactiver création automatique des états.

Le donjon est un lieu.
Le dragon est un animal ici.

enragé implique éveillé.`);
    expect(ctx.jeu.tamponErreurs.length).toBeGreaterThan(0);
    expect(ctx.jeu.tamponErreurs.join(' ')).toContain('création automatique des états est désactivée');
  });

  it('[F067-T003] cascade : une implication retire le contradicteur de l’état impliqué', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le donjon est un lieu.
Le dragon est un animal endormi ici.

enragé est un état.
éveillé, endormi et hiverné se contredisent.
enragé implique éveillé.

action enrager ceci:
  changer ceci est enragé.
fin action

action sonder:
  si le dragon est endormi:
    dire "DORT".
  sinon
    dire "REVEILLE".
  fin si
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('enrager le dragon', false);
    const s = ctx.com.executerCommande('sonder', false).sortie;
    expect(s).toContain('REVEILLE'); // endormi retiré en cascade (enragé ⟹ éveillé ≠ endormi)
    expect(s).not.toContain('DORT');
  });

  it('[F067-T004] cascade incohérente (implique les deux états d’une bascule) → erreur de conflit', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le labo est un lieu.
La machine est un objet ici.

actif et inactif forment une bascule.
basculeur est un état.
basculeur implique actif.
basculeur implique inactif.

action declencher ceci:
  changer ceci est basculeur.
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0); // pas d'erreur tant qu'on ne déclenche pas
    ctx.com.executerCommande('regarder', false);
    ctx.com.executerCommande('declencher la machine', false);
    expect(ctx.jeu.tamponErreurs.join(' ')).toContain('Conflit d’états');
  });

  it('[F067-T005] création auto ACTIVE : une condition sur un état inconnu ne le crée PAS', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + `
Le donjon est un lieu.
Le dragon est un animal ici.

action sonder:
  si le dragon est grognon:
    dire "GROGNON".
  sinon
    dire "PAS-GROGNON".
  fin si
fin action`);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const s = ctx.com.executerCommande('sonder', false).sortie;
    expect(s).toContain('PAS-GROGNON');
    // l'état « grognon », testé en condition mais jamais déclaré, ne doit pas avoir été créé
    expect(ctx.jeu.etats.trouverEtatSilencieux('grognon')).toBeNull();
  });

});
