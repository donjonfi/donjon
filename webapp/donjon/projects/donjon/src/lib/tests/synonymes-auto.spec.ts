import { Generateur } from "../utils/compilation/generateur";
import { ElementJeu } from "../models/jeu/element-jeu";
import { ClassesRacines, ElementsJeuUtils, GroupeNominal, MotUtils, PhraseUtils } from "donjon";

describe('Synonymes auto − Découpe', () => {

    it('Ballon rouge', () => {
        const ej = new ElementJeu(1, "Le Ballon rouge", PhraseUtils.getGroupeNominalDefini("Le Ballon rouge", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Ballon rouge");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(2);
        expect(ej.synonymes[0].nomEpithete).toEqual("ballon");
        expect(ej.synonymes[1].nomEpithete).toEqual("rouge");
    });

    it('la lettre verte', () => {
        const ej = new ElementJeu(1, "la lettre verte", PhraseUtils.getGroupeNominalDefini("la lettre verte", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("lettre verte");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(2);
        expect(ej.synonymes[0].nomEpithete).toEqual("lettre");
        expect(ej.synonymes[1].nomEpithete).toEqual("verte");
    });

    
    it('Monsieur Dubois', () => {
        const ej = new ElementJeu(1, "Monsieur Dubois", PhraseUtils.getGroupeNominalDefini("Monsieur Dubois", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Monsieur Dubois");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(2);
        expect(ej.synonymes[0].nomEpithete).toEqual("monsieur");
        expect(ej.synonymes[1].nomEpithete).toEqual("dubois");
    });

    it('Jacques', () => {
        const ej = new ElementJeu(1, "Jacques", PhraseUtils.getGroupeNominalDefini("Jacques", false), ClassesRacines.Objet);
        expect(ej.intitule.nomEpithete).toEqual("Jacques");
        Generateur.genererSynonymesAuto(ej);
        expect(ej.synonymes).toHaveSize(0);
    });
});