import { ClasseUtils, ElementsJeuUtils } from "donjon";
import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { TypeRegle } from "../models/compilateur/type-regle";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { Generateur } from "../utils/compilation/generateur";

import { actions } from "./scenario_actions";

const scenario = `        
La caverne est un lieu.

La porte classiqueOuverte est une porte ouverte au nord de la caverne.
Le cheminClassiqueAccessible est un lieu au nord de la caverne.

La porte classiqueFermée est une porte fermée au nord-est de la caverne.
Le cheminClassiqueObstrué est un lieu au nord-est de la caverne.

La porte invisibleFermée est une porte invisible et fermée à l'intérieur de la caverne.
Le cheminVisibleMaisSansAccès est un lieu à l'intérieur de la caverne.

La porte invisibleOuverteEst est une porte invisible et ouverte à l’est de la caverne.
Le cheminVisibleEtAccessible est un lieu à l’est de la caverne.

La porte invisibleOuverteOuest est une porte invisible et ouverte à l’ouest de la caverne.
Le cheminInvisibleEtAccessible est un lieu invisible à l’ouest de la caverne.

La porte visibleOuverteSurCheminInvisible est une porte ouverte au sud-est de la caverne.
Le cheminInvisibleAccessible est un lieu invisible au sud-est de la caverne.

La porte invisibleSurInvisible est une porte invisible au sud-ouest de la caverne.
Le cheminInvisibleSurInvisible est un lieu invisible au sud-ouest de la caverne.
`;

const scenarioCarrefour = `
Le carrefour est un lieu.
Sa description est "Un carrefour en pleine forêt.".

La clairière est un lieu au nord du carrefour.
La grotte est un lieu à l'est du carrefour.
Le village est un lieu au sud du carrefour.

Le grand rocher est un obstacle au nord du carrefour.
Sa description est "Un énorme rocher bloque le passage.".

Le fossé est un obstacle discret à l'est du carrefour.
Sa description est "Un fossé profond coupe la route.".
`;

const scenarioCarrefourFosseMentionne = `
Le carrefour est un lieu.
Sa description est "Un carrefour en pleine forêt. Vous remarquez un fossé[@fossé] à l'est.".

La clairière est un lieu au nord du carrefour.
La grotte est un lieu à l'est du carrefour.
Le village est un lieu au sud du carrefour.

Le grand rocher est un obstacle au nord du carrefour.
Sa description est "Un énorme rocher bloque le passage.".

Le fossé est un obstacle discret à l'est du carrefour.
Sa description est "Un fossé profond coupe la route.".
`;

const scenarioCarrefourRocherMentionne = `
Le carrefour est un lieu.
Sa description est "Un carrefour en pleine forêt. Le grand rocher[@grand rocher] barre le passage au nord.".

La clairière est un lieu au nord du carrefour.
Le village est un lieu au sud du carrefour.

Le grand rocher est un obstacle au nord du carrefour.
Sa description est "Un énorme rocher bloque le passage.".
`;

