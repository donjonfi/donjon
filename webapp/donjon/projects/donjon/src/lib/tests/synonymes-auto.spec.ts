import { Generateur } from "../utils/compilation/generateur";
import { ElementJeu } from "../models/jeu/element-jeu";
import { ClassesRacines, ElementsJeuUtils, GroupeNominal, MotUtils, PhraseUtils } from "donjon";
import { TestUtils } from "../utils/test-utils";

describe('Synonymes auto − Découpe', () => {

    it('[F049-T001] Ballon rouge', () => {
        const ej = new ElementJeu(1, "Le Ballon rouge", PhraseUtils.getGroupeNominalDefini("Le Ballon rouge", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Ballon rouge");
        Generateur.genererSynonymesAuto(ej);
        // chaque mot-clé est généré au singulier ET au pluriel
        expect(ej.synonymes).toHaveSize(4);
        expect(ej.synonymes[0].nomEpithete).toEqual("ballon");
        expect(ej.synonymes[1].nomEpithete).toEqual("ballons");
        expect(ej.synonymes[2].nomEpithete).toEqual("rouge");
        expect(ej.synonymes[3].nomEpithete).toEqual("rouges");
    });

    it('[F049-T002] la lettre verte', () => {
        const ej = new ElementJeu(1, "la lettre verte", PhraseUtils.getGroupeNominalDefini("la lettre verte", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("lettre verte");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(4);
        expect(ej.synonymes[0].nomEpithete).toEqual("lettre");
        expect(ej.synonymes[1].nomEpithete).toEqual("lettres");
        expect(ej.synonymes[2].nomEpithete).toEqual("verte");
        expect(ej.synonymes[3].nomEpithete).toEqual("vertes");
    });


    it('[F049-T003] Monsieur Dubois', () => {
        const ej = new ElementJeu(1, "Monsieur Dubois", PhraseUtils.getGroupeNominalDefini("Monsieur Dubois", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Monsieur Dubois");
        Generateur.genererSynonymesAuto(ej);
        // « dubois » est invariable (se termine par s) → pas de forme singulier mutilée (« duboi »)
        expect(ej.synonymes).toHaveSize(3);
        expect(ej.synonymes[0].nomEpithete).toEqual("monsieur");
        expect(ej.synonymes[1].nomEpithete).toEqual("monsieurs");
        expect(ej.synonymes[2].nomEpithete).toEqual("dubois");
    });

    it('[F049-T004] Clé verte rouillée', () => {
        const ej = new ElementJeu(1, "Clé de bois sec", PhraseUtils.getGroupeNominalDefini("Clé de bois sec", false), ClassesRacines.Objet);
        
        expect(ej.intitule.nomEpithete).toEqual("Clé de bois sec");
        Generateur.genererSynonymesAuto(ej);
        // mots simples au singulier+pluriel (« bois » invariable) ; combinaisons à 2 mots inchangées
        expect(ej.synonymes).toHaveSize(8);
        expect(ej.synonymes[0].nomEpithete).toEqual("cle");
        expect(ej.synonymes[1].nomEpithete).toEqual("cles");
        expect(ej.synonymes[2].nomEpithete).toEqual("cle bois");
        expect(ej.synonymes[3].nomEpithete).toEqual("cle sec");
        expect(ej.synonymes[4].nomEpithete).toEqual("bois");
        expect(ej.synonymes[5].nomEpithete).toEqual("bois sec");
        expect(ej.synonymes[6].nomEpithete).toEqual("sec");
        expect(ej.synonymes[7].nomEpithete).toEqual("secs");
    });

    it('[F049-T005] Jacques', () => {
        const ej = new ElementJeu(1, "Jacques", PhraseUtils.getGroupeNominalDefini("Jacques", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Jacques");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(0);
    });
});

describe('Synonymes auto − Découpe', () => {

    it('[F049-T006] interroger comte du chateau sur chateau d’if', () => {
        const scenario = `
            Le bois est un lieu.
            Le chateau d’if est un objet ici.
            Le comte du chateau est une personne ici.
            `;
        const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

        // (index 0 et 1 utilisés pour inventaire et joueur)
        expect(ctx.jeu.objets).toHaveSize(4);
        expect(ctx.jeu.objets[2].nom).toEqual("chateau d'if");
        expect(ctx.jeu.objets[2].synonymes).toHaveSize(4);
        expect(ctx.jeu.objets[2].synonymes[0].nom).toEqual('chateau');
        expect(ctx.jeu.objets[2].synonymes[0].epithete).toBeFalsy();
        expect(ctx.jeu.objets[2].synonymes[1].nom).toEqual('chateaux');
        expect(ctx.jeu.objets[2].synonymes[2].nom).toEqual('if');
        expect(ctx.jeu.objets[2].synonymes[2].epithete).toBeFalsy();
        expect(ctx.jeu.objets[2].synonymes[3].nom).toEqual('ifs');
        expect(ctx.jeu.objets[3].nom).toEqual('comte du chateau');
        expect(ctx.jeu.objets[3].synonymes).toHaveSize(4);
        expect(ctx.jeu.objets[3].synonymes[0].nom).toEqual('comte');
        expect(ctx.jeu.objets[3].synonymes[0].epithete).toBeFalsy();
        expect(ctx.jeu.objets[3].synonymes[1].nom).toEqual('comtes');
        expect(ctx.jeu.objets[3].synonymes[2].nom).toEqual('chateau');
        expect(ctx.jeu.objets[3].synonymes[2].epithete).toBeFalsy();
        expect(ctx.jeu.objets[3].synonymes[3].nom).toEqual('chateaux');

        const ctxCom = ctx.com.decomposerCommande('interroger comte sur le chateau');
        expect(ctxCom.brute).toEqual('interroger comte sur le chateau');

        // A) VÉRIFIER DÉCOUPE
        // B) VÉRIFIER CORRESPONDANCE OBJETS

        expect(ctxCom.candidats).toHaveSize(2);
        expect(ctxCom.candidats[0].score).toBeGreaterThan(ctxCom.candidats[1].score);

        // infinitif
        expect(ctxCom.candidats[0].els.infinitif).toEqual('interroger');
        // préposition0
        expect(ctxCom.candidats[0].els.preposition0).toBeUndefined();
        // ceci
        expect(ctxCom.candidats[0].isCeciV1).toBeTrue();
        expect(ctxCom.candidats[0].ceciIntituleV1.toString()).toEqual('comte');
        expect(ctxCom.candidats[0].correspondCeci.nbCor).toEqual(1);
        expect(ctxCom.candidats[0].correspondCeci.elements[0].nom).toEqual("comte du chateau");
        // préposition1
        expect(ctxCom.candidats[0].els.preposition1).toEqual('concernant');
        // cela
        expect(ctxCom.candidats[0].isCelaV1).toBeTrue();
        expect(ctxCom.candidats[0].celaIntituleV1.toString()).toEqual('le chateau');
        expect(ctxCom.candidats[0].correspondCela.nbCor).toEqual(1);
        expect(ctxCom.candidats[0].correspondCela.elements[0].nom).toEqual("chateau d'if");

        // infinitif
        expect(ctxCom.candidats[1].els.infinitif).toEqual('interroger');
        // préposition0
        expect(ctxCom.candidats[1].els.preposition0).toBeUndefined();
        // ceci
        expect(ctxCom.candidats[1].isCeciV1).toBeTrue();
        expect(ctxCom.candidats[1].ceciIntituleV1.toString()).toEqual('comte sur le chateau');
        // préposition1
        expect(ctxCom.candidats[1].els.preposition1).toBeUndefined();
        // cela
        expect(ctxCom.candidats[1].isCelaV1).toBeFalse();
        expect(ctxCom.candidats[1].celaIntituleV1).toBeUndefined();

    });

});