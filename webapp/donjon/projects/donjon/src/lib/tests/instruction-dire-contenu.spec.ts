// [F109] Balises de contenu : [décrire|lister|énumérer objets …] + [titre|sorties ici]
//
// Cible les BRANCHES non couvertes de instruction-dire-contenu.ts :
//   - préposition « sous » (rempli + vide → « rien de particulier dessous »)
//   - contenant fermé (visibilité du contenu déléguée à executerDecrireContenuFn)
//   - clause « sauf mentionnés » et « sauf cachés et mentionnés » (elementsMentionnes)
//   - cible non trouvée → « {+(cible pas trouvée)+} »
//   - branche cible spéciale vide → conjugaison [Pronom ceci]… (via examiner)
//   - calculerBaliseSortiesTitre : [titre ici]
//   - calculerBaliseListerDecrireListe : lister/décrire d'une liste
//
// (sur-vide et curLieu « Vous apercevez » sont déjà couverts ailleurs ;
//  ceci/inventaire/le coffre/sur-rempli/vide-genre/sauf-cachés par F035/F033.)

import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

/** Compile un scénario (avec actions de base) + démarre la partie. */
function demarrer(scenario: string) {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", false);
  return ctx;
}

describe('[F109] [décrire|lister|énumérer objets …] — branches contenu', () => {

  // ============================================================
  //  Préposition « sous » (lignes 113-116)
  // ============================================================

  it('[F109-T001] [décrire objets sous le lit] — objet placé dessous → « Dessous »', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le lit est un support dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets sous le lit]\". " +
      "La valise est un objet sous le lit. ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).withContext("Le contenu sous le lit doit être décrit").toContain("valise");
    expect(sortie).withContext("Préposition sous → « Dessous »").toContain("Dessous");
  });

  it('[F109-T002] [décrire objets sous le lit] — rien dessous → « rien de particulier dessous »', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le lit est un support dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets sous le lit]\". ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).withContext("Rien sous le lit").toContain("rien de particulier dessous");
  });

  it('[F109-T003] [énumérer objets sous le lit] — 2 objets dessous, séparés par « et »', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le lit est un support dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets sous le lit]\". " +
      "La valise est un objet sous le lit. " +
      "Le carton est un objet sous le lit. ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).toContain("valise");
    expect(sortie).toContain("carton");
    expect(sortie).withContext("énumérer → « et », pas « Dessous »").toContain(" et ");
    expect(sortie).not.toContain("Dessous");
  });

  // ============================================================
  //  Cible non trouvée (ligne 131)
  // ============================================================

  it('[F109-T004] [décrire objets dans le tonneau] — cible inexistante → « (cible pas trouvée) »', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets dans le tonneau]\". ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).withContext("Tonneau absent → marqueur cible pas trouvée").toContain("cible pas trouvée");
  });

  // ============================================================
  //  Clause « sauf mentionnés » / « sauf cachés et mentionnés »
  // ============================================================

  it('[F109-T005] [décrire … sauf mentionnés] — un objet deja enumere n est pas re-liste', () => {
    // Premier [énumérer] mentionne la pomme ; le second [décrire … sauf mentionnés]
    // ne doit donc plus la lister, mais doit lister le livre.
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets dans le coffre]{n}[décrire objets dans le coffre sauf mentionnés]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    // L'[énumérer] marque pomme ET livre comme mentionnés ; la 2e balise « sauf mentionnés »
    // les exclut donc tous deux (elle n'émet rien). Les noms proviennent de l'énumération initiale.
    expect(sortie).withContext("pomme énumérée").toContain("pomme");
    expect(sortie).withContext("livre énuméré").toContain("livre");
    // Branche exclureMentionnes exercée : aucun nom n'est dupliqué par la 2e balise.
    expect((sortie.match(/pomme/g) || []).length)
      .withContext("« pomme » une seule fois grâce à « sauf mentionnés »").toBe(1);
    expect((sortie.match(/livre/g) || []).length)
      .withContext("« livre » une seule fois grâce à « sauf mentionnés »").toBe(1);
  });

  it('[F109-T006] [décrire … sauf cachés et mentionnés] — exclut les objets cachés', () => {
    // Caractérisation : [énumérer] affiche les cachés (afficherObjetsCaches=true par défaut),
    // donc on teste ici la balise [décrire … sauf cachés et mentionnés] SEULE : la clause
    // « cachés » doit retirer la clé secrète, et « mentionnés » est inactif (rien mentionné avant).
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre sauf cachés et mentionnés]\". " +
      "La piece est un objet dans le coffre. " +
      "Le jeton est un objet dans le coffre. " +
      "La cle secrete est un objet caché dans le coffre. ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).withContext("La clé secrète (cachée) doit être exclue par « sauf cachés »")
      .not.toContain("cle secrete");
    expect(sortie).withContext("piece visible").toContain("piece");
    expect(sortie).withContext("jeton visible").toContain("jeton");
  });

  // ============================================================
  //  Contenant fermé (visibilité déléguée — caractérisation)
  // ============================================================

  it('[F109-T007] [décrire objets dans le coffre] — coffre FERMÉ : caractérise le rendu', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant fermé dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le panneau", false).sortie;
    expect(sortie).withContext("pas de marqueur d'erreur de balise").not.toContain("@problème balise@");
    expect(sortie).withContext("pas de cible non trouvée pour un coffre déclaré").not.toContain("cible pas trouvée");
    // Caractérisation du comportement RÉEL : un contenant FERMÉ masque son contenu.
    // [décrire objets dans le coffre] rend « Il est vide. » (pas la pomme), car la visibilité
    // est déléguée à executerDecrireContenuFn qui respecte l'état fermé du coffre.
    expect(sortie).withContext("coffre fermé → contenu masqué (« Il est vide. »)").toContain("Il est vide.");
    expect(sortie).withContext("la pomme reste cachée tant que le coffre est fermé").not.toContain("pomme");
  });

  // ============================================================
  //  Branche cible spéciale vide → conjugaison [Pronom ceci] (ligne 121)
  //  (atteignable uniquement via ceci → harnais examiner-description)
  // ============================================================

  it('[F109-T008] [décrire objets dans ceci] — coffre vide via ceci → message « vide »', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"[décrire objets dans ceci]\". ";
    const ctx = demarrer(scenario);
    const sortie = ctx.com.executerCommande("examiner le coffre", false).sortie;
    // La cible spéciale « ceci » vide passe par la conjugaison [Pronom ceci] [v être ipr ceci] vide.
    expect(sortie).withContext("Coffre vide via ceci → « vide »").toContain("vide");
    expect(sortie).withContext("pas de balise non résolue").not.toContain("[Pronom");
  });

});