describe('Test obstacle discret', () => {

  it('[F052-T001] regarder — obstacle discret non affiché, classique affiché', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioCarrefour, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 2); // (joueur,) grand rocher, fossé
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 2); // (inventaire, joueur,) grand rocher, fossé
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", true);

    const grandRocher = ctxPartie.jeu.objets[2];
    expect(grandRocher.nom).toEqual("grand rocher");
    const fosse = ctxPartie.jeu.objets[3];
    expect(fosse.nom).toEqual("fosse");

    // fossé : discret, pas encore vu
    expect(fosse.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(fosse.etats).not.toContain(ctxPartie.jeu.etats.vuID);

    // regarder : grand rocher décrit, fossé non (discret)
    const ctxCommande = ctxPartie.com.executerCommande("regarder", true);
    expect(ctxCommande.sortie).toEqual(
      "{_{*Le carrefour*}_}" +
      "{n}Un carrefour en pleine forêt.{N}" +
      "{U}Le grand rocher bloque la sortie (nord).{N}" +
      "{P}Sorties\u202F: {n}{i}- nord : ? ({/obstrué/}){n}{i}- est : ? ({/obstrué/}){n}{i}- sud : ?{N}"
    );
    // fossé toujours non vu après regarder
    expect(fosse.etats).not.toContain(ctxPartie.jeu.etats.vuID);
  });

  it('[F052-T002] afficher sorties — obstacle discret toujours obstruant', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioCarrefour, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", true);

    const ctxCommande = ctxPartie.com.executerCommande("afficher sorties", false);
    expect(ctxCommande.sortie).toEqual(
      "Sorties\u202F: {n}" +
      "{i}- nord : ? ({/obstrué/}){n}" +
      "{i}- est : ? ({/obstrué/}){n}" +
      "{i}- sud : ?{N}"
    );
  });

  it('[F052-T003] obstacle discret mentionné dans description — pas affiché deux fois, interagissable', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioCarrefourFosseMentionne, actions, true);
    const jeu = Generateur.genererJeu(rc);
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", true);

    const fosse = ctxPartie.jeu.objets[3];
    expect(fosse.nom).toEqual("fosse");

    // regarder : fossé mentionné dans la description via [@fossé], pas affiché une deuxième fois
    let ctxCommande = ctxPartie.com.executerCommande("regarder", true);
    expect(ctxCommande.sortie).toEqual(
      "{_{*Le carrefour*}_}" +
      "{n}Un carrefour en pleine forêt. Vous remarquez un fossé à l'est.{N}" +
      "{U}Le grand rocher bloque la sortie (nord).{N}" +
      "{P}Sorties\u202F: {n}{i}- nord : ? ({/obstrué/}){n}{i}- est : ? ({/obstrué/}){n}{i}- sud : ?{N}"
    );

    // fossé : vu (via [@fossé]), mentionné, toujours discret
    expect(fosse.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(fosse.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(fosse.etats).toContain(ctxPartie.jeu.etats.discretID);

    // examiner fossé : possible puisque vu
    ctxCommande = ctxPartie.com.executerCommande("examiner fossé", false);
    expect(ctxCommande.sortie).toEqual("Un fossé profond coupe la route.{N}");
  });

  it('[F052-T004] obstacle non-discret mentionné dans description via [@] — pas affiché deux fois', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenarioCarrefourRocherMentionne, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 1); // (joueur,) grand rocher
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 1); // (inventaire, joueur,) grand rocher
    const ctxPartie = new ContextePartie(jeu);
    ctxPartie.com.executerCommande("commencer le jeu", true);

    const grandRocher = ctxPartie.jeu.objets[2];
    expect(grandRocher.nom).toEqual("grand rocher");

    // regarder : grand rocher cité dans la description, pas affiché une deuxième fois en section obstacle
    let ctxCommande = ctxPartie.com.executerCommande("regarder", true);
    expect(ctxCommande.sortie).toEqual(
      "{_{*Le carrefour*}_}" +
      "{n}Un carrefour en pleine forêt. Le grand rocher barre le passage au nord.{N}" +
      "{P}Sorties\u202F: {n}{i}- nord : ? ({/obstrué/}){n}{i}- sud : ?{N}"
    );
    // grand rocher vu via [@grand rocher]
    expect(grandRocher.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(grandRocher.etats).toContain(ctxPartie.jeu.etats.mentionneID);

    // examiner grand rocher : interaction possible
    ctxCommande = ctxPartie.com.executerCommande("examiner grand rocher", false);
    expect(ctxCommande.sortie).toEqual("Un énorme rocher bloque le passage.{N}");

    // regarder à nouveau : grand rocher toujours absent de la section auto (description du lieu le mentionne déjà)
    ctxCommande = ctxPartie.com.executerCommande("regarder", true);
    expect(ctxCommande.sortie).toEqual(
      "{_{*Le carrefour*}_}" +
      "{n}Un carrefour en pleine forêt. Le grand rocher barre le passage au nord.{N}" +
      "{P}Sorties\u202F: {n}{i}- nord : ? ({/obstrué/}){n}{i}- sud : ?{N}"
    );
  });

});

