import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

// [F099] Declencheur — déclenchement des règles avant/après/remplacer.
//
// Couvre les branches de score de `retrouverInstructions` (declencheur.ts) :
//   - correspondance exacte par élément (ceci),
//   - correspondance par classe (« un objet »),
//   - précédence du score exact sur le score classe,
//   - ceci + cela (deux éléments exacts),
//   - ceci + cela avec classe sur cela,
//   - règle « avant »/« après » sur la même commande,
//   - règle « une action quelconque » (placée en tête pour avant, en queue pour après),
//   - règle générique « ceci » (placeholder, pas une classe).
//
// Le déclenchement est DIRECT via une commande joueur (pas de temps réel) ;
// on asserte l'effet observable (sortie). Harnais calqué sur
// condition.regle-se-declenche.spec.ts : « commencer le jeu » exécute l'intro
// qui marque les objets de la pièce comme « vus » (sinon « Je ne l'ai pas encore vu »).

function preparerJeu(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", true);
  return ctx;
}

describe('Declencheur — règles avant/après (F099)', () => {

  // ----------------------------------------------------------------------------
  // A) Correspondance exacte par élément (ceci) — règle après examiner X
  // ----------------------------------------------------------------------------
  it('[F099-T001] règle après sur un élément exact (ceci) se déclenche', () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
La lampe est un objet dans le salon.
règle après examiner la lampe:
  dire "APRES LAMPE".
fin règle`);
    const sortie = ctx.com.executerCommande('examiner lampe', false).sortie;
    expect(sortie).withContext(sortie).toContain('APRES LAMPE');
  });

  it('[F099-T002] la règle exacte ne se déclenche PAS pour un autre élément', () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
La lampe est un objet dans le salon.
La pomme est un objet dans le salon.
règle après examiner la lampe:
  dire "APRES LAMPE".
fin règle`);
    const sortie = ctx.com.executerCommande('examiner pomme', false).sortie;
    expect(sortie).withContext(sortie).not.toContain('APRES LAMPE');
  });

  // ----------------------------------------------------------------------------
  // B) Correspondance par classe — règle après manger un objet
  // ----------------------------------------------------------------------------
  it('[F099-T003] règle après sur une classe (« un objet ») se déclenche pour un membre', () => {
    const ctx = preparerJeu(`
La cuisine est un lieu.
Le joueur se trouve dans la cuisine.
Le chocolat est un objet mangeable dans la cuisine.
règle après manger un objet:
  dire "MIAM CLASSE".
fin règle`);
    const sortie = ctx.com.executerCommande('manger le chocolat', false).sortie;
    expect(sortie).withContext(sortie).toContain('MIAM CLASSE');
  });

  // ----------------------------------------------------------------------------
  // C) Précédence : le score exact bat le score classe (bogue #221, F020-T006)
  // ----------------------------------------------------------------------------
  it('[F099-T004] règle exacte choisie au détriment de la règle classe (score plus élevé)', () => {
    const ctx = preparerJeu(`
La cuisine est un lieu.
Le joueur se trouve dans la cuisine.
Le chocolat est un objet mangeable dans la cuisine.
Le bonbon est un objet mangeable dans la cuisine.
règle après manger un objet:
  dire "MIAM CLASSE".
fin règle
règle après manger le chocolat:
  dire "MIAM CHOCOLAT".
fin règle`);
    // chocolat : score exact > score classe → seule la règle exacte se déclenche
    const sortieChoco = ctx.com.executerCommande('manger le chocolat', false).sortie;
    expect(sortieChoco).withContext(sortieChoco).toContain('MIAM CHOCOLAT');
    expect(sortieChoco).withContext(sortieChoco).not.toContain('MIAM CLASSE');

    // bonbon : pas de règle exacte → la règle classe se déclenche
    const sortieBonbon = ctx.com.executerCommande('manger le bonbon', false).sortie;
    expect(sortieBonbon).withContext(sortieBonbon).toContain('MIAM CLASSE');
  });

  // ----------------------------------------------------------------------------
  // D) ceci + cela (deux éléments exacts) — règle après mettre la clé sur la table
  // ----------------------------------------------------------------------------
  it('[F099-T005] règle après sur ceci + cela (deux éléments) se déclenche', () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
La clé est un objet vu et possédé.
La table est un support dans le salon.
règle après mettre la clé sur la table:
  dire "CLE SUR TABLE".
fin règle`);
    const sortie = ctx.com.executerCommande('mettre la clé sur la table', false).sortie;
    expect(sortie).withContext(sortie).toContain('CLE SUR TABLE');
  });

  // ----------------------------------------------------------------------------
  // E) ceci + cela avec classe sur cela — règle après donner ceci à une personne
  // ----------------------------------------------------------------------------
  it('[F099-T006] règle après sur ceci + classe sur cela se déclenche', () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
La fleur est un objet vu et possédé.
Bob est une personne dans le salon.
règle après donner la fleur à une personne:
  dire "DON A PERSONNE".
fin règle`);
    const sortie = ctx.com.executerCommande('donner la fleur à Bob', false).sortie;
    expect(sortie).withContext(sortie).toContain('DON A PERSONNE');
  });

  // ----------------------------------------------------------------------------
  // F) règles avant ET après sur la même commande se déclenchent toutes deux
  // ----------------------------------------------------------------------------
  it("[F099-T007] règle avant et règle après sur la même action se déclenchent dans l'ordre", () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
Le levier est un objet dans le salon.
règle avant examiner le levier:
  dire "AVANT LEVIER".
fin règle
règle après examiner le levier:
  dire "APRES LEVIER".
fin règle`);
    const sortie = ctx.com.executerCommande('examiner levier', false).sortie;
    expect(sortie).withContext(sortie).toContain('AVANT LEVIER');
    expect(sortie).withContext(sortie).toContain('APRES LEVIER');
    // « avant » est joué avant « après »
    expect(sortie.indexOf('AVANT LEVIER')).toBeLessThan(sortie.indexOf('APRES LEVIER'));
  });

  // ----------------------------------------------------------------------------
  // G) Règle « une action quelconque » — branche auditeurActionQuelconque
  //    (avant: ajoutée en tête ; après: ajoutée en queue)
  // ----------------------------------------------------------------------------
  it("[F099-T008] « règle après une action quelconque » se déclenche pour n'importe quelle action", () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
Le tabouret est un objet dans le salon.
règle après une action quelconque:
  dire "ACTION QUELCONQUE".
fin règle`);
    // s'applique à examiner …
    const s1 = ctx.com.executerCommande('examiner tabouret', false).sortie;
    expect(s1).withContext(s1).toContain('ACTION QUELCONQUE');
    // … comme à prendre
    const s2 = ctx.com.executerCommande('prendre tabouret', false).sortie;
    expect(s2).withContext(s2).toContain('ACTION QUELCONQUE');
  });

  it("[F099-T009] « règle avant une action quelconque » se déclenche avant l'action", () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
Le caillou est un objet dans le salon.
règle avant une action quelconque:
  dire "AVANT QUELCONQUE".
fin règle
règle après examiner le caillou:
  dire "APRES CAILLOU".
fin règle`);
    const sortie = ctx.com.executerCommande('examiner caillou', false).sortie;
    expect(sortie).withContext(sortie).toContain('AVANT QUELCONQUE');
    expect(sortie).withContext(sortie).toContain('APRES CAILLOU');
    // la règle quelconque « avant » est ajoutée en tête → précède la règle après spécifique
    expect(sortie.indexOf('AVANT QUELCONQUE')).toBeLessThan(sortie.indexOf('APRES CAILLOU'));
  });

  // ----------------------------------------------------------------------------
  // H) Règle générique « ceci » (placeholder, pas une classe) sur tout objet
  // ----------------------------------------------------------------------------
  it('[F099-T010] règle après avec « ceci » générique se déclenche pour tout objet ciblé', () => {
    const ctx = preparerJeu(`
Le salon est un lieu.
Le joueur se trouve dans le salon.
La bougie est un objet dans le salon.
règle après examiner ceci:
  dire "GENERIQUE CECI".
fin règle`);
    const sortie = ctx.com.executerCommande('examiner bougie', false).sortie;
    expect(sortie).withContext(sortie).toContain('GENERIQUE CECI');
  });

});
