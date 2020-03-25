import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Monde } from '../models/compilateur/monde';
import { PositionRelative } from '../models/compilateur/position-sujet';
import { Salle } from '../models/jeu/salle';
import { Voisin } from '../models/jeu/voisin';

export class Generateur {

    public static genererJeu(monde: Monde): Jeu {

        let jeu = new Jeu();

        jeu.titre = monde.titre;

        // ajouter toutes les salles
        for (let index = 0; index < monde.salles.length; index++) {
            const curEle = monde.salles[index];

            let newSalle = new Salle();
            newSalle.id = (index);
            newSalle.intitulé = curEle.nom;
            newSalle.déterminant = curEle.determinant;
            newSalle.genre = curEle.genre;
            newSalle.nombre = curEle.nombre;
            jeu.salles.push(newSalle);
        }

        // ajouter toutes les voisins
        for (let index = 0; index < monde.salles.length; index++) {
            const curEle = monde.salles[index];

            if (curEle.positionString) {
                const localisation = Generateur.getPosition(curEle.positionString.position);
                const complement = Generateur.getComplement(jeu.salles, curEle.positionString.complement);

                if (localisation === Localisation.inconnu || complement === -1) {
                    console.log("positionString pas trouvé: ", curEle.positionString);
                } else {
                    let newVoisin = new Voisin();
                    newVoisin.localisation = this.getOpposePosition(localisation);
                    newVoisin.salleIndex = complement;
                    // newVoisin.salle = jeu.salles[complement];
                    jeu.salles[index].voisins.push(newVoisin);

                    let opposeVoisin = new Voisin();
                    opposeVoisin.localisation = localisation;
                    // opposeVoisin.salle = jeu.salles[index];
                    opposeVoisin.salleIndex = index;
                    jeu.salles[complement].voisins.push(opposeVoisin);
                }
            }
        }

        return jeu;

    }

    static getComplement(salles: Salle[], strCompl: string) {

        let candidats: Salle[] = [];
        let retVal = -1;
        // trouver le sujet complet
        salles.forEach(salle => {
            if (salle.intitulé == strCompl) {
                candidats.push(salle);
            }
        });
        // sujet trouvé
        if (candidats.length === 1) {
            retVal = candidats[0].id;
            // pas trouvé => on va chercher le début d'un sujet
        } else if (candidats.length === 0) {
            // trouver un début de sujet
            salles.forEach(salle => {
                if (salle.intitulé.startsWith(strCompl)) {
                    candidats.push(salle);
                }
            });
            if (candidats.length === 1) {
                retVal = candidats[0].id;
            } else {
                console.log("complément position pas trouvé : ", strCompl);
            }
        } else {
            console.log("complément position pas trouvé (plusieurs candidats) : ", strCompl);

        }

        return retVal;
    }

    static getPosition(strPosition: string) {

        strPosition = strPosition.replace(/(du|de la|de l'|des)/g, "").trim();

        let retVal = Localisation.inconnu;
        switch (strPosition) {
            case "en bas":
                retVal = Localisation.bas;
                break;
            case "en haut":
                retVal = Localisation.haut;
                break;
            case "à l'extérieur":
                retVal = Localisation.exterieur;
                break;
            case "à l'intérieur":
                retVal = Localisation.interieur;
                break;
            case "à l'est":
                retVal = Localisation.est;
                break;
            case "à l'ouest":
                retVal = Localisation.ouest;
                break;
            case "au nord":
                retVal = Localisation.nord;
                break;
            case "au sud":
                retVal = Localisation.sud;
                break;

            default:
                console.log("Localisation pas connue: ", strPosition);
                break;
        }

        return retVal;
    }

    static getOpposePosition(localisation: Localisation) {
        switch (localisation) {
            case Localisation.bas:
                return Localisation.haut;
                break;
            case Localisation.haut:
                return Localisation.bas;
                break;
            case Localisation.est:
                return Localisation.ouest;
                break;
            case Localisation.ouest:
                return Localisation.est;
                break;
            case Localisation.nord:
                return Localisation.sud;
                break;
            case Localisation.sud:
                return Localisation.nord;
                break;
            case Localisation.interieur:
                return Localisation.exterieur;
                break;
            case Localisation.exterieur:
                return Localisation.interieur;
                break;
            default:
                return Localisation.inconnu;
                break;
        }
    }

}
