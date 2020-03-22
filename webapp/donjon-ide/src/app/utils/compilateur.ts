import { Definition } from '../models/definition';
import { ElementGenerique } from '../models/element-generique';
import { Genre } from '../models/genre.enum';
import { Jeu } from '../models/jeu';
import { Monde } from '../models/monde';
import { Nombre } from '../models/nombre.enum';
import { Phrase } from '../models/phrase';
import { PositionSujetString } from '../models/position-sujet';
import { TypeElement } from '../models/type-element.enum';

export class Compilateur {

    static verbeux = true;

    /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), attributs(5), position(6), genre complément(7), complément(8) */
    static readonly xPositionElementGeneriqueDefini = /^(le |la |l'|les )(.+?)(\(f\))? (?:est|sont) (?:|(?:un|une|des) (.+?)(| .+?) )?((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les |un | une )|de (?:la |l')|du ))(.+)/i;

    // readonly xPositionElementGeneriqueIndefini = /^(un |une |des )(\S+?) (.+?)(\(f\))? (?:est|sont) ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )|de (?:la |l')|du ))(.+)/i;
    /** élément générique positionné par rapport à complément :
     * -> soit : determinant(1)), type(2), nom(2+3), attributs(3), féminin?(4), position(9), complément(10)
     * -> soit : determinant(5), type(6), nom(6+7), attributs(7), féminin?(8), position(9), complément(10)
     */
    static readonly xPositionElementGeneriqueIndefini = /^(?:(?:il y a (un |une |des |du |de l'|[1-9]\d* )(\S+)(?: (.+?))?(\(f\))?)|(?:(un |une |des |du |de l')(\S+)(?: (.+?))?(\(f\))? (?:est|sont))) ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les |un |une )))(.+)/i;
    // readonly xPositionElementGeneriqueIlya = /^il y a (un |une |des |du |de l')(.+?)(\(f\))? ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )))(.+)/i;

    /** élément générique simple -> determinant(1), nom(2), féminin?(3), type(4), attributs(5) */
    static readonly xDefinitionTypeElement = /^(le |la|l'|les)(.+?)(\(f\))? (?:est|sont) (?:un|une|des) (\S+)(| .+)/i;

    /** pronom démonstratif -> determinant(1), type(2), attributs(3) */
    static readonly xPronomDemonstratif = /^((?:c'est (?:un|une))|(?:ce sont des)) (\S+)(| .+)/i;

    /** pronom personnel position -> position(1), complément(2) */
    static readonly xPronomPersonnelPosition = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont)) (?:(?:(à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'))|(?:dans (?:la |le |l'|un |une )|de (?:la |l')|du ))(.+)/i;
    /** pronom personnel -> attributs(1) */
    static readonly xPronomPersonnelAttribut = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont))((?!une |un |des ) (?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

    /** élément générique -> déterminant (1), nom (2), féminin?(3) attributs(4).
     * ex: Le champignon est brun et on peut le cuillir.
     */
    static readonly xElementSimpleAttribut = /^(le |la |l'|les )(.+?)(\(f\))? (?:est|sont) ((?!une |un |des |dans )(?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

    static readonly xNombrePluriel = /^[2-9]\d*$/;

    /**
     * Interpréter le code source fourni et renvoyer le jeu correspondant.
     * @param source Code à interpréter.
     */
    public static parseCode(source: string): Jeu {
        // le jeu
        let jeu = new Jeu();
        let monde = new Monde();
        jeu.monde = monde;

        // retirer les retours à la ligne et les espace avant et après le bloc de texte.
        const blocTexte = source.replace(/(\r|\n)/g, "").trim();

        // séparer les commentaires (entre " ") du code
        const blocsCodeEtCommentaire = blocTexte.split('"');

        let phrases = new Array<Phrase>();
        let indexPhrase = 0;
        // si le bloc de texte commence par " on commence avec un bloc de commentaire
        let blocSuivantEstCode = true;
        if (blocTexte[0] === '"') {
            blocSuivantEstCode = false;
        }

        // séparer les blocs en phrases sauf les commentaires
        blocsCodeEtCommentaire.forEach(bloc => {
            if (bloc !== '') {
                // bloc de code, séparer les phrases (sur les '.')
                if (blocSuivantEstCode) {
                    const phrasesBrutes = bloc.split('.');
                    phrasesBrutes.forEach(phraseBrute => {
                        const phraseNettoyee = phraseBrute.replace('.', '').trim();
                        if (phraseNettoyee !== '') {
                            phrases.push(new Phrase(phraseNettoyee, false, false, null, indexPhrase++));
                        }
                    });
                } else {
                    // si le bloc est un commentaire, l'ajouter tel quel
                    phrases.push(new Phrase(bloc, true, false, null, indexPhrase++));
                }
                blocSuivantEstCode = !blocSuivantEstCode;
            }
        });

        if (Compilateur.verbeux) {
            console.log("Voici les phrases: ", phrases);
        }

        // retrouver les éléments dans le code source
        let typesUtilisateur: Map<string, Definition> = new Map();
        let elementsGeneriques = new Array<ElementGenerique>();
        let result: RegExpExecArray;

        // ajouter le joueur au monde
        elementsGeneriques.push(new ElementGenerique("le ", "joueur", "joueur", TypeElement.joueur, null, Genre.m, Nombre.s, 1, null));

        phrases.forEach(phrase => {

            // 1) COMMENTAIRE
            if (phrase.commentaire) {
                // si c'est le premier boc du code, il s'agit du titre
                if (phrase.ordre === 0) {
                    jeu.titre = phrase.phrase;
                    // sinon, le commentaire se rapporte au dernier sujet
                } else {
                    // récupérer le dernier élément
                    let e = elementsGeneriques.pop();
                    // mettre le commentaire de l'élément précédent
                    e.description = phrase.phrase;
                    // remettre l'élément à jour
                    elementsGeneriques.push(e);
                }
                phrase.traitee = true;

                // 2) CODE DESCRIPTIF
            } else {

                if (Compilateur.verbeux) {
                    console.log("Analyse: ", phrase);
                }

                // 1 - TESTER POSITION
                let found = Compilateur.testerPosition(elementsGeneriques, phrase);
                if (!found) {
                    // 2 - TESTER ELEMENT SIMPLE (NON positionné)
                    found = Compilateur.testerElementSimple(typesUtilisateur, elementsGeneriques, phrase);
                    if (!found) {
                        // 3 - LE RESTE
                        // pronom démonstratif
                        result = Compilateur.xPronomDemonstratif.exec(phrase.phrase);
                        if (result !== null) {
                            // récupérer le dernier élément
                            let e = elementsGeneriques.pop();
                            // type de l'élément précédent
                            if (result[2] && result[2].trim() !== '') {
                                e.type = Compilateur.getTypeElement(result[2]);
                            }
                            // attributs de l'élément précédent
                            if (result[3] && result[3].trim() !== '') {
                                e.attributs.push(result[3]);
                            }
                            // remettre l'élément à jour
                            elementsGeneriques.push(e);
                            if (Compilateur.verbeux) {
                                console.log("Réslultat: test 3:", e);
                            }
                        } else {
                            // pronom personnel position
                            result = Compilateur.xPronomPersonnelPosition.exec(phrase.phrase);
                            if (result !== null) {
                                if (Compilateur.verbeux) {
                                    console.log("resultat test 4: ", result);
                                }
                                // récupérer le dernier élément
                                let e = elementsGeneriques.pop();
                                // genre de l'élément
                                e.genre = Compilateur.getGenre(phrase.phrase.split(" ")[0], null);
                                // attributs de l'élément précédent
                                e.positionString = new PositionSujetString(e.nom, result[2], result[1]),
                                    // remettre l'élément à jour
                                    elementsGeneriques.push(e);
                                if (Compilateur.verbeux) {
                                    console.log("Réslultat: test 4:", e);
                                }
                            } else {
                                // pronom personnel attributs
                                result = Compilateur.xPronomPersonnelAttribut.exec(phrase.phrase);
                                if (result !== null) {
                                    if (Compilateur.verbeux) {
                                        console.log("resultat test 5: ", result);
                                    }
                                    // récupérer le dernier élément
                                    let e = elementsGeneriques.pop();
                                    // attributs de l'élément précédent
                                    if (result[1] && result[1].trim() !== '') {
                                        // découper les attributs
                                        const attributs = Compilateur.getAttributs(result[1]);
                                        e.attributs = e.attributs.concat(attributs);
                                    }
                                    // genre de l'élément
                                    e.genre = Compilateur.getGenre(phrase.phrase.split(" ")[0], null);


                                    // remettre l'élément à jour
                                    elementsGeneriques.push(e);
                                    if (Compilateur.verbeux) {
                                        console.log("Réslultat: test 5:", e);
                                    }
                                } else {
                                    if (Compilateur.verbeux) {
                                        console.log("Pas de résultat test 5.");
                                    }
                                }
                            }

                        }








                    }

                }
            }
        });

        if (Compilateur.verbeux) {
            console.log("definitions: ", typesUtilisateur);
        }
        elementsGeneriques.forEach(el => {

            switch (el.type) {
                case TypeElement.salle:
                    monde.salles.push(el);
                    break;

                case TypeElement.decor:
                    monde.decors.push(el);
                    break;

                case TypeElement.contenant:
                    monde.contenants.push(el);
                    break;

                case TypeElement.animal:
                    monde.animaux.push(el);
                    break;

                case TypeElement.porte:
                    monde.portes.push(el);
                    break;

                case TypeElement.cle:
                    monde.cles.push(el);
                    break;

                case TypeElement.joueur:
                    monde.joueurs.push(el);
                    break;

                case TypeElement.objet:
                case TypeElement.inconnu:
                case TypeElement.aucun:
                    monde.objets.push(el);
                    break;

                case TypeElement.aucun:
                case TypeElement.inconnu:
                    monde.aucuns.push(el);
                    break;

                default:
                    break;
            }

        });

        if (Compilateur.verbeux) {
            console.info("==================\n");
            console.info("jeu:", jeu);
            console.info("typesUtilisateur:", typesUtilisateur);
            console.info("==================\n");
        }

        return jeu;
    }

    // Élement simple non positionné
    private static testerElementSimple(dictionnaire: Map<string, Definition>, elementsGeneriques: ElementGenerique[], phrase: Phrase): boolean {
        let e: ElementGenerique = null;

        let determinant: string;
        let nom: string;
        let intituleType: string;
        let type: TypeElement;
        let genre: Genre;
        let attributsString: string;
        let attributs: string[];
        let nombre: Nombre;
        let quantite: number;
        let position: PositionSujetString;

        // élément générique simple avec type d'élément (ex: le champignon est un décor)
        let result = Compilateur.xDefinitionTypeElement.exec(phrase.phrase);
        if (result !== null) {

            determinant = result[1] ? result[1].toLowerCase() : null;
            nom = result[2];
            intituleType = result[4];
            type = Compilateur.getTypeElement(result[4]);
            genre = Compilateur.getGenre(result[1], result[3]);
            nombre = Compilateur.getNombre(result[1]);
            quantite = Compilateur.getQuantite(result[1]);
            attributsString = result[5];
            attributs = Compilateur.getAttributs(attributsString);
            position = null;

            Compilateur.addOrUpdDefinition(dictionnaire, nom, nombre, intituleType, attributs);

            e = new ElementGenerique(
                determinant,
                nom,
                intituleType,
                type,
                position,
                genre,
                nombre,
                quantite,
                attributs,
            );

        } else {
            // élément simple avec attributs (ex: le champignon est brun et on peut le cueillir)
            result = Compilateur.xElementSimpleAttribut.exec(phrase.phrase);
            if (result != null) {
                // attributs ?
                let attributs = null;
                if (result[4] && result[4].trim() !== '') {
                    // découper les attributs qui sont séparés par des ', ' ou ' et '
                    attributs = Compilateur.getAttributs(result[4]);
                }
                e = new ElementGenerique(
                    result[1] ? result[1].toLowerCase() : null,
                    result[2],
                    "",
                    TypeElement.aucun,
                    null,
                    Compilateur.getGenre(result[1], result[3]),
                    Compilateur.getNombre(result[1]),
                    Compilateur.getQuantite(result[1]),
                    (attributs ? attributs : new Array<string>()),
                );
            }
        }

        // s'il y a un résultat, l'ajouter
        if (e) {
            // avant d'ajouter l'élément vérifier s'il existe déjà
            let filtered = elementsGeneriques.filter(x => x.nom === e.nom);
            if (filtered.length > 0) {
                // mettre à jour l'élément existant le plus récent.
                let found = filtered[filtered.length - 1];
                // - type d'élément
                if (e.type !== TypeElement.aucun) {
                    // s'il y avait déjà un type défini, c'est un autre élément
                    if (found.type !== TypeElement.aucun) {
                        elementsGeneriques.push(e);
                    } else {
                        // sinon, définir le type
                        found.type = e.type;
                    }
                }
                // - attributs

                if (this.verbeux) {
                    console.log("e:", e);
                    console.log("found.attributs:", found.attributs);
                }

                if (e.attributs.length > 0) {
                    found.attributs = found.attributs.concat(e.attributs);
                }
            } else {
                // ajouter le nouvel élément
                elementsGeneriques.push(e);
            }

            return true; // trouvé un résultat
        } else {
            return false; // rien trouvé
        }

    }

    private static addOrUpdDefinition(dictionnaire: Map<string, Definition>, intitule: string, nombre: Nombre, typeParent: string, attributs: string[]) {
        // mise à jour
        if (dictionnaire.has(intitule)) {
            let found = dictionnaire.get(intitule);
            found.typeParent = typeParent;
            found.attributs.concat(attributs);
            // ajout
        } else {
            const definition = new Definition(intitule, typeParent, nombre, attributs);
            dictionnaire.set(intitule, definition)
        }
    }



    // Élement positionné
    private static testerPosition(elementsGeneriques: ElementGenerique[], phrase: Phrase): boolean {

        let e: ElementGenerique = null;

        let determinant: string;
        let nom: string;
        let intituleType: string;
        let type: TypeElement;
        let genre: Genre;
        let attributsString: string;
        let attributs: string[];
        let nombre: Nombre;
        let position: PositionSujetString;

        // élément positionné défini (la, le, les)
        let result = Compilateur.xPositionElementGeneriqueDefini.exec(phrase.phrase);
        if (result !== null) {
            e = new ElementGenerique(
                result[1] ? result[1].toLowerCase() : null,
                result[2],
                result[4],
                Compilateur.getTypeElement(result[4]),
                new PositionSujetString(result[2], result[7], result[6]),
                Compilateur.getGenre(result[1], result[3]),
                Compilateur.getNombre(result[1]),
                Compilateur.getQuantite(result[1]),
                (result[8] ? new Array<string>(result[8]) : new Array<string>()),
            );
            // élément positionné avec "un/une xxxx est" soit "il y a un/une xxxx"
        } else {
            result = Compilateur.xPositionElementGeneriqueIndefini.exec(phrase.phrase);

            if (result != null) {
                // selon le type de résultat ("il y a un xxx" ou "un xxx est")
                let offset = result[1] ? 0 : 4;
                determinant = result[1 + offset] ? result[1 + offset].toLowerCase() : null;
                intituleType = result[2 + offset];
                type = Compilateur.getTypeElement(intituleType);
                attributsString = result[3 + offset];
                attributs = Compilateur.getAttributs(attributsString);
                // s'il y a des attributs, prendre uniquement le 1er pour le nom
                if (attributs.length > 0) {
                    nom = result[2 + offset] + " " + attributs[0];
                } else {
                    nom = result[2 + offset];
                }
                genre = Compilateur.getGenre(result[1 + offset], result[4 + offset]);
                nombre = Compilateur.getNombre(result[1 + offset]);
                position = new PositionSujetString(result[2], result[10], result[9]);

                e = new ElementGenerique(
                    determinant,
                    nom,
                    intituleType,
                    type,
                    position,
                    genre,
                    nombre,
                    Compilateur.getQuantite(determinant),
                    attributs,
                );
            }

        }
        // s'il y a un résultat, l'ajouter
        if (e) {
            // avant d'ajouter l'élément vérifier s'il existe déjà
            let filtered = elementsGeneriques.filter(x => x.nom === e.nom);
            if (filtered.length > 0) {
                // mettre à jour l'élément existant le plus récent.
                let found = filtered[filtered.length - 1];
                // - position
                if (e.positionString) {
                    // s'il y avait déjà une position définie, c'est un autre élément !
                    if (found.positionString) {
                        elementsGeneriques.push(e);
                    } else {
                        // sinon, ajouter la position
                        found.positionString = e.positionString;
                    }
                }

                // - attributs
                if (e.attributs.length > 0) {
                    found.attributs = found.attributs.concat(e.attributs);
                }
                // - type élément
                if (e.type !== TypeElement.inconnu && e.type !== TypeElement.aucun) {
                    found.type = e.type;
                }
            } else {
                // ajouter le nouvel élément
                elementsGeneriques.push(e);
            }
            return true; // trouvé un résultat
        } else {
            return false; // rien trouvé
        }
    }



    private static getTypeElement(typeElement: string): TypeElement {
        let retVal = TypeElement.aucun;

        if (typeElement) {
            switch (typeElement.trim().toLocaleLowerCase()) {
                case "animal":
                case "animaux":
                    retVal = TypeElement.animal;
                    break;
                case "clé":
                case "cle":
                case "clef":
                case "clefs":
                case "clés":
                case "cles":
                    retVal = TypeElement.cle;
                    break;
                case "contenant":
                case "contenants":
                    retVal = TypeElement.contenant;
                    break;
                case "décors":
                case "décor":
                case "decor":
                case "decors":
                    retVal = TypeElement.decor;
                    break;
                case "humain":
                case "humains":
                    retVal = TypeElement.humain;
                    break;
                case "objet":
                case "objets":
                    retVal = TypeElement.objet;
                    break;
                case "porte":
                case "portes":
                    retVal = TypeElement.porte;
                    break;
                case "salle":
                    retVal = TypeElement.salle;
                    break;

                case "joueur":
                    retVal = TypeElement.joueur;
                    break;

                default:
                    retVal = TypeElement.inconnu;
                    break;
            }
        }
        return retVal;
    }

    private static getNombre(determinant: string) {
        let retVal = Nombre.s;
        if (determinant) {
            switch (determinant.trim().toLocaleLowerCase()) {
                case "le":
                case "la":
                case "l'":
                case "1":
                case "un":
                case "une":
                    retVal = Nombre.s;
                    break;
                case "les":
                case "des":
                case "deux":
                case "trois":
                    retVal = Nombre.p;
                    break;
                case "du":
                case "de la":
                case "de l'":
                    retVal = Nombre.i;
                    break;

                default:
                    if (this.xNombrePluriel.exec(determinant.trim()) !== null) {
                        retVal = Nombre.p;
                    } else {
                        retVal = Nombre.s;
                    }
                    break;
            }
        }
        return retVal;
    }

    private static getQuantite(determinant: string): number {
        let retVal = 0;
        if (determinant) {
            switch (determinant.trim().toLocaleLowerCase()) {
                case "le":
                case "la":
                case "l'":
                case "1":
                case "un":
                case "une":
                    retVal = 1;
                    break;
                case "deux":
                    retVal = 2;
                    break;
                case "trois":
                    retVal = 3;
                    break;
                case "les":
                case "des":
                    retVal = -1;
                    break;
                case "du":
                case "de la":
                case "de l'":
                    retVal = -1;
                    break;

                default:
                    if (this.xNombrePluriel.exec(determinant.trim()) !== null) {
                        retVal = +(determinant.trim());
                    } else {
                        retVal = 0;
                    }
                    break;
            }
        }
        return retVal;
    }

    /** Obtenir une liste d'attributs sur base d'une châine d'attributs séparés par des "," et un "et" */
    private static getAttributs(attributsString: string): string[] {
        if (attributsString && attributsString.trim() !== '') {
            // découper les attributs qui sont séparés par des ', ' ou ' et '
            return attributsString.split(/(?:, | et )+/);
        } else {
            return new Array<string>();
        }
    }

    /** Obtenir le genre d'un élément du donjon. */
    private static getGenre(determinant: string, feminin: string): Genre {
        let retVal = Genre.n;

        if (determinant) {
            switch (determinant.trim().toLocaleLowerCase()) {
                case "le":
                case "il":
                case "ils":
                    retVal = Genre.m;
                    break;
                case "la":
                case "elle":
                case "elles":
                    retVal = Genre.f;
                    break;

                default:
                    if (feminin && feminin.trim() === "(f)") {
                        retVal = Genre.f;
                    } else {
                        retVal = Genre.m;
                    }
                    break;
            }
        }
        return retVal;
    }

}
