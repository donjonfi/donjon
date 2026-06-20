// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ————————————————————————————————————————————————————————————————————————————————————————————
//   [F101] ACTIONS PERSONNALISÉES — résolution / déclenchement (actions-utils, P0 br46)
// ————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// actions-utils.ts est massivement traversé par l'intégration mais peu asserté côté branches
// (br46, 169/370). On exerce ici la chaîne de résolution d'une action personnalisée définie
// dans le scénario :
//   - chercherCandidatsActionSansControle (verbe connu, bon nombre d'arguments)
//   - trouverActionPersonnalisee + verifierCandidatCeciCela (classe / sujet précis / états)
//   - obtenirRaisonRefusCommande (verbe inconnu, trop/trop peu d'arguments, classe/état KO)
//
// Approche : une « action <verbe> [ceci [cela]]: » dont la phase épilogue pose un état
// « marqué » (ou affiche une sortie). Si l'action a bien été déclenchée avec les bons
// compléments, l'effet est visible ; sinon le moteur produit un refus dans la sortie.
//
// IDs : [F101-TNNN].

import { TestUtils } from "../utils/test-utils";

describe('[F101] actions personnalisées — action sans complément', () => {

  function scenarioSansComplement(): string {
    return `
le salon est un lieu.
le joueur se trouve dans le salon.
action saluer:
  phase épilogue:
    changer le joueur est marqué.
fin action`;
  }

  it('[F101-T001] verbe seul → action déclenchée (état posé)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioSansComplement());
    ctx.com.executerCommande("saluer", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F101-T002] verbe inconnu → refus (verbe pas reconnu)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioSansComplement());
    const s = ctx.com.executerCommande("zorgloter", false).sortie;
    // verbe absent du jeu et du dictionnaire → branche "Je ne connais pas le verbe"
    expect(s).toContain("verbe");
    // l'action légitime n'a pas été déclenchée
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeFalse();
  });

  it('[F101-T003] complément de trop sur action sans argument → action non déclenchée', () => {
    const scenario = scenarioSansComplement() + `
la pomme est un objet dans le salon.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // « saluer » ne prend pas d'argument : « saluer la pomme » → refus (complément de trop)
    ctx.com.executerCommande("saluer la pomme", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeFalse();
  });

});

describe('[F101] actions personnalisées — action avec un complément (ceci)', () => {

  // « ceci est un objet … » = cible de type CLASSE → branche verifierCandidatCeciCela / estCibleUneClasse.
  function scenarioCeci(): string {
    return `
le salon est un lieu.
le joueur se trouve dans le salon.
la pomme est un objet dans le salon.
action astiquer ceci:
  définitions:
    ceci est un objet visible.
  phase épilogue:
    changer ceci est marqué.
fin action`;
  }

  it('[F101-T010] verbe + complément objet → action déclenchée sur ceci', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeci());
    ctx.com.executerCommande("astiquer la pomme", false);
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(pomme).toBeTruthy();
    expect(ctx.jeu.etats.possedeEtatElement(pomme, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F101-T011] complément manquant → refus (il manque le complément)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeci());
    const s = ctx.com.executerCommande("astiquer", false).sortie;
    // action connue mais argument manquant → message d'explication (« il manque le complément »)
    expect(s).toContain("manque");
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, 'marqué', ctx.eju)).toBeFalse();
  });

  it('[F101-T012] complément introuvable → refus, action non déclenchée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeci());
    // « banane » n'existe pas → aucun candidat valide pour ceci
    ctx.com.executerCommande("astiquer la banane", false);
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, 'marqué', ctx.eju)).toBeFalse();
  });

  it('[F101-T013] sujet précis (cible non-classe) → résolution sur le nom exact', () => {
    // « ceci est la pomme » : cible = sujet précis (determinant « la » ≠ un/une/des) → branche B.
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
la pomme est un objet dans le salon.
la poire est un objet dans le salon.
action astiquer ceci:
  définitions:
    ceci est la pomme.
  phase épilogue:
    changer le joueur est marqué.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // sur la pomme : ok
    ctx.com.executerCommande("astiquer la pomme", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F101-T014] sujet précis : autre objet → action non déclenchée', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
la pomme est un objet dans le salon.
la poire est un objet dans le salon.
action astiquer ceci:
  définitions:
    ceci est la pomme.
  phase épilogue:
    changer le joueur est marqué.
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    // « astiquer la poire » : la cible précise est la pomme → pas de correspondance
    ctx.com.executerCommande("astiquer la poire", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeFalse();
  });

});

describe('[F101] actions personnalisées — contrainte d\'état sur le complément', () => {

  // L'état requis sur ceci (« ouvert ») filtre les candidats dans verifierCandidatCeciCela.
  function scenario(etatInitial: string): string {
    return `
le salon est un lieu.
le joueur se trouve dans le salon.
le coffre est un contenant ${etatInitial} dans le salon.
action vider ceci:
  définitions:
    ceci est un contenant ouvert.
  phase épilogue:
    changer le joueur est marqué.
fin action`;
  }

  it('[F101-T020] état requis présent → action déclenchée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('ouvert'));
    ctx.com.executerCommande("vider le coffre", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F101-T021] état requis absent → action refusée (non déclenchée)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario('fermé'));
    // coffre fermé : la contrainte « ouvert » n'est pas remplie → candidat écarté
    ctx.com.executerCommande("vider le coffre", false);
    expect(ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju)).toBeFalse();
  });

});

describe('[F101] actions personnalisées — action à deux compléments (ceci + cela)', () => {

  function scenarioCeciCela(): string {
    return `
le salon est un lieu.
le joueur se trouve dans le salon.
la clé est un objet dans le salon.
la serrure est un objet dans le salon.
action insérer ceci dans cela:
  définitions:
    ceci est un objet visible.
    cela est un objet visible.
  phase épilogue:
    changer ceci est marqué.
    changer cela est marqué.
fin action`;
  }

  it('[F101-T030] verbe + deux compléments → action déclenchée sur ceci et cela', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeciCela());
    ctx.com.executerCommande("insérer la clé dans la serrure", false);
    const cle = ctx.jeu.objets.find(o => o.nom === 'cle');
    const serrure = ctx.jeu.objets.find(o => o.nom === 'serrure');
    expect(ctx.jeu.etats.possedeEtatElement(cle, 'marqué', ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(serrure, 'marqué', ctx.eju)).toBeTrue();
  });

  it('[F101-T031] un seul complément fourni → refus (il manque un complément)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeciCela());
    const s = ctx.com.executerCommande("insérer la clé", false).sortie;
    expect(s).toContain("manque");
    const cle = ctx.jeu.objets.find(o => o.nom === 'cle');
    expect(ctx.jeu.etats.possedeEtatElement(cle, 'marqué', ctx.eju)).toBeFalse();
  });

  it('[F101-T032] second complément introuvable → action non déclenchée', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioCeciCela());
    // « cadenas » n'existe pas → pas de candidat valide pour cela
    ctx.com.executerCommande("insérer la clé dans le cadenas", false);
    const cle = ctx.jeu.objets.find(o => o.nom === 'cle');
    expect(ctx.jeu.etats.possedeEtatElement(cle, 'marqué', ctx.eju)).toBeFalse();
  });

});

describe('[F101] actions personnalisées — synonymes & priorité de résolution', () => {

  it('[F101-T040] synonyme du verbe → même action déclenchée', () => {
    // « nettoyer » est synonyme de « astiquer » → chercherCandidatsActionSansControle
    // doit retrouver l'action via la liste des synonymes.
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
la pomme est un objet dans le salon.
action astiquer ceci:
  définitions:
    ceci est un objet visible.
  phase épilogue:
    changer ceci est marqué.
fin action
interpréter nettoyer comme astiquer.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("nettoyer la pomme", false);
    const pomme = ctx.jeu.objets.find(o => o.nom === 'pomme');
    expect(ctx.jeu.etats.possedeEtatElement(pomme, 'marqué', ctx.eju)).toBeTrue();
  });

});
