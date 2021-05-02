import { Compteur } from "../../models/compilateur/compteur";
import { ExprReg } from "../compilation/expr-reg";

export class CompteursUtils {

    /** Changer la valeur d’un compteur */
    public static changerValeurCompteur(compteur: Compteur, verbe: 'vaut' | 'augmente' | 'diminue', opperationStr: string) {

        // enlever le de qui débute la nouvelle valeur
        opperationStr = opperationStr.replace(/^(de |d’|d')/i, "");

        let opperationNum: number = null;

        // calculer la nouvelle valeur
        // A) nombre entier
        if (opperationStr.match(ExprReg.xNombreEntier)) {
            opperationNum = Number.parseInt(opperationStr);
            // B) nombre décimal
        } else if (opperationStr.match(ExprReg.xNombreDecimal)) {
            opperationStr = opperationStr.replace(',', '.');
            opperationNum = Number.parseFloat(opperationStr);
            // C) compteur ou propriété
        } else {
            console.warn("changerValeurCompteur: TODO: valeur de type compteur ou propriété :", opperationStr);
        }

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


    
}