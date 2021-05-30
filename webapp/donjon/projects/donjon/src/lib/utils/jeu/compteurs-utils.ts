import { Compteur } from "../../models/compilateur/compteur";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { Intitule } from "../../models/jeu/intitule";
import { Objet } from "../../models/jeu/objet";

export class CompteursUtils {

    /** Changer la valeur d’un compteur */
    public static changerValeurCompteur(compteur: Compteur, verbe: 'vaut' | 'augmente' | 'diminue', opperationStr: string) {

        // enlever le de qui débute la nouvelle valeur
        const valeurStr = opperationStr.replace(/^(de |d’|d')/i, "");

        let opperationNum: number = this.intituleValeurVersNombre(valeurStr, null, null, null);

        if (opperationNum !== null) {
            switch (verbe) {
                case 'vaut':
                    compteur.valeur = opperationNum;
                    break;

                case 'diminue':
                    compteur.valeur -= opperationNum;
                    break;

                case 'augmente':
                    compteur.valeur += opperationNum;
                    break;

                default:
                    console.error("changerValeurCompteur: verbe inconnu:", verbe);
                    break;
            }
        }
    }

    public static intituleValeurVersNombre(valeurString: string, ceci: ElementJeu | Compteur | Intitule, cela: ElementJeu | Compteur | Intitule, evenement: Evenement): number {
        let valeurNum: number = null;

        // calculer la nouvelle valeur
        // A) nombre entier
        if (valeurString.match(ExprReg.xNombreEntier)) {
            valeurNum = Number.parseInt(valeurString);
            // B) nombre décimal
        } else if (valeurString.match(ExprReg.xNombreDecimal)) {
            valeurString = valeurString.replace(',', '.');
            valeurNum = Number.parseFloat(valeurString);
            // C) compteur ou propriété
        } else if (valeurString == 'quantitéCeci') {
            valeurNum = evenement.quantiteCeci;
        } else if (valeurString == 'quantitéCela') {
            valeurNum = evenement.quantiteCela;
        } else if (valeurString == 'quantité ceci') {
            valeurNum = (ceci as Objet).quantite;
        } else if (valeurString == 'quantité cela') {
            valeurNum = (cela as Objet).quantite;
        } else if (valeurString == 'valeur ceci') {
            valeurNum = (ceci as Compteur).valeur;
        } else if (valeurString == 'valeur cela') {
            valeurNum = (cela as Compteur).valeur;
        } else {
            console.warn("CompteursUtils: intituleValeurVersNombre: TODO: valeur de type compteur ou propriété :", valeurString);
        }
        return valeurNum;
    }

}