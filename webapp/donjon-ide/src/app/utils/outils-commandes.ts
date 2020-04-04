import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';

export class OutilsCommandes {

    constructor(
        private jeu: Jeu
    ) { }


    static copierObjet(original: Objet) {
        let retVal = new Objet();
        retVal.quantité = 1;
        retVal.nombre = Nombre.s;
        retVal.genre = original.genre;
        retVal.determinant = original.determinant;
        retVal.intitulé = original.intitulé;
        retVal.id = original.id; // TODO: quid des ID pour les clones ?
        return retVal;
    }

    static afficherAccordSimple(o: Objet) {
        let retVal: string;
        if (o.nombre == Nombre.s) {
            if (o.genre == Genre.f) {
                retVal = "e";
            } else {
                retVal = "";
            }
        } else {
            if (o.genre == Genre.f) {
                retVal = "es";
            } else {
                retVal = "s";
            }
        }
        return retVal;
    }

    static afficherUnUneDes(o: Objet, majuscule: boolean) {
        let retVal: string;
        if (o.nombre == Nombre.s) {
            if (o.genre == Genre.f) {
                retVal = majuscule ? "Une " : "une ";
            } else {
                retVal = majuscule ? "Un " : "un ";
            }
        } else {
            retVal = majuscule ? "Des " : "des ";
        }
        return retVal;
    }

    trouverObjet(mots: string[]) {

        let retVal: Objet = null;

        // commencer par chercher avec le 2e mot
        let premierMot: string;

        if (mots[1] == 'la' || mots[1] == 'le' || mots[2] == 'du' || mots[2] == 'un' || mots[2] == 'une') {
            premierMot = mots[2];
        } else {
            premierMot = mots[1];
        }

        let objetsTrouves = this.curSalle.inventaire.objets.filter(x => x.intitulé.startsWith(premierMot) && x.quantité !== 0);
        if (objetsTrouves.length == 1) {
            retVal = objetsTrouves[0];
        } else if (objetsTrouves.length > 1) {
            // TODO: ajouter des mots en plus
        }
        return retVal;
    }

    prendreObjet(objetID) {
        let retVal: Objet = null;
        // un seul exemplaire : on le retire de l'inventaire et on le retourne.
        let objetIndex = this.curSalle.inventaire.objets.findIndex(x => x.id === objetID);
        let objet = this.curSalle.inventaire.objets[objetIndex];
        if (objet.quantité == 1) {
            retVal = this.curSalle.inventaire.objets.splice(objetIndex, 1)[0];

            // plusieurs exemplaires : on le clone
        } else {
            // décrémenter quantité si pas infini
            if (objet.quantité != -1) {
                objet.quantité -= 1;
            }
            // faire une copie
            retVal = OutilsCommandes.copierObjet(objet);
        }
        return retVal;
    }



    getSalle(index: number) {
        return this.jeu.salles.find(x => x.id === index);
    }

    getVoisin(loc: Localisation) {
        console.log("getVoisin:", loc);

        let found = this.curSalle.voisins.find(x => x.localisation == loc);

        console.log("  >> found:", found);

        return found ? found.salleIndex : -1;
    }

    get curSalle() {
        // TODO: retenir la salle
        const retVal = this.jeu.salles.find(x => x.id === this.jeu.position);
        if (!retVal) {
            console.warn("Pas trouvé la curSalle:", this.jeu.position);
        }
        return retVal;
    }

    afficherCurSalle() {
        if (this.curSalle) {
            return "—————————————————\n" + this.curSalle.déterminant + this.curSalle.intitulé + "\n—————————————————\n"
                + (this.curSalle.description ? (this.curSalle.description + "\n") : "")
                + this.afficherSorties()
        } else {
            console.warn("Pas trouvé de curSalle :(");
            return "Je suis où moi ? :(";
        }

    }

    afficherSorties() {
        let retVal: string;

        if (this.curSalle.voisins.length > 0) {
            retVal = "Sorties :";
            this.curSalle.voisins.forEach(voisin => {
                retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, this.curSalle.id, voisin.salleIndex));
            });
        } else {
            retVal = "Il n’y a pas de sortie.";
        }
        return retVal;
    }

    afficherInventaire() {
        let retVal: string;
        let objets = this.jeu.inventaire.objets.filter(x => x.quantité !== 0);
        if (objets.length == 0) {
            retVal = "\nVotre inventaire est vide.";
        } else {
            retVal = "\nContenu de l'inventaire :";
            objets.forEach(o => {
                retVal += "\n - " + (OutilsCommandes.afficherUnUneDes(o, false) + o.intitulé);
            });
        }
        return retVal;
    }

    afficherObjetsCurSalle() {
        let retVal: string;

        let objets = this.curSalle.inventaire.objets.filter(x => x.quantité !== 0);

        if (objets.length == 0) {
            retVal = "\nJe ne vois rien ici.";
        } else {
            retVal = "\nContenu de la pièce :";
            objets.forEach(o => {
                retVal += "\n - Il y a " + (OutilsCommandes.afficherUnUneDes(o, false) + o.intitulé);
            });
        }
        return retVal;
    }

    afficherLocalisation(localisation: Localisation, curSalleIndex: number, voisinIndex: number) {
        switch (localisation) {
            case Localisation.nord:
                return "nord (n)";
            case Localisation.sud:
                return "sud (s)";
            case Localisation.est:
                return "est (e)";
            case Localisation.ouest:
                return "ouest (o)";

            case Localisation.bas:
                return "descendre " + this.getSalle(voisinIndex)?.intitulé + " (de)";
            case Localisation.haut:
                return "monter " + this.getSalle(voisinIndex)?.intitulé + " (mo)";
            case Localisation.exterieur:
                return "sortir " + this.getSalle(curSalleIndex)?.intitulé + " (so)";
            case Localisation.interieur:
                return "entrer " + this.getSalle(voisinIndex)?.intitulé + " (en)";

            default:
                return localisation.toString();
        }
    }

}