import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { actions } from "./scenario_actions";

/**
 * Vérifie que les scénarios d'exemple `.djn` (routines programmées + horloge) compilent
 * sans erreur et se comportent comme attendu. Le contenu doit rester identique aux fichiers :
 *   ressources/scenarios/exemples/temps/test_routines_programmees.djn
 *   ressources/scenarios/exemples/temps/test_horloge.djn
 *   ressources/scenarios/exemples/temps/test_routines_programmees_et_horloge.djn
 */

function preparer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", false);
  return ctx;
}

// ---- Contenu identique aux fichiers .djn -----------------------------------

const SCN_ROUTINES = `Le titre du jeu est "Test - Routines programmées".
L'auteur du jeu est "Donjon FI".

Le laboratoire est un lieu.

règle après commencer le jeu:
  dire "Tapez « sonner », « alerter » ou « lancer », puis patientez 3 secondes que la routine programmée se déclenche.".
fin règle

routine bip:
  dire "{N}BIP ! (routine sans paramètre déclenchée)".
fin routine

routine prevenir:
  définitions:
    ceci est un texte.
  exécution:
    dire "{N}ALERTE : [ceci] détecté !".
fin routine

routine compte:
  définitions:
    ceci est un nombre.
  exécution:
    dire "{N}Décompte : il reste [c ceci] minutes.".
fin routine

action sonner:
  dire "Minuteur armé : sonnerie dans 3 secondes...".
  exécuter la routine bip dans 3 secondes.
fin action

action alerter:
  dire "Surveillance activée : alerte dans 3 secondes...".
  exécuter la routine prevenir avec "intrus" dans 3 secondes.
fin action

action lancer:
  dire "Décompte programmé dans 3 secondes...".
  exécuter la routine compte avec 5 dans 3 secondes.
fin action
`;

const SCN_HORLOGE = `Le titre du jeu est "Test - Horloge".
L'auteur du jeu est "Donjon FI".

Le observatoire est un lieu.

règle après commencer le jeu:
  dire "Tapez « consulter » pour lire l'horloge, ou « saluer » pour un message dépendant de l'heure.".
fin règle

action consulter:
  dire "Horloge : [horloge].".
  dire "Heure : [heure] h [minute] min [seconde] s.".
  dire "Date : [jour] [date] [mois] [année].".
fin action

action saluer:
  si l'heure dépasse 17:
    dire "Bonne soirée !".
  sinonsi l'heure dépasse 11:
    dire "Bon après-midi !".
  sinon:
    dire "Bonne matinée !".
  fin si.
fin action
`;

const SCN_COMBINE = `Le titre du jeu est "Test - Routines programmées + Horloge".
L'auteur du jeu est "Donjon FI".

Le poste est un lieu.

règle après commencer le jeu:
  dire "Tapez « horodater » : dans 3 secondes, une routine programmée consignera un événement avec l'heure de déclenchement.".
fin règle

routine consigner:
  définitions:
    ceci est un texte.
  exécution:
    dire "{N}[horloge] — événement « [ceci] » consigné.".
fin routine

action horodater:
  dire "Consignation programmée dans 3 secondes...".
  exécuter la routine consigner avec "ouverture de la porte" dans 3 secondes.
fin action
`;

describe("Exemples .djn — routines programmées + horloge", () => {

  afterEach(() => {
    HorlogeUtils.terminerRejeu();
    HorlogeUtils.reinitialiser();
  });

  it("[F058-T001] routines programmées : compile + arme une programmation (sans param et avec param)", () => {
    const ctx = preparer(SCN_ROUTINES);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    ctx.com.executerCommande("sonner", false);
    expect(ctx.jeu.programmationsTemps.length).toBe(1);
    expect(ctx.jeu.programmationsTemps[0].routine).toBe("bip");
    expect(ctx.jeu.programmationsTemps[0].argsTrailer).toBeUndefined();

    ctx.com.executerCommande("alerter", false);
    expect(ctx.jeu.programmationsTemps.length).toBe(2);
    expect(ctx.jeu.programmationsTemps[1].routine).toBe("prevenir");
    expect(ctx.jeu.programmationsTemps[1].argsTrailer).toBe(`"intrus"`);

    ctx.com.executerCommande("lancer", false);
    expect(ctx.jeu.programmationsTemps[2].routine).toBe("compte");
    expect(ctx.jeu.programmationsTemps[2].argsTrailer).toBe("5");
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it("[F058-T002] horloge : compile + lit l'heure (rejouée de façon déterministe)", () => {
    const ctx = preparer(SCN_HORLOGE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 14, 5, 30).getTime()]);
    const sortie = ctx.com.executerCommande("consulter", false).sortie;
    expect(sortie).toContain("14");

    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 20, 0, 0).getTime()]);
    const salut = ctx.com.executerCommande("saluer", false).sortie;
    expect(salut).toContain("Bonne soirée");
  });

  it("[F058-T003] combinaison : routine programmée paramétrée qui lit l'horloge", () => {
    const ctx = preparer(SCN_COMBINE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    ctx.com.executerCommande("horodater", false);
    expect(ctx.jeu.programmationsTemps.length).toBe(1);
    expect(ctx.jeu.programmationsTemps[0].routine).toBe("consigner");
    expect(ctx.jeu.programmationsTemps[0].argsTrailer).toBe(`"ouverture de la porte"`);

    // Simuler la résolution fire-time + exécution de la routine programmée (cf. verifierChrono).
    const prog = ctx.jeu.programmationsTemps[0];
    const { nom, argsCanoniques } = ctx.ins.parseDeclenchement(`${prog.routine} avec ${prog.argsTrailer}`);
    const liaison = ctx.ins.lierAppelRoutine(nom, argsCanoniques);
    expect(liaison.erreur).toBeUndefined();
    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 9, 30, 0).getTime()]);
    const sortie = ctx.com.executerRoutine(liaison.routine!, liaison.ceciVal, liaison.celaVal);
    expect(sortie).toContain("ouverture de la porte");
    expect(sortie).toContain("09:30");
  });
});
