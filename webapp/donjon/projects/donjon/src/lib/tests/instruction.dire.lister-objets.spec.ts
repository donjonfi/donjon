import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

describe('Balise [lister|décrire objets dans <contenant>]', () => {

  // ============================================================
  //  RÉGRESSION — cibles spéciales (ceci, inventaire, ici)
  // ============================================================

  it('[décrire objets dans ceci] — cible spéciale, coffre ouvert plein', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"[décrire objets dans ceci]\". " +
      "La pomme est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le coffre", false);
    expect(sortie.sortie).withContext("Le contenu du coffre doit être décrit").toContain("pomme");
  });

  it('[décrire objets inventaire] — cible spéciale, inventaire vide', () => {
    const scenario =
      "La salle est un lieu. " +
      "La boite est un objet dans la salle. " +
      "Sa description est \"[décrire objets inventaire]\". ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner la boite", false);
    expect(sortie.sortie).withContext("L'inventaire est vide").toContain("Votre inventaire est vide.");
  });

  // ============================================================
  //  NOM SPÉCIFIQUE — contenu visible
  // ============================================================

  it('[décrire objets dans le coffre] — nom spécifique, coffre plein', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le coffre", false);
    expect(sortie.sortie).withContext("Le contenu du coffre doit être décrit").toContain("pomme");
  });

  it('[lister objets dans le coffre] — nom spécifique, coffre plein', () => {
    // Le panneau isole le test : examiner le panneau n'ajoute pas de listing standard du coffre
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[lister objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).withContext("La liste doit contenir la pomme").toContain("une pomme");
  });

  // ============================================================
  //  NOM SPÉCIFIQUE — contenant vide, accord en genre
  // ============================================================

  it('[décrire objets dans le coffre] — contenant vide, masculin → Il est vide.', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre]\". ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le coffre", false);
    expect(sortie.sortie).withContext("Coffre masculin vide").toContain("Il est vide.");
  });

  it('[décrire objets dans la caisse] — contenant vide, féminin → Elle est vide.', () => {
    const scenario =
      "La salle est un lieu. " +
      "La caisse est un contenant ouvert dans la salle. " +
      "Sa description est \"[décrire objets dans la caisse]\". ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner la caisse", false);
    expect(sortie.sortie).withContext("Caisse féminine vide").toContain("Elle est vide.");
  });

  // ============================================================
  //  NOM SPÉCIFIQUE — support (sur)
  // ============================================================

  it('[décrire objets sur la table] — support, objet posé dessus', () => {
    const scenario =
      "La salle est un lieu. " +
      "La table est un support dans la salle. " +
      "Sa description est \"[décrire objets sur la table]\". " +
      "Le livre est un objet sur la table. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner la table", false);
    expect(sortie.sortie).withContext("Le livre doit être listé sur la table").toContain("livre");
  });

  // ============================================================
  //  NOM SPÉCIFIQUE — sauf cachés
  // ============================================================

  it('[décrire objets dans le coffre sauf cachés] — objets cachés exclus', () => {
    // Le panneau isole le test : examiner le panneau n'ajoute pas de listing standard du coffre
    // (examiner coffre relance [décrire objets dans ceci] sans sauf cachés → montrerait les cachés)
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre sauf cachés]\". " +
      "La piece d'or est un objet dans le coffre. " +
      "La cle secrete est un objet caché dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const sortie = ctx.com.executerCommande("examiner le panneau", false);
    expect(sortie.sortie).withContext("La pièce d'or doit être visible").toContain("piece");
    expect(sortie.sortie).withContext("La clé secrète ne doit pas apparaître").not.toContain("cle secrete");
  });

  // ============================================================
  //  COHÉRENCE — nom spécifique == ceci (même sortie)
  // ============================================================

  it('[décrire objets dans le coffre] == [décrire objets dans ceci] pour le même coffre', () => {
    const mkScenario = (balise: string) =>
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Sa description est \"" + balise + "\". " +
      "La pomme est un objet dans le coffre. ";

    const run = (balise: string) => {
      const rc = CompilateurV8.analyserScenarioEtActions(mkScenario(balise), actions, false);
      const jeu = Generateur.genererJeu(rc);
      const ctx = new ContextePartie(jeu);
      ctx.com.executerCommande("commencer le jeu", false);
      return ctx.com.executerCommande("examiner le coffre", false).sortie;
    };

    expect(run("[décrire objets dans le coffre]"))
      .withContext("Par nom et par ceci doivent produire la même sortie")
      .toEqual(run("[décrire objets dans ceci]"));
  });

});

// ============================================================
//  COMBINAISON — énumérer + lister + décrire dans une même description
// ============================================================

describe('Combinaison [énumérer] + [lister] + [décrire objets dans] dans la même description', () => {

  it('ordre 1 : [énumérer] + [lister] + [décrire] — les trois balises cohabitent', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[énumérer objets dans le coffre]{n}[lister objets dans le coffre]{n}[décrire objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("examiner le panneau", false).sortie;
    // [énumérer] : "une pomme et un livre"
    // [lister]   : liste à puces "- une pomme …"
    // [décrire]  : "Dedans, il y a une pomme et un livre."
    // → " et " doit apparaître 2 fois (une par [énumérer] + une par [décrire])
    expect((s.match(/ et /g) || []).length).withContext("' et ' doit apparaître 2 fois ([énumérer] + [décrire])").toBe(2);
    expect(s).withContext("[lister] doit produire une liste à puces").toContain("- une pomme");
    expect(s).withContext("[décrire] doit produire 'Dedans'").toContain("Dedans");
    expect(s).not.toContain("@problème balise@");
  });

  it('ordre 2 : [décrire] + [lister] + [énumérer] — les trois balises cohabitent', () => {
    const scenario =
      "La salle est un lieu. " +
      "Le coffre est un contenant ouvert dans la salle. " +
      "Le panneau est un objet dans la salle. " +
      "Sa description est \"[décrire objets dans le coffre]{n}[lister objets dans le coffre]{n}[énumérer objets dans le coffre]\". " +
      "La pomme est un objet dans le coffre. " +
      "Le livre est un objet dans le coffre. ";
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", false);
    const s = ctx.com.executerCommande("examiner le panneau", false).sortie;
    // [décrire]  : "Dedans, il y a une pomme et un livre."
    // [lister]   : liste à puces "- une pomme …"
    // [énumérer] : "une pomme et un livre"
    // → " et " doit apparaître 2 fois (une par [décrire] + une par [énumérer])
    expect((s.match(/ et /g) || []).length).withContext("' et ' doit apparaître 2 fois ([décrire] + [énumérer])").toBe(2);
    expect(s).withContext("[lister] doit produire une liste à puces").toContain("- une pomme");
    expect(s).withContext("[décrire] doit produire 'Dedans'").toContain("Dedans");
    expect(s).not.toContain("@problème balise@");
  });

});
