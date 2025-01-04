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

describe('Test de la visibilité des portes', () => {
    it('Nombre de phrases', () => {
        let ctxAnalyse = new ContexteAnalyseV8();
        let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
        expect(phrases).toHaveSize(15); // nombre de phrases
    });

    it('Regarder', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes et chemins
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes et chemins
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

        ctxCommande = ctxPartie.com.executerCommande("regarder");
        expect(ctxCommande.sortie).toEqual("{_{*La caverne*}_}{n}Vous êtes dans la caverne.{N}{U}La porte classiqueOuverte est ouverte.{U}La porte classiqueFermée est fermée.{U}La porte visibleOuverteSurCheminInvisible est ouverte.{N}{P}Sorties : {n}{i}- nord : ?{n}{i}- nord-est : ? ({/obstrué/}){n}{i}- entrer : {+Le cheminVisibleMaisSansAccès+} ({/pas d’accès/}){n}{i}- est : ?{N}");
    });

    it('Afficher les sorties', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes et chemins
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes et chemins
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

        ctxCommande = ctxPartie.com.executerCommande("afficher sorties");
        expect(ctxCommande.sortie).toEqual("Sorties : {n}" +
            "{i}- nord : ?{n}" +
            "{i}- nord-est : ? ({/obstrué/}){n}" +
            "{i}- entrer : {+Le cheminVisibleMaisSansAccès+} ({/pas d’accès/}){n}" +
            "{i}- est : ?{N}");
    });

    it('examiner portes', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        expect(rc.monde.objets).toHaveSize(1 + 7); // (joueur,) portes
        const jeu = Generateur.genererJeu(rc)
        expect(jeu.objets).toHaveSize(2 + 7); // (inventaire, joueur,) portes
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

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

        ctxCommande = ctxPartie.com.executerCommande("examiner porte ClassiqueOuverte");
        expect(ctxCommande.sortie).toEqual("C’est une porte classiqueOuverte.{N}Elle est ouverte. Vous pouvez la fermer.{N}");

        // classique fermée
        expect(ClasseUtils.getHierarchieClasse(porteClassiqueFermee.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.vuID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteClassiqueFermee.etats).not.toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteClassiqueFermee.etats).toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte ClassiqueFermee");
        expect(ctxCommande.sortie).toEqual("C’est une porte classiqueFermée.{N}Elle est fermée. Vous pouvez l’ouvrir.{N}");

        // invisible fermée
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleFermee.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleFermee.etats).not.toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleFermee.etats).toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleFermee");
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // invisible ouverte est
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleOuverteEst.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleOuverteEst.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleOuverteEst.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleOuverteEst");
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // invisible ouverte ouest
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleOuverteOuest.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleOuverteOuest.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleOuverteOuest.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleOuverteOuest");
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

        // visible ouverte sur chemin invisible
        expect(ClasseUtils.getHierarchieClasse(porteVisibleOuverteSurCheminInvisible.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.vuID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteVisibleOuverteSurCheminInvisible.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte VisibleOuverteSurCheminInvisible");
        expect(ctxCommande.sortie).toEqual("C’est une porte visibleOuverteSurCheminInvisible.{N}Elle est ouverte. Vous pouvez la fermer.{N}");

        // invisible sur invisible
        expect(ClasseUtils.getHierarchieClasse(porteInvisibleSurInvisible.classe)).toEqual("porte → obstacle → objet → élément → concept → intitulé");
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.presentID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.vuID);
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.invisibleID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.secretID);
        expect(porteInvisibleSurInvisible.etats).toContain(ctxPartie.jeu.etats.ouvertID);
        expect(porteInvisibleSurInvisible.etats).not.toContain(ctxPartie.jeu.etats.fermeID);

        ctxCommande = ctxPartie.com.executerCommande("examiner porte InvisibleSurInvisible");
        expect(ctxCommande.sortie).toEqual("Je ne la vois pas actuellement.{N}");

    });
});