// ============================================================
//  calculerBaliseSortiesTitre : [titre ici]
// ============================================================

describe('[F109] [titre ici] — calculerBaliseSortiesTitre', () => {

  it('[F109-T009] [titre ici] affiche le titre du lieu courant', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
action tester:
  dire "Lieu : [titre ici].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    // Le titre par défaut du lieu courant (ici « Le salon ») doit s'insérer dans la phrase.
    expect(sortie).withContext("Le titre du lieu courant doit s'afficher").toContain("salon");
    expect(sortie).withContext("préfixe de la phrase conservé").toContain("Lieu :");
  });

});

// ============================================================
//  calculerBaliseListerDecrireListe : lister / décrire d'une liste
//  (énumérer-liste est couvert par F033 ; on cible lister + décrire)
// ============================================================

describe('[F109] [lister|décrire <liste>] — calculerBaliseListerDecrireListe', () => {

  it('[F109-T010] [lister maListe] — affiche les valeurs (liste à puces)', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  changer maListe contient "livre".
  dire "[lister maListe]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("pomme");
    expect(sortie).toContain("livre");
    expect(sortie).withContext("pas de balise non résolue").not.toContain("?!?");
  });

  it('[F109-T011] [décrire maListe] — affiche les valeurs de la liste', () => {
    const scenario = `
Le joueur se trouve dans le salon.
Le salon est un lieu.
La maListe est une liste.
action tester:
  changer maListe contient "pomme".
  changer maListe contient "livre".
  dire "[décrire maListe]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("pomme");
    expect(sortie).toContain("livre");
    expect(sortie).withContext("pas de balise non résolue").not.toContain("?!?");
  });

});