describe('Test de la visibilité des portes', () => {
    it('[F052-T005] Nombre de phrases', () => {
        let ctxAnalyse = new ContexteAnalyseV8();
        let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
        expect(phrases).toHaveSize(15); // nombre de phrases
    });

    it('[F052-T006] Regarder', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes et chemins
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes et chemins
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", true);

        ctxCommande = ctxPartie.com.executerCommande("regarder", true);
        expect(ctxCommande.sortie).toEqual("{_{*La caverne*}_}{n}Vous êtes dans la caverne.{N}{U}La porte classiqueOuverte est ouverte.{U}La porte classiqueFermée est fermée.{U}La porte visibleOuverteSurCheminInvisible est ouverte.{N}{P}Sorties : {n}{i}- nord : ?{n}{i}- nord-est : ? ({/obstrué/}){n}{i}- entrer : {+Le cheminVisibleMaisSansAccès+} ({/pas d’accès/}){n}{i}- est : ?{N}");
    });

    it('[F052-T007] Afficher les sorties', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes et chemins
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes et chemins
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", true);

        ctxCommande = ctxPartie.com.executerCommande("afficher sorties", false);
        expect(ctxCommande.sortie).toEqual("Sorties : {n}" +
            "{i}- nord : ?{n}" +
            "{i}- nord-est : ? ({/obstrué/}){n}" +
            "{i}- entrer : {+Le cheminVisibleMaisSansAccès+} ({/pas d’accès/}){n}" +
            "{i}- est : ?{N}");
    });

    it('[F052-T008] Afficher les sorties avec obstacles (option activée)', () => {
        // Étendre le scénario de base avec un obstacle réel (non-porte) au sud
        const scenarioEtendu = scenario + `
Le rocher est un obstacle au sud de la caverne.
Le cheminSud est un lieu au sud de la caverne.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenarioEtendu, actions, true);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", true);

        ctxCommande = ctxPartie.com.executerCommande("afficher sorties", false);
        expect(ctxCommande.sortie).toEqual("Sorties : {n}" +
            "{i}- nord : ?{n}" +
            "{i}- nord-est : ? ({/obstrué/}){n}" +
            "{i}- entrer : {+Le cheminVisibleMaisSansAccès+} ({/pas d’accès/}){n}" +
            "{i}- est : ?{n}" +
            "{i}- sud : ? ({/obstrué/})");
    });

    it('[F052-T009] Afficher les sorties sans obstacles (option désactivée)', () => {
        // Même scénario étendu, mais avec la désactivation de l'affichage des obstacles
        const scenarioEtendu = scenario + `
Le rocher est un obstacle au sud de la caverne.
Le cheminSud est un lieu au sud de la caverne.
désactiver affichage des obstacles.
`;
        const rc = CompilateurV8.analyserScenarioEtActions(scenarioEtendu, actions, true);
        const jeu = Generateur.genererJeu(rc);
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", true);

        ctxCommande = ctxPartie.com.executerCommande("afficher sorties", false);
        // ({/obstrué/}) et ({/pas d'accès/}) ne doivent plus apparaître
        expect(ctxCommande.sortie).toEqual("Sorties : {n}" +
            "{i}- nord : ?{n}" +
            "{i}- nord-est : ?{n}" +
            "{i}- entrer : {+Le cheminVisibleMaisSansAccès+}{n}" +
            "{i}- est : ?{n}" +
            "{i}- sud : ?{N}");
    });

    it('[F052-T010] examiner portes', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes
        const jeu = Generateur.genererJeu(rc)
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu", true);

        let porteClassiqueOuverte = ctxPartie.jeu.objets[2];
        expect(porteClassiqueOuverte.nom).toEqual("porte classiqueouverte");

        let porteClassiqueFermee = ctxPartie.jeu.objets[3];
        expect(porteClassiqueFermee.nom).toEqual("porte classiquefermee");

        let porteInvisibleFermee = ctxPartie.jeu.objets[4];
        expect(porteInvisibleFermee.nom).toEqual("porte invisiblefermee");

        let porteInvisibleOuverteEst = ctxPartie.jeu.objets[5];
        expect(porteInvisibleOuverteEst.nom).toEqual("porte invisibleouverteest");

        let porteInvisibleOuverteOuest = ctxPartie.jeu.objets[6];
        expect(porteInvisibleOuverteOuest.nom).toEqual("porte invisibleouverteouest");

        let porteVisibleOuverteSurCheminInvisible = ctxPartie.jeu.objets[7];
        expect(porteVisibleOuverteSurCheminInvisible.nom).toEqual("porte visibleouvertesurchemininvisible");

        let porteInvisibleSurInvisible = ctxPartie.jeu.objets[8];
        expect(porteInvisibleSurInvisible.nom).toEqual("porte invisiblesurinvisible");

        // états
        // mentionneID: 3, vuID: 4, 
        // familierID: 5, 
        // discretID: 11,  cacheID: 12, secret: 13,
        // accessibleID: 18, adjacentID: 58

        // classique ouverte
        expect(ClasseUtils.getHierarchieClasse(porteClassiqueOuverte.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteClassiqueOuverte.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteClassiqueOuverte.etats).toContain(ctxPartie.jeu.etats.vuID);
        expect(porteClassiqueOuverte.etats).not.toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteClassiqueOuverte.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteClassiqueOuverte.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteClassiqueOuverte.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte ClassiqueOuverte", false);
        expect(ctxCommande.sortie).toEqual("C’est une porte classiqueOuverte.{N}Elle est ouverte. Vous pouvez la fermer.{N}");

        // classique fermée
        expect(ClasseUtils.getHierarchieClasse(porteClassiqueFermee.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.vuID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte ClassiqueFermee", false);
        expect(ctxCommande.sortie).toEqual("C’est une porte classiqueFermée.{N}Elle est fermée. Vous pouvez l’ouvrir.{N}");

        // invisible fermée
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleFermee.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleFermee", false);
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // invisible ouverte est
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleOuverteEst.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleOuverteEst", false);
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // invisible ouverte ouest
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleOuverteOuest.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleOuverteOuest", false);
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // visible ouverte sur chemin invisible
        expect(ClasseUtils.getHierarchieClasse(porteVisibleOuverteSurCheminInvisible.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.vuID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte VisibleOuverteSurCheminInvisible", false);
        expect(ctxCommande.sortie).toEqual("C’est une porte visibleOuverteSurCheminInvisible.{N}Elle est ouverte. Vous pouvez la fermer.{N}");

        // invisible sur invisible
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleSurInvisible.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleSurInvisible", false);
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

    });
});
