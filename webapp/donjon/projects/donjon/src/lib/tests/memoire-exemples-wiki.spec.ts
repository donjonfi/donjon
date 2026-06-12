import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que l'exemple de la page wiki « Historique » (reference/memoire/historique)
// est réellement testable. L'historique est une liste de textes : on l'alimente avec
// `changer l'historique contient "…"`, on le teste en condition et via une balise dynamique.

describe('Exemples wiki — mémoire', () => {

  const HISTORIQUE = `
Le hall est un lieu.
Le levier est un objet ici.
Sa description est "Un gros levier de fer. [si l'historique contient "levier actionné"]Il est à présent abaissé.[sinon]Il est en position haute.[fin si]".

L'historique est une liste.

action actionner le levier:
  changer l'historique contient "levier actionné".
  dire "Le levier bascule avec un grincement.".
fin action

action vérifier:
  si l'historique contient "levier actionné":
    dire "Le mécanisme est enclenché.".
  sinon
    dire "Aucun événement enregistré pour le moment.".
  fin si
fin action`;

  it('[F065-T001] historique — condition fausse tant que rien n’est enregistré', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + HISTORIQUE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.com.executerCommande('vérifier', false).sortie).toContain('Aucun événement enregistré');
  });

  it('[F065-T002] historique — ajout via « changer … contient » puis condition vraie', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + HISTORIQUE);
    ctx.com.executerCommande('actionner le levier', false);
    expect(ctx.com.executerCommande('vérifier', false).sortie).toContain('Le mécanisme est enclenché');
  });

  it('[F065-T003] historique — balise dynamique [si l’historique contient …] dans la description', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + HISTORIQUE);
    ctx.com.executerCommande('regarder', false); // le levier doit avoir été vu avant examiner
    expect(ctx.com.executerCommande('examiner le levier', false).sortie).toContain('position haute');
    ctx.com.executerCommande('actionner le levier', false);
    expect(ctx.com.executerCommande('examiner le levier', false).sortie).toContain('abaissé');
  });

});
