import { TestUtils } from "../utils/test-utils";

// [F108] Balises numériques dans « dire » (InstructionDireNumerique)
// Couvre les branches à faible couverture de instruction-dire-numerique.ts :
//   - [c X]  : valeur d'un compteur (trouvé / NON trouvé → message d'erreur)
//   - [s X]  : pluriel selon une valeur numérique (0 → "", 1 → "", 2 → "s", introuvable → "")
//   - [mémoire X] : valeur mémorisée (trouvée / NON trouvée → message d'erreur)
//   - [calendrier] / [horloge] / [date] / [mois] : balises temps (format)
// La syntaxe DSL est copiée de specs verts existants (compteurs.spec, listes-taille.spec,
// balises-cibles-nommees.spec, instruction.selectionner.spec, temps-exemples-wiki.spec).

describe('[F108] Balises numériques dans dire — [c X] compteur', () => {

  it('[F108-T001] [c score] affiche la valeur du compteur', () => {
    const scenario = `
Le hall est un lieu.
Le score est un compteur initialisé à 7.
action afficher:
  dire "Votre score : [c score].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toContain("Votre score : 7.");
  });

  it('[F108-T002] [c score] reflète une modification runtime (passe à 0)', () => {
    const scenario = `
Le hall est un lieu.
Le score est un compteur initialisé à 5.
action remettre:
  changer le score vaut 0.
fin action
action afficher:
  dire "Score=[c score].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("Score=5.");
    ctx.com.executerCommande("remettre", false);
    expect(ctx.com.executerCommande("afficher", false).sortie).toContain("Score=0.");
  });

  it('[F108-T003] [c X] sur un compteur inexistant → message « pas trouvé »', () => {
    const scenario = `
Le hall est un lieu.
Le score est un compteur initialisé à 1.
action afficher:
  dire "Valeur=[c inexistant].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    // branche : obtenirValeurNumeriqueBalise renvoie null → texte d'erreur
    expect(sortie).withContext(sortie).toContain("inexistant");
    expect(sortie).withContext(sortie).toContain("pas trouvé");
  });

});

describe('[F108] Balises numériques dans dire — [s X] pluriel', () => {

  // Le pluriel suit la valeur d'un compteur : 0 → "", 1 → "", 2 → "s".
  it('[F108-T010] [s X] : "" quand le compteur vaut 1', () => {
    const scenario = `
Le hall est un lieu.
Le nombre est un compteur initialisé à 1.
action afficher:
  dire "objet[s nombre]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toContain("objet");
    expect(sortie).withContext(sortie).not.toContain("objets");
  });

  it('[F108-T011] [s X] : "" quand le compteur vaut 0 (branche val <= 1)', () => {
    const scenario = `
Le hall est un lieu.
Le nombre est un compteur initialisé à 0.
action afficher:
  dire "objet[s nombre]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toContain("objet");
    expect(sortie).withContext(sortie).not.toContain("objets");
  });

  it('[F108-T012] [s X] : "s" quand le compteur vaut 2 (branche val > 1)', () => {
    const scenario = `
Le hall est un lieu.
Le nombre est un compteur initialisé à 2.
action afficher:
  dire "objet[s nombre]".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toContain("objets");
  });

  it('[F108-T013] [s X] sur un compteur inexistant → "" (valeur null)', () => {
    const scenario = `
Le hall est un lieu.
Le nombre est un compteur initialisé à 5.
action afficher:
  dire "objet[s inconnu]fin".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    // null → "" : pas de "s" ajouté, le texte reste "objetfin"
    expect(sortie).withContext(sortie).toContain("objetfin");
  });

  it('[F108-T014] [c X] et [s X] combinés sur le même compteur', () => {
    const scenario = `
Le hall est un lieu.
Le total est un compteur initialisé à 3.
action afficher:
  dire "Il y a [c total] item[s total].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toContain("Il y a 3 items.");
  });

});

describe('[F108] Balises numériques dans dire — [mémoire X]', () => {

  // Syntaxe copiée de instruction.selectionner.spec.ts (F038).
  it('[F108-T020] [mémoire nombre] affiche la valeur sélectionnée', () => {
    const scenario = `
Le hall est un lieu.
action tirer:
  sélectionner un nombre compris entre 4 et 4.
  dire "Résultat : [mémoire nombre].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("tirer", false).sortie;
    expect(sortie).withContext(sortie).toContain("Résultat : 4.");
  });

  it('[F108-T021] [mémoire X] sur une mémoire absente → message « pas trouvée »', () => {
    const scenario = `
Le hall est un lieu.
action afficher:
  dire "Val : [mémoire absente].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    // branche : ctxTour.trouverValeur renvoie undefined → texte d'erreur
    expect(sortie).withContext(sortie).toContain("pas trouvée");
    expect(sortie).withContext(sortie).toContain("absente");
  });

});

describe('[F108] Balises numériques dans dire — temps (calendrier / horloge)', () => {

  it('[F108-T030] [horloge] renvoie un format HH:MM', () => {
    const scenario = `
Le hall est un lieu.
action afficher:
  dire "Il est [horloge].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toMatch(/Il est \d{2}:\d{2}\./);
  });

  it('[F108-T031] [calendrier] renvoie un format HH:MM', () => {
    const scenario = `
Le hall est un lieu.
action afficher:
  dire "Maintenant [calendrier].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toMatch(/Maintenant \d{2}:\d{2}\./);
  });

  it('[F108-T032] [date] et [mois] renvoient des valeurs non vides', () => {
    const scenario = `
Le hall est un lieu.
action afficher:
  dire "On est le [date] [mois].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    // [date] = numéro du jour (1 à 31), [mois] = nom du mois
    expect(sortie).withContext(sortie).toMatch(/On est le \d{1,2} \S+\./);
  });

  it('[F108-T033] [heure] et [minute] renvoient des entiers', () => {
    const scenario = `
Le hall est un lieu.
action afficher:
  dire "h=[heure] m=[minute].".
fin action
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sortie = ctx.com.executerCommande("afficher", false).sortie;
    expect(sortie).withContext(sortie).toMatch(/h=\d+ m=\d+\./);
  });

});
