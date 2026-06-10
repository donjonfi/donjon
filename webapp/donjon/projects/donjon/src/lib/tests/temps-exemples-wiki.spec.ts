import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { actions } from "./scenario_actions";

/**
 * Vérifie les exemples wiki du thème « Temps » (LOT 6 de l'audit de couverture).
 * Le contenu des scénarios doit rester identique aux fichiers :
 *   ressources/scenarios/exemples/wiki/temps/routine_avec_args.djn
 *   ressources/scenarios/exemples/wiki/temps/horloge_jour_nuit.djn
 *   ressources/scenarios/exemples/wiki/temps/calendrier_fetes.djn
 *
 * Les lectures d'horloge sont rejouées de façon déterministe via HorlogeUtils
 * (cf. F058) : `chargerRejeuEtape` est appelé une fois par commande qui lit l'heure,
 * avec un tableau sur-dimensionné (chaque `dire` et chaque `si` consomme une lecture).
 */

function preparer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", false);
  return ctx;
}

/** Charge `n` fois la même heure (epoch ms) pour couvrir toutes les lectures d'une commande. */
function figerHeure(date: Date, n = 20): void {
  HorlogeUtils.chargerRejeuEtape(new Array(n).fill(date.getTime()));
}

// ---- Contenu identique aux fichiers .djn -----------------------------------

const SCN_ROUTINE_ARGS = `Le poste de garde est un lieu.

routine alerter:
  définitions:
    ceci est un texte.
    cela est un nombre.
  exécution:
    dire "{N}ALERTE niveau [c cela] : [ceci] !".
fin routine

action armer:
  dire "Surveillance activée : alerte dans 5 secondes...".
  exécuter la routine alerter avec "intrus détecté" et 3 dans 5 secondes.
fin action

règle avant commencer le jeu:
  dire "Essayez : {/armer/}, puis patientez 5 secondes.".
fin règle
`;

const SCN_HORLOGE = `L'observatoire est un lieu.

action consulter:
  dire "Il est [horloge] (soit [heure] h [minute] min [seconde] s).".
fin action

action saluer:
  si l'heure dépasse 17:
    dire "Bonne soirée !".
  sinonsi l'heure dépasse 11:
    dire "Bon après-midi !".
  sinon:
    dire "Bonne matinée !".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez : {/consulter/} ou {/saluer/}.".
fin règle
`;

const SCN_CALENDRIER = `La place du village est un lieu.

action consulter:
  dire "Aujourd'hui on est un [jour] et nous sommes le [date] [mois] [année].".
fin action

action vérifier:
  si le mois est décembre:
    dire "C'est le mois de Noël !".
  sinonsi le mois dépasse 6:
    dire "On a déjà dépassé la moitié de l'année.".
  sinon:
    dire "L'année ne fait que commencer.".
  fin si
  si le jour est dimanche:
    dire "Et en plus, c'est dimanche : on se repose !".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez : {/consulter/} ou {/vérifier/}.".
fin règle
`;

describe("Exemples wiki — Temps (LOT 6)", () => {

  afterEach(() => {
    HorlogeUtils.terminerRejeu();
    HorlogeUtils.reinitialiser();
  });

  it("[F068-T001] routine programmée AVEC arguments : arme + résout les arguments au déclenchement", () => {
    const ctx = preparer(SCN_ROUTINE_ARGS);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    ctx.com.executerCommande("armer", false);
    expect(ctx.jeu.programmationsTemps.length).toBe(1);
    const prog = ctx.jeu.programmationsTemps[0];
    expect(prog.routine).toBe("alerter");
    expect(prog.argsTrailer).toBe(`"intrus détecté" et 3`);

    // Résolution fire-time + exécution de la routine programmée (cf. verifierChrono).
    const { nom, argsCanoniques } = ctx.ins.parseDeclenchement(`${prog.routine} avec ${prog.argsTrailer}`);
    const liaison = ctx.ins.lierAppelRoutine(nom, argsCanoniques);
    expect(liaison.erreur).toBeUndefined();
    const sortie = ctx.com.executerRoutine(liaison.routine!, liaison.ceciVal, liaison.celaVal);
    expect(sortie).toContain("ALERTE niveau 3");
    expect(sortie).toContain("intrus détecté");
  });

  it("[F068-T002] horloge : consulter affiche l'heure rejouée", () => {
    const ctx = preparer(SCN_HORLOGE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    figerHeure(new Date(2026, 0, 1, 14, 5, 30));
    const sortie = ctx.com.executerCommande("consulter", false).sortie;
    expect(sortie).toContain("14:05");
  });

  it("[F068-T003] horloge : saluer dépend du moment de la journée", () => {
    const ctx = preparer(SCN_HORLOGE);

    figerHeure(new Date(2026, 0, 1, 20, 0, 0));
    expect(ctx.com.executerCommande("saluer", false).sortie).toContain("Bonne soirée");

    figerHeure(new Date(2026, 0, 1, 14, 0, 0));
    expect(ctx.com.executerCommande("saluer", false).sortie).toContain("Bon après-midi");

    figerHeure(new Date(2026, 0, 1, 8, 0, 0));
    expect(ctx.com.executerCommande("saluer", false).sortie).toContain("Bonne matinée");
  });

  it("[F068-T004] calendrier : consulter affiche jour/date/mois/année (vendredi 25 décembre 2026)", () => {
    const ctx = preparer(SCN_CALENDRIER);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);

    figerHeure(new Date(2026, 11, 25, 10, 0, 0)); // vendredi 25 décembre 2026
    const sortie = ctx.com.executerCommande("consulter", false).sortie;
    expect(sortie).toContain("vendredi");
    expect(sortie).toContain("25");
    expect(sortie).toContain("décembre");
    expect(sortie).toContain("2026");
  });

  it("[F068-T005] calendrier : vérifier réagit selon le mois", () => {
    const ctx = preparer(SCN_CALENDRIER);

    figerHeure(new Date(2026, 11, 25, 10, 0, 0)); // décembre
    expect(ctx.com.executerCommande("vérifier", false).sortie).toContain("mois de Noël");

    figerHeure(new Date(2026, 7, 15, 10, 0, 0)); // août (mois 8 > 6)
    expect(ctx.com.executerCommande("vérifier", false).sortie).toContain("dépassé la moitié");

    figerHeure(new Date(2026, 0, 1, 10, 0, 0)); // janvier (jeudi, pas dimanche)
    const janv = ctx.com.executerCommande("vérifier", false).sortie;
    expect(janv).toContain("ne fait que commencer");
    expect(janv).not.toContain("dimanche");
  });

  it("[F068-T006] calendrier : la condition « le jour est dimanche » et la branche dimanche", () => {
    const ctx = preparer(SCN_CALENDRIER);

    figerHeure(new Date(2026, 0, 4, 10, 0, 0)); // dimanche 4 janvier 2026
    expect(ctx.com.executerCommande("vérifier", false).sortie).toContain("c'est dimanche");
  });

  it("[F068-T007] régression : [jour] et « le jour est … » orthographient « jeudi » (pas « jeurdi »)", () => {
    const ctx = preparer(SCN_CALENDRIER);

    figerHeure(new Date(2026, 0, 1, 10, 0, 0)); // jeudi 1er janvier 2026
    const sortie = ctx.com.executerCommande("consulter", false).sortie;
    expect(sortie).toContain("jeudi");
    expect(sortie).not.toContain("jeurdi");
  });
});
