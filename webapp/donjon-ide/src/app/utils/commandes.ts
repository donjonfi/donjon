import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Objet } from '../models/jeu/objet';
import { OutilsCommandes } from './outils-commandes';
import { Salle } from '../models/jeu/salle';

export class Commandes {

    constructor(public jeu: Jeu) {
        this.outils = new OutilsCommandes(this.jeu);
    }


    outils: OutilsCommandes;


    // =========================================
    // COMMANDES QUI MODIFIENT LE JEU
    // =========================================

    prendre(mots: string[]) {

        // TODO: vérifier si on peut prendre l'objet...

        if (mots[1]) {
            // TODO: objets dont l'intitulé comprend plusieurs mots !
            const objetTrouve = this.outils.trouverObjet(mots);
            if (objetTrouve) {
                const nouvelObjet = this.outils.prendreObjet(objetTrouve.id);
                this.jeu.inventaire.objets.push(nouvelObjet);
                return OutilsCommandes.afficherUnUneDes(nouvelObjet, true) + nouvelObjet.intitulé + " a été ajouté" + OutilsCommandes.afficherAccordSimple(objetTrouve) + " à votre inventaire.";
            } else {
                return "Je ne trouve pas ça.";
            }
        } else {
            return "prendre quoi ?";
        }
    }

    aller(mots: string[]) {

        let voisin: Salle = null;

        let destination: string;

        if (mots[0] === 'aller' || mots[0] === 'a') {
            if (mots[1] == 'en' || mots[1] == 'à' || mots[1] == 'au') {
                destination = mots[2];
            } else {
                destination = mots[1];
            }
        } else {
            destination = mots[0];
        }

        switch (destination) {

            case "n":
            case "no":
            case "nord":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.nord));
                break;

            case "s":
            case "su":
            case "sud":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.sud));
                break;

            case "o":
            case "ou":
            case "ouest":
            case "l'ouest":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.ouest));
                break;

            case "e":
            case "es":
            case "est":
            case "l'est":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.est));
                break;

            case "so":
            case "sortir":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.exterieur));
                break;
            case "en":
            case "entrer":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.interieur));
                break;
            case "mo":
            case "monter":
            case "haut":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.haut));
                break;
            case "de":
            case "descendre":
            case "bas":
                voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.bas));
                break;

            default:
                break;
        }

        // TODO: vérifier accès…

        if (voisin) {
            this.jeu.position = voisin.id;
            return this.outils.afficherCurSalle();
        } else {
            return "Pas pu aller par là.";
        }
    }



    // =========================================
    // COMMANDES QUI NE MODIFIENT PAS LE JEU
    // =========================================

    ou(mots: string[]) {
        let retVal = "où… quoi ?";

        if (mots[1]) {
            // suis-je
            switch (mots[1]) {
                case "suis-je":
                case "suis je":
                case "es-tu":
                case "es tu":
                case "sommes-nous":
                case "sommes nous":
                    retVal = this.ouSuisJe();
                    break;

                default:
                    retVal = "Je n’ai pas compris où…";
                    break;
            }
        }
        return retVal;
    }

    ouSuisJe() {
        if (this.jeu.position == -1) {
            return "Je ne sais pas où je suis";
        } else {
            return "Vous êtes dans " + this.outils.curSalle.déterminant + this.outils.curSalle.intitulé + ".\n"
                + this.outils.afficherCurSalle();

        }
    }

    regarder(mots: string[]) {
        if (this.outils.curSalle) {
            if (this.outils.curSalle.description) {
                return this.outils.curSalle.description
                    + this.outils.afficherObjetsCurSalle();
            } else {
                return "Vous êtes dans " + this.outils.curSalle.déterminant + this.outils.curSalle.intitulé + ".\n"
                    + this.outils.afficherObjetsCurSalle();
            }
        } else {
            return "Mais où suis-je ?";
        }
    }

    fouiller(mots: string[]) {
        return "Je n’ai pas le courage de fouiller ça.";
    }

    inventaire() {
        return this.outils.afficherInventaire();
    }

    /**
     * au préalable, il faut avoir vidé la console !
     */
    effacer() {
        return this.outils.afficherCurSalle();
    }

}

