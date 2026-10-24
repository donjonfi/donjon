import { AnalyseurCommunUtils } from "../utils/compilation/analyseur/analyseur-commun-utils";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { EClasseRacine } from "../models/commun/constantes";
import { ClasseUtils } from "../utils/commun/classe-utils";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";
import { PhraseUtils } from "../utils/commun/phrase-utils";

describe('F059 — Type « fond »', () => {

    it('[F059-T001] « Le ciel est un fond. » → classe fond héritant d’objet', () => {
        const scenario = `
Le salon est un lieu.
Le ciel est un fond.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);

        const ciel = ctxPartie.jeu.objets.find(o => o.nom === "ciel");
        expect(ciel, "le ciel doit exister comme objet").toBeTruthy();
        expect(ClasseUtils.heriteDe(ciel.classe, EClasseRacine.fond), "le ciel doit être un fond").toBe(true);
        expect(ClasseUtils.heriteDe(ciel.classe, EClasseRacine.objet), "un fond hérite d’objet").toBe(true);
        expect(ClasseUtils.getHierarchieClasse(ciel.classe))
            .toEqual("fond → objet → élément → concept → intitulé");
    });

    it('[F059-T002] portée parsée (commun/propre, tous / par état)', () => {
        const scenario = `
Le salon est un lieu.
Le ciel est un fond. Il est commun à tous les lieux.
La mer est un fond. Elle est commune dans les lieux côtiers.
Le sol est un fond. Il est propre à chaque lieu.
Le plafond est un fond. Il est propre aux lieux couverts.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);

        const ciel = rc.monde.objets.find(o => o.nom === "ciel");
        expect(ciel.presenceFond, "ciel a une présence").toBeTruthy();
        expect(ciel.presenceFond.portee).toEqual("partage");
        expect(ciel.presenceFond.tousLesLieux).toBe(true);

        const mer = rc.monde.objets.find(o => o.nom === "mer");
        expect(mer.presenceFond.portee).toEqual("partage");
        expect(mer.presenceFond.tousLesLieux).toBe(false);
        expect(mer.presenceFond.etatDomaine).toEqual("côtier");

        const sol = rc.monde.objets.find(o => o.nom === "sol");
        expect(sol.presenceFond.portee).toEqual("parLieu");
        expect(sol.presenceFond.tousLesLieux).toBe(true);

        const plafond = rc.monde.objets.find(o => o.nom === "plafond");
        expect(plafond.presenceFond.portee).toEqual("parLieu");
        expect(plafond.presenceFond.tousLesLieux).toBe(false);
        expect(plafond.presenceFond.etatDomaine).toEqual("couvert");
    });

    it('[F059-T004] fond commun : présent partout, non listé, examinable, non-prenable', () => {
        const scenario = `
Le salon est un lieu.
Le jardin est un lieu au nord du salon.
Le ciel est un fond. Il est commun à tous les lieux.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);

        const ciel = ctxPartie.jeu.objets.find(o => o.nom === "ciel");
        expect(ciel).toBeTruthy();
        // présent dans le salon (départ)
        expect(ciel.etats, "ciel présent au départ").toContain(ctxPartie.jeu.etats.presentID);

        // non listé dans « regarder »
        let r = ctxPartie.com.executerCommande("regarder", true);
        expect(r.sortie, "le fond n’est pas listé").not.toContain("ciel");

        // examinable
        r = ctxPartie.com.executerCommande("examiner le ciel", false);
        expect(r.sortie, "examiner le ciel doit réussir").toContain("ciel");

        // non-prenable (fixé)
        r = ctxPartie.com.executerCommande("prendre le ciel", false);
        expect(r.sortie, "le ciel ne peut pas être pris").toContain("fixé");

        // déplacement → toujours présent (commun à tous les lieux)
        ctxPartie.com.executerCommande("aller au nord", false);
        expect(ciel.etats, "ciel encore présent dans le jardin").toContain(ctxPartie.jeu.etats.presentID);
    });

    it('[F059-T005] fond propre à chaque lieu : une instance par lieu, non listée, examinable', () => {
        const scenario = `
Le salon est un lieu.
Le jardin est un lieu au nord du salon.
Le sol est un fond. Il est propre à chaque lieu.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);

        // une instance de « sol » par lieu (2)
        const sols = jeu.objets.filter(o => o.nom === "sol");
        expect(sols.length, "un sol par lieu").toBe(2);
        expect(sols.every(s => s.position && s.position.cibleType === EClasseRacine.lieu), "chaque instance est positionnée dans un lieu").toBe(true);
        const lieuIds = sols.map(s => s.position.cibleId);
        expect(new Set(lieuIds).size, "une instance par lieu distinct").toBe(2);

        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);

        // non listé
        let r = ctxPartie.com.executerCommande("regarder", true);
        expect(r.sortie, "le sol n’est pas listé").not.toContain("sol");
        // examinable (instance du lieu courant)
        r = ctxPartie.com.executerCommande("examiner le sol", false);
        expect(r.sortie, "examiner le sol doit réussir").toContain("sol");
    });

    it('[F059-T006] aperçu d’un fond commun affiché avec la description du lieu', () => {
        const scenario = `
Le salon est un lieu.
Le ciel est un fond. Il est commun à tous les lieux.
L'aperçu du ciel est "Le ciel est dégagé.".
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);

        const r = ctxPartie.com.executerCommande("regarder", true);
        expect(r.sortie, "l’aperçu du fond apparaît dans la description").toContain("Le ciel est dégagé.");
        // mais le ciel n’est pas listé comme objet (« apercevez … »)
        expect(r.sortie).not.toContain("apercevez");
    });

    it('[F059-T007] domaine filtré par état (commun + propre) : seulement dans les lieux de l’état', () => {
        const scenario = `
Le rivage est un lieu côtier.
Le bois est un lieu au nord du rivage.
La mer est un fond. Elle est commune dans les lieux côtiers.
Le sable est un fond. Il est propre aux lieux côtiers.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);

        // propre aux lieux côtiers → 1 seule instance (le rivage)
        const sables = jeu.objets.filter(o => o.nom === "sable");
        expect(sables.length, "une instance de sable dans le seul lieu côtier").toBe(1);

        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true); // départ : rivage (1er lieu)

        const mer = ctxPartie.jeu.objets.find(o => o.nom === "mer");
        // au rivage (côtier) : mer présente
        expect(mer.etats, "mer présente au rivage côtier").toContain(ctxPartie.jeu.etats.presentID);

        // aller au bois (non côtier) : mer absente (présence dynamique)
        ctxPartie.com.executerCommande("aller au nord", false);
        expect(mer.etats, "mer absente au bois non côtier").not.toContain(ctxPartie.jeu.etats.presentID);
    });

    it('[F059-T008] portée déclarée INLINE « un fond propre/commun … » dans la définition', () => {
        const scenario = `
Le salon est un lieu.
Le jardin est un lieu au nord du salon.
Le ciel est un fond commun à tous les lieux.
La mer est un fond commun dans les lieux côtiers.
Le sol est un fond propre à chaque lieu.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);

        const ciel = rc.monde.objets.find(o => o.nom === "ciel");
        expect(ciel.presenceFond?.portee, "ciel partagé").toEqual("partage");
        expect(ciel.presenceFond?.tousLesLieux).toBe(true);
        expect(ciel.attributs, "« commun » n’est pas un attribut").not.toContain("commun");

        const mer = rc.monde.objets.find(o => o.nom === "mer");
        expect(mer.presenceFond?.portee).toEqual("partage");
        expect(mer.presenceFond?.tousLesLieux).toBe(false);
        expect(mer.presenceFond?.etatDomaine).toEqual("côtier");

        const sol = rc.monde.objets.find(o => o.nom === "sol");
        expect(sol.presenceFond?.portee, "sol propre").toEqual("parLieu");
        expect(sol.attributs, "« propre » n’est pas un attribut").not.toContain("propre");

        // end-to-end : sol propre → 2 instances (une par lieu)
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets.filter(o => o.nom === "sol").length, "un sol par lieu").toBe(2);
    });

    it('[F059-T009] surcharge de description PAR LIEU en définition (« le sol situé dans X »)', () => {
        const scenario = `
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
Le sol est un fond. Il est propre à chaque lieu.
La description du sol est "Un sol carrelé.".
La description du sol situé dans la cuisine est "Un carrelage gras.".
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);

        const cuisine = jeu.lieux.find(l => l.nom === "cuisine");
        const salon = jeu.lieux.find(l => l.nom === "salon");
        const sols = jeu.objets.filter(o => o.nom === "sol");
        expect(sols.length).toBe(2);

        const solCuisine = sols.find(s => s.position.cibleId === cuisine.id);
        const solSalon = sols.find(s => s.position.cibleId === salon.id);
        expect(solCuisine.description, "instance cuisine surchargée").toEqual("Un carrelage gras.");
        expect(solSalon.description, "instance salon = défaut").toEqual("Un sol carrelé.");
    });

    it('[F059-T010] surcharge par lieu avec valeur vide « … est "". » acceptée', () => {
        const scenario = `
La cuisine est un lieu.
Le sol est un fond. Il est propre à chaque lieu.
La description du sol est "Un sol carrelé.".
La description du sol situé dans la cuisine est "".
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const cuisine = jeu.lieux.find(l => l.nom === "cuisine");
        const solCuisine = jeu.objets.filter(o => o.nom === "sol").find(s => s.position.cibleId === cuisine.id);
        expect(solCuisine, "le sol de la cuisine existe").toBeTruthy();
        expect(solCuisine.description, "surcharge vide enregistrée").toEqual("");
    });

    it('[F059-T011] condition : sujet localisé « le sol situé dans X est <état> » (forme « situé »)', () => {
        const scenario = `
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
Le sol est un fond sale. Il est propre à chaque lieu.
action tester:
  phase exécution:
    si le sol situé dans la cuisine est sale, dire "OUI-CUISINE".
    si le sol situé dans la cuisine est propre, dire "NON-PROPRE".
fin action
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);
        const r = ctxPartie.com.executerCommande("tester", false);
        expect(r.sortie, "la condition localisée résout l'instance et évalue son état").toContain("OUI-CUISINE");
        expect(r.sortie, "l'instance n'est pas « propre »").not.toContain("NON-PROPRE");
    });

    it('[F059-T012] fond inaccessible : présent et examinable, mais marqué inaccessible', () => {
        const scenario = `
Le salon est un lieu.
Le ciel est un fond inaccessible. Il est commun à tous les lieux.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);

        const ciel = ctxPartie.jeu.objets.find(o => o.nom === "ciel");
        expect(ciel.etats, "ciel présent (commun)").toContain(ctxPartie.jeu.etats.presentID);
        expect(ciel.etats, "ciel inaccessible").toContain(ctxPartie.jeu.etats.inaccessibleID);
        // reste examinable (on voit le ciel même si on ne peut pas l'atteindre)
        const r = ctxPartie.com.executerCommande("examiner le ciel", false);
        expect(r.sortie, "examiner le ciel réussit").toContain("ciel");
    });

    it('[F059-T013] décomposition : « déplacer <sujet localisé> vers Y »', () => {
        const result = AnalyseurCommunUtils.decomposerInstructionSimple("déplacer les objets qui se trouvent dans le coffre vers l'inventaire");
        expect(result, "instruction décomposée").toBeTruthy();
        expect(result.sujet?.nomEpithete, "sujet = locateur conservé").toEqual("objets qui se trouvent dans le coffre");
        expect(result.preposition1).toEqual("vers");
        expect(result.sujetComplement1?.nom, "destination").toContain("inventaire");
    });

    it('[F059-T014] runtime : déplacer les objets qui se trouvent dans X vers l’inventaire', () => {
        const scenario = `
Le salon est un lieu.
Le coffre est un contenant ici. Il est ouvert.
La clé est un objet dans le coffre.
Le caillou est un objet dans le coffre.
action vider:
phase exécution:
déplacer les objets qui se trouvent dans le coffre vers l'inventaire.
fin action
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);
        ctxPartie.com.executerCommande("vider", false);
        const cle = ctxPartie.jeu.objets.find(o => o.nom === "cle"); // nom normalisé (sans accent)
        const caillou = ctxPartie.jeu.objets.find(o => o.nom === "caillou");
        expect(cle.etats, "clé déplacée vers l'inventaire").toContain(ctxPartie.jeu.etats.possedeID);
        expect(caillou.etats, "caillou déplacé vers l'inventaire").toContain(ctxPartie.jeu.etats.possedeID);
    });

    it('[F059-T015] instruction : déplacer X vers le joueur (déterminant)', () => {
        const scenario = `
Le salon est un lieu.
Le coffre est un contenant ici. Il est ouvert.
Le caillou est un objet dans le coffre.
action ranger:
phase exécution:
déplacer le caillou vers le joueur.
fin action
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);
        ctxPartie.com.executerCommande("ranger", false);
        const caillou = ctxPartie.jeu.objets.find(o => o.nom === "caillou");
        expect(caillou.etats, "caillou possédé (déplacer vers le joueur)").toContain(ctxPartie.jeu.etats.possedeID);
    });

    it('[F059-T016] instruction : déplacer X vers l’inventaire (déterminant)', () => {
        const scenario = `
Le salon est un lieu.
Le coffre est un contenant ici. Il est ouvert.
Le caillou est un objet dans le coffre.
action ranger:
phase exécution:
déplacer le caillou vers l'inventaire.
fin action
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);
        ctxPartie.com.executerCommande("ranger", false);
        const caillou = ctxPartie.jeu.objets.find(o => o.nom === "caillou");
        expect(caillou.etats, "caillou possédé (déplacer vers l'inventaire)").toContain(ctxPartie.jeu.etats.possedeID);
    });

    it('[F059-T017] décomposition : « la description du sol situé dans la cuisine » préserve le locateur', () => {
        const prop = PhraseUtils.trouverPropriete("la description du sol situé dans la cuisine");
        expect(prop, "propriété décomposée").toBeTruthy();
        expect(prop.intituleProprieteElement?.nom, "nom de la propriété").toEqual("description");
        // le locateur doit survivre dans l'intitulé de l'élément (nomEpithete)
        const loc = PhraseUtils.extraireLocalisationReference(prop.intituleElement.nomEpithete);
        expect(loc, "locateur extractible depuis l'intitulé élément").toBeTruthy();
        expect(loc.base, "base").toContain("sol");
        expect(loc.preposition).toEqual("dans");
        expect(loc.cible, "cible").toContain("cuisine");
    });

    it('[F059-T018] runtime : changer une propriété d’une instance de fond ciblée par locateur', () => {
        const scenario = `
La cuisine est un lieu.
Le salon est un lieu au nord de la cuisine.
Le sol est un fond. Il est propre à chaque lieu.
La description du sol est "Un sol carrelé.".
action tremper:
  phase exécution:
    changer la description du sol situé dans la cuisine est "Le carrelage est trempé.".
fin action
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        ctxPartie.com.executerCommande("commencer le jeu", true);
        ctxPartie.com.executerCommande("tremper", false);

        const cuisine = ctxPartie.jeu.lieux.find(l => l.nom === "cuisine");
        const salon = ctxPartie.jeu.lieux.find(l => l.nom === "salon");
        const sols = ctxPartie.jeu.objets.filter(o => o.nom === "sol");
        const solCuisine = sols.find(s => s.position.cibleId === cuisine.id);
        const solSalon = sols.find(s => s.position.cibleId === salon.id);
        expect(solCuisine.description, "instance cuisine modifiée par le locateur").toEqual("Le carrelage est trempé.");
        expect(solSalon.description, "instance salon INCHANGÉE (le locateur cible une seule instance)").toEqual("Un sol carrelé.");
    });

    it('[F059-T003] « est propre » nu reste un attribut/état (pas une portée)', () => {
        const scenario = `
Le salon est un lieu.
Le tapis est un objet ici. Il est propre.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
        const tapis = rc.monde.objets.find(o => o.nom === "tapis");
        expect(tapis.presenceFond, "pas de portée sur un attribut nu").toBeFalsy();
        expect(tapis.attributs).toContain("propre");
    });

});
