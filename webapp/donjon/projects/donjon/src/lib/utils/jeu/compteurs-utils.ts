import { Compteur } from "../../models/compilateur/compteur";
import { ExprReg } from "../compilation/expr-reg";

export class CompteursUtils {

    /** Changer la valeur d’un compteur */
    public static changerValeurCompteur(compteur: Compteur, verbe: 'vaut' | 'augmente' | 'diminue', opperationStr: string) {

        // enlever le de qui débute la nouvelle valeur
        const valeurStr = opperationStr.replace(/^(de |d’|d')/i, "");

        let opperationNum: number = this.intituleValeurVersNombre(valeurStr);

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

    public static intituleValeurVersNombre(valeurString: string): number {
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
        } else {
            console.warn("CompteursUtils: intituleValeurVersNombre: TODO: valeur de type compteur ou propriété :", valeurString);
        }
        return valeurNum;
    }

}