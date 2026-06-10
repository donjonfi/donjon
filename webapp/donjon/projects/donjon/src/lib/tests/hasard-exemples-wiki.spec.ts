import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que les exemples testables de la référence « Hasard » compilent et se
// comportent comme documenté. Les corps ci-dessous sont IDENTIQUES aux .djn de
// ressources/scenarios/exemples/wiki/hasard/ (l'éditeur préfixe les actions de base).
//
// Le PRNG est semé aléatoirement à chaque partie : les assertions acceptent chaque
// issue possible et vérifient sur un grand nombre de tirages que les deux issues
// surviennent (probabilité d'échec < 1e-7).

const TIRAGE_PEPITE = `
La berge est un lieu.
Sa description est "Une rivière boueuse longe la berge. Vous pourriez tamiser la vase ou pêcher.".

action tamiser:
  si un tirage à 1 chance sur 3 réussit:
    dire "Vous trouvez une pépite d’or !".
  sinon
    dire "Vous ne trouvez qu’un peu de vase.".
  fin si
fin action

action pêcher:
  si un tirage à 2 chances sur 3 échoue:
    dire "Ça ne mord pas.".
  sinon
    dire "Un poisson mord à l’hameçon !".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez plusieurs fois : {/tamiser/} et {/pêcher/}.".
fin règle`;

const DE_SIX = `
Le tripot est un lieu.
Sa description est "Une table, un gobelet, un dé à six faces. Tentez votre chance.".

action parier:
  sélectionner un nombre compris entre 1 et 6.
  dire "Le dé s’arrête sur le [mémoire nombre].".
  si le nombre atteint 5:
    dire "Gagné !".
  sinon
    dire "Perdu…".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez plusieurs fois : {/parier/}.".
fin règle`;

describe('Exemples wiki — hasard', () => {

  it('[F071-T001] tirage « réussit » — chaque tentative donne une des deux issues, et les deux surviennent', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + TIRAGE_PEPITE);
    let pepites = 0;
    let vases = 0;
    for (let i = 0; i < 40; i++) {
      const sortie = ctx.com.executerCommande('tamiser', false).sortie;
      if (sortie.includes('pépite d’or')) {
        pepites++;
      } else if (sortie.includes('qu’un peu de vase')) {
        vases++;
      }
    }
    expect(pepites + vases).toEqual(40);
    expect(pepites).toBeGreaterThan(0);
    expect(vases).toBeGreaterThan(0);
  });

  it('[F071-T002] tirage « échoue » — chaque tentative donne une des deux issues, et les deux surviennent', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + TIRAGE_PEPITE);
    let rates = 0;
    let prises = 0;
    for (let i = 0; i < 40; i++) {
      const sortie = ctx.com.executerCommande('pêcher', false).sortie;
      if (sortie.includes('Ça ne mord pas')) {
        rates++;
      } else if (sortie.includes('mord à l’hameçon')) {
        prises++;
      }
    }
    expect(rates + prises).toEqual(40);
    expect(rates).toBeGreaterThan(0);
    expect(prises).toBeGreaterThan(0);
  });

  it('[F071-T003] sélectionner un nombre — résultat entre 1 et 6, affiché et testable par comparateur', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + DE_SIX);
    for (let i = 0; i < 30; i++) {
      const sortie = ctx.com.executerCommande('parier', false).sortie;
      const resultat = sortie.match(/Le dé s’arrête sur le (\d+)\./);
      expect(resultat).withContext(sortie).not.toBeNull();
      const valeur = Number(resultat![1]);
      expect(valeur).toBeGreaterThanOrEqual(1);
      expect(valeur).toBeLessThanOrEqual(6);
      // « Gagné » sans le « ! » : le moteur remplace l'espace avant « ! » par une insécable.
      if (valeur >= 5) {
        expect(sortie).toContain('Gagné');
      } else {
        expect(sortie).toContain('Perdu…');
      }
    }
  });

});
