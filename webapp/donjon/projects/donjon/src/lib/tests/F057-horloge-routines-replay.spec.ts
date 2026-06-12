import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { Sauvegarde } from "../models/jouer/sauvegarde";
import { CommandesUtils } from "../utils/jeu/commandes-utils";
import { actions } from "./scenario_actions";

/**
 * Paramètres de routines programmées dans le replay + déterminisme de l'horloge.
 *
 * Couvre :
 *  - HorlogeUtils (capture/rejeu des lectures d'heure, lecture manquante) ;
 *  - encodage de l'étape 'd' avec arguments (rétrocompat sans args) ;
 *  - round-trip complet d'un déclenchement paramétré : encode → parse → lier (surcharge) → exécuter ;
 *  - les sites de lecture d'heure passent par HorlogeUtils (déterminisme du replay).
 */

function preparer(scenario: string): ContextePartie {
  const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
  const jeu = Generateur.genererJeu(rc);
  const ctx = new ContextePartie(jeu);
  ctx.com.executerCommande("commencer le jeu", false);
  return ctx;
}

describe("Horloge déterministe + paramètres de routines au replay", () => {

  afterEach(() => {
    // Éviter toute fuite d'état statique entre tests.
    HorlogeUtils.terminerRejeu();
    HorlogeUtils.reinitialiser();
  });

  // ============================================================
  //  HorlogeUtils (unité)
  // ============================================================

  it("[F057-T001] live : maintenant() accumule les lectures, prélevées par preleverLecturesEtape", () => {
    HorlogeUtils.reinitialiser();
    const a = HorlogeUtils.maintenant();
    const b = HorlogeUtils.maintenant();
    expect(a instanceof Date).toBeTrue();
    const lectures = HorlogeUtils.preleverLecturesEtape();
    expect(lectures.length).toBe(2);
    expect(lectures[0]).toBe(a.getTime());
    expect(lectures[1]).toBe(b.getTime());
    // après prélèvement, le buffer est vide
    expect(HorlogeUtils.preleverLecturesEtape().length).toBe(0);
  });

  it("[F057-T002] rejeu : chargerRejeuEtape rend les valeurs stockées (au lieu de l'heure réelle)", () => {
    HorlogeUtils.reinitialiser();
    const fige = new Date(2020, 0, 1, 13, 37, 0).getTime();
    HorlogeUtils.chargerRejeuEtape([fige]);
    const d = HorlogeUtils.maintenant();
    expect(d.getTime()).toBe(fige);
    expect(d.getHours()).toBe(13);
    expect(d.getMinutes()).toBe(37);
    expect(HorlogeUtils.aLectureManquante).toBeFalse();
  });

  it("[F057-T003] rejeu épuisé : lecture supplémentaire → heure réelle + drapeau lecture manquante", () => {
    HorlogeUtils.reinitialiser();
    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 13, 0, 0).getTime()]);
    HorlogeUtils.maintenant(); // consomme la seule valeur stockée
    expect(HorlogeUtils.aLectureManquante).toBeFalse();
    HorlogeUtils.maintenant(); // lecture en trop → heure réelle
    expect(HorlogeUtils.aLectureManquante).toBeTrue();
  });

  // ============================================================
  //  Encodage de l'étape 'd' (rétrocompat)
  // ============================================================

  it("[F057-T010] sans argument : 'd:nom' (byte-identique à l'ancien format)", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    ctx.ajouterDeclenchementDansSauvegarde("sonner");
    const fichier = ctx.creerFichierEnregistrement();
    const d = fichier.etapes.find(e => e.type === 'd');
    expect(d?.valeur).toBe("sonner");
  });

  it("[F057-T011] avec arguments : 'd:nom avec <canonique>'", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    ctx.ajouterDeclenchementDansSauvegarde("afficher", "42");
    ctx.ajouterDeclenchementDansSauvegarde("dire", `"bonjour" et 3`);
    const fichier = ctx.creerFichierEnregistrement();
    const ds = fichier.etapes.filter(e => e.type === 'd');
    expect(ds[0].valeur).toBe("afficher avec 42");
    expect(ds[1].valeur).toBe(`dire avec "bonjour" et 3`);
  });

  // ============================================================
  //  Round-trip complet d'un déclenchement paramétré
  // ============================================================

  it("[F057-T020] parseDeclenchement sépare nom + arguments canoniques", () => {
    const ctx = preparer(`Le salon est un lieu.`);
    expect(ctx.ins.parseDeclenchement("sonner")).toEqual({ nom: "sonner", argsCanoniques: [] });
    expect(ctx.ins.parseDeclenchement("afficher avec 42")).toEqual({ nom: "afficher", argsCanoniques: ["42"] });
    expect(ctx.ins.parseDeclenchement(`dire avec "a et b" et 3`)).toEqual({ nom: "dire", argsCanoniques: [`"a et b"`, "3"] });
  });

  it("[F057-T021] round-trip encode → parse → lier → exécuter (type nombre)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "v=[c ceci]".
      fin routine
    `);
    // encode (ce que fait le lecteur au déclenchement)
    ctx.ajouterDeclenchementDansSauvegarde("afficher", "42");
    const fichier = ctx.creerFichierEnregistrement();
    const valeur = fichier.etapes.find(e => e.type === 'd')!.valeur;
    // parse + lier (ce que fait le replay)
    const { nom, argsCanoniques } = ctx.ins.parseDeclenchement(valeur);
    const liaison = ctx.ins.lierAppelRoutine(nom, argsCanoniques);
    expect(liaison.erreur).toBeUndefined();
    expect(liaison.routine?.nom).toBe("afficher");
    // exécuter avec les valeurs liées
    const sortie = ctx.com.executerRoutine(liaison.routine!, liaison.ceciVal, liaison.celaVal);
    expect(sortie).toContain("v=42");
  });

  it("[F057-T022] surcharge : un argument canonique nombre rejoue la surcharge nombre, pas la classe", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      Le coffre est un objet ici.
      routine traiter:
        définitions:
          ceci est un nombre.
        exécution:
          dire "NOMBRE=[c ceci]".
      fin routine
      routine traiter:
        définitions:
          ceci est un objet.
        exécution:
          dire "OBJET=[intitulé ceci]".
      fin routine
    `);
    // un nombre canonique (entier nu) doit lier la surcharge « nombre »
    const liaisonNombre = ctx.ins.lierAppelRoutine("traiter", ["7"]);
    expect(liaisonNombre.erreur).toBeUndefined();
    expect(ctx.com.executerRoutine(liaisonNombre.routine!, liaisonNombre.ceciVal, liaisonNombre.celaVal)).toContain("NOMBRE=7");
    // un nom d'élément (sans guillemets) doit lier la surcharge « objet »
    const liaisonObjet = ctx.ins.lierAppelRoutine("traiter", ["coffre"]);
    expect(liaisonObjet.erreur).toBeUndefined();
    expect(ctx.com.executerRoutine(liaisonObjet.routine!, liaisonObjet.ceciVal, liaisonObjet.celaVal)).toContain("OBJET=");
  });

  it("[F057-T023] canoniserArg round-trip (nombre / texte / classe)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      Le coffre rouge est un objet ici.
      routine rnombre:
        définitions:
          ceci est un nombre.
        exécution:
          dire "[c ceci]".
      fin routine
      routine rtexte:
        définitions:
          ceci est un texte.
        exécution:
          dire "[ceci]".
      fin routine
      routine robjet:
        définitions:
          ceci est un objet.
        exécution:
          dire "[intitulé ceci]".
      fin routine
    `);
    const ln = ctx.ins.lierAppelRoutine("rnombre", ["42"]);
    expect(ctx.ins.canoniserArg(ln.ceciVal!, ln.routine!.paramCeci!)).toBe("42");

    const lt = ctx.ins.lierAppelRoutine("rtexte", [`"bonjour"`]);
    expect(ctx.ins.canoniserArg(lt.ceciVal!, lt.routine!.paramCeci!)).toBe(`"bonjour"`);

    const lo = ctx.ins.lierAppelRoutine("robjet", ["coffre rouge"]);
    expect(lo.erreur).toBeUndefined();
    const canon = ctx.ins.canoniserArg(lo.ceciVal!, lo.routine!.paramCeci!);
    // le nom canonique se re-résout vers le même élément
    const relier = ctx.ins.lierAppelRoutine("robjet", [canon]);
    expect(relier.erreur).toBeUndefined();
    expect(relier.ceciVal).toBe(lo.ceciVal);
  });

  // ============================================================
  //  Fire-time : routine programmée avec arguments
  // ============================================================

  it("[F057-T024] routine programmée à nom capitalisé : résoluble via le nom mémorisé (minuscule)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      routine Sonner:
        dire "DING".
      fin routine
      règle après commencer le jeu:
        exécuter la routine Sonner dans 1 seconde.
      fin règle
    `);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.jeu.programmationsTemps.length).toBe(1);
    // ProgrammationTemps mémorise le nom en minuscules ; la liaison doit rester insensible à la casse.
    const nomMemorise = ctx.jeu.programmationsTemps[0].routine;
    expect(nomMemorise).toBe("sonner");
    const liaison = ctx.ins.lierAppelRoutine(nomMemorise, []);
    expect(liaison.erreur).toBeUndefined();
    expect(liaison.routine?.nom.toLocaleLowerCase()).toBe("sonner");
  });

  it("[F057-T025] fire-time : le trailer mémorisé est résolu au déclenchement (reproduit verifierChrono)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      routine afficher:
        définitions:
          ceci est un nombre.
        exécution:
          dire "v=[c ceci]".
      fin routine
      règle après commencer le jeu:
        exécuter la routine afficher avec 7 dans 1 seconde.
      fin règle
    `);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const prog = ctx.jeu.programmationsTemps[0];
    expect(prog.routine).toBe("afficher");
    expect(prog.argsTrailer).toBe("7");

    // Reproduit la résolution fire-time de verifierChrono : reconstruire la valeur 'd', parser, lier.
    const valeur = prog.argsTrailer ? `${prog.routine} avec ${prog.argsTrailer}` : prog.routine;
    const { nom, argsCanoniques } = ctx.ins.parseDeclenchement(valeur);
    const liaison = ctx.ins.lierAppelRoutine(nom, argsCanoniques);
    expect(liaison.erreur).toBeUndefined();
    // le compteur (valeur 7) est lu au déclenchement
    const sortie = ctx.com.executerRoutine(liaison.routine!, liaison.ceciVal, liaison.celaVal);
    expect(sortie).toContain("v=7");
    // la forme canonique enregistrée dans le 'd' est la valeur résolue (entier nu)
    expect(ctx.ins.canoniserArg(liaison.ceciVal!, liaison.routine!.paramCeci!)).toBe("7");
  });

  // ============================================================
  //  annuler N tours : alignement horloge ↔ étapes
  // ============================================================

  it("[F057-T040] enleverToursDeJeux préserve l'alignement horlogesSauvegarde (et les 'd')", () => {
    const sauvegarde = new Sauvegarde();
    sauvegarde.etapesSauvegarde = ["g:seed", "c:nord", "c:sud", "d:tic"];
    sauvegarde.horlogesSauvegarde = [null, [111], [222], [333]];

    // annuler 1 tour : retire la dernière commande ('c:sud') ; le 'd:tic' trailing est préservé.
    CommandesUtils.enleverToursDeJeux(1, sauvegarde);

    expect(sauvegarde.etapesSauvegarde).toEqual(["g:seed", "c:nord", "d:tic"]);
    // les lectures restent alignées : 'c:sud'/[222] retiré, 'd:tic'/[333] conservé.
    expect(sauvegarde.horlogesSauvegarde).toEqual([null, [111], [333]]);
  });

  it("[F057-T041] enleverToursDeJeux : sauvegarde sans horlogesSauvegarde (rétrocompat) ne plante pas", () => {
    const sauvegarde = new Sauvegarde();
    sauvegarde.etapesSauvegarde = ["g:seed", "c:nord", "c:sud"];
    // horlogesSauvegarde absent (ancien fichier)
    CommandesUtils.enleverToursDeJeux(1, sauvegarde);
    expect(sauvegarde.etapesSauvegarde).toEqual(["g:seed", "c:nord"]);
  });

  // ============================================================
  //  Sites de lecture d'heure → HorlogeUtils (déterminisme)
  // ============================================================

  it("[F057-T030] balise [heure de l'horloge] utilise HorlogeUtils (valeur rejouée)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      action tester:
        dire "il est [heure]h".
      fin action
    `);
    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 9, 0, 0).getTime()]);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("il est 9h");
  });

  it("[F057-T032] une seule lecture d'horloge par instruction dire (calendrier + horloge partagés)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      action tester:
        dire "il est [heure]h le [date] [mois]".
      fin action
    `);
    // Une seule valeur stockée : si le dire ne lit l'horloge qu'une fois, elle suffit.
    HorlogeUtils.chargerRejeuEtape([new Date(2020, 5, 15, 9, 0, 0).getTime()]);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("9h");
    expect(sortie).toContain("15");
    expect(sortie).toContain("juin");
    // une seule valeur a suffi → aucune lecture manquante → 1 seule lecture pour ce dire
    expect(HorlogeUtils.aLectureManquante).toBeFalse();
  });

  it("[F057-T031] condition sur l'heure utilise HorlogeUtils (valeur rejouée alimente la logique)", () => {
    const ctx = preparer(`
      Le salon est un lieu.
      action tester:
        si l'heure vaut 9, dire "MATIN".
      fin action
    `);
    HorlogeUtils.chargerRejeuEtape([new Date(2020, 0, 1, 9, 0, 0).getTime()]);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    expect(sortie).toContain("MATIN");
  });
});
