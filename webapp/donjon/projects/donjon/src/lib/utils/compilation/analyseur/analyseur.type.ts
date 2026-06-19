import { AnalyseurUtils } from "./analyseur.utils";
import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { Definition } from "../../../models/compilateur/definition";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { StringUtils } from "../../commun/string.utils";

export class AnalyseurType {

    /**
     * Nouveau type d’élément.
     * - Ex: Un fruit est un objet mangeable et périssable.
     * @param phrase 
     * @param ctxAnalyse 
     */
    public static testerNouveauType(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

        let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

        const result = ExprReg.xNouveauType.exec(phrase.morceaux[0]);

        if (result !== null) {

            const determinant = result[1];
            const nouveauTypeIntitule = result[2];
            const nouveauTypeNom =StringUtils.normaliserMot(nouveauTypeIntitule);
            const typeParent = StringUtils.normaliserMot(result[3]);
            const attributsBruts = result[4];

            // Une ressource n’est PAS un kind : « Une pomme est une ressource. » est une définition
            //  d’élément (gérée par la regex dédiée ExprReg.xDefinitionRessource). On décline ici pour
            //  que la phrase retombe sur testerDefinitionElement → élément de classe « ressource »
            //  (et sa classe par-nom). Strictement borné à « ressource » : « Un fruit est un objet »
            //  reste un kind.
            if (typeParent === EClasseRacine.ressource) {
                return ResultatAnalysePhrase.aucun;
            }

            // retrouver les attributs éventuels
            let nouveauxAttributs: string[] = null;
            if (attributsBruts?.trim() !== '') {
                // découper les attributs
                nouveauxAttributs = PhraseUtils.separerListeIntitulesEt(attributsBruts, true);
            }

            // Note: le type parent peut être une classe racine (objet, lieu…) — jamais présente
            //  dans typesUtilisateur — ou une classe « par nom ». Sa validité est vérifiée à la
            //  génération, pas ici (l'ancien contrôle était un no-op : erreurs.push() sans argument).

            // si le type est déjà défini
            if (ctxAnalyse.typesUtilisateur.has(nouveauTypeNom)) {

                let typeExistant = ctxAnalyse.typesUtilisateur.get(nouveauTypeNom);

                // garder dernier type parent défini
                typeExistant.typeParent = typeParent;

                // si type parent a déjà été précisé, ajouter une erreur
                if (typeExistant.typeParent !== EClasseRacine.objet) {
                if (ctxAnalyse instanceof ContexteAnalyseV8) {
                    ctxAnalyse.probleme(phrase, undefined,
                        CategorieMessage.type, CodeMessage.typeParentRedefini,
                        "Type parent redéfini",
                        `Le type parent de « ${typeExistant.intitule} » a été défini plusieurs fois. Seul le plus récent sera conservé : « ${typeExistant.typeParent} ».`);
                } else {
                    ctxAnalyse.ajouterErreur(phrase.ligne, "Le type parent de « " + typeExistant.intitule + " » a été défini plusieurs fois.");
                }
                }

                // ajouter les nouveaux attributs
                typeExistant.etats = typeExistant.etats.concat(nouveauxAttributs);

                // si le type n’est pas encore défini
            } else {
                ctxAnalyse.typesUtilisateur.set(nouveauTypeNom, new Definition(
                    nouveauTypeIntitule,
                    typeParent,
                    MotUtils.getNombre(determinant, false),
                    nouveauxAttributs
                ));
            }


            elementTrouve = ResultatAnalysePhrase.type;
        }

        return elementTrouve;
    }

    /**
     * Précision sur un type d’élément.
     * - Ex: Un fruit est un objet mangeable et périssable.
     * @param phrase 
     * @param ctxAnalyse 
     */
    public static testerPrecisionType(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

        let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

        const result = ExprReg.xPrecisionType.exec(phrase.morceaux[0]);

        if (result !== null) {

            const determinant = result[1];
            const typeIntitule = result[2];
            const typeNom =StringUtils.normaliserMot(typeIntitule);
            const attributsBruts = result[3];

            // retrouver les attributs éventuels
            let nouveauxAttributs: string[] = null;
            if (attributsBruts?.trim() !== '') {
                // découper les attributs
                nouveauxAttributs = PhraseUtils.separerListeIntitulesEt(attributsBruts, true);
            }

            // si le type est déjà défini
            if (ctxAnalyse.typesUtilisateur.has(typeNom)) {
                // ajouter les nouveaux attributs
                ctxAnalyse.typesUtilisateur.get(typeNom).etats = ctxAnalyse.typesUtilisateur.get(typeNom).etats.concat(nouveauxAttributs);

                // si le type n’est pas encore défini
            } else {
                ctxAnalyse.typesUtilisateur.set(typeNom, new Definition(
                    typeIntitule,
                    EClasseRacine.objet, // objet par défaut
                    MotUtils.getNombre(determinant, false),
                    nouveauxAttributs
                ));
            }

            elementTrouve = ResultatAnalysePhrase.precisionType;
        }

        return elementTrouve;
    }

}