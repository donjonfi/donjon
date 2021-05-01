import { EClasseRacine } from "../../models/commun/constantes";
import { Objet } from "../../models/jeu/objet";
import { PositionObjet } from "../../models/jeu/position-objet";

export class PositionsUtils {

    /** Vérifier si les 2 positions spécifiées sont identiques.  */
    static positionsIdentiques(positionA: PositionObjet, positionB: PositionObjet): boolean {
        const retVal = (positionA.cibleType === positionB.cibleType
            && positionA.cibleId === positionB.cibleId
            && positionA.pre === positionB.pre);

        return retVal;
    }

    /** 
     * Récupérer les objets qui se trouvent à la position spécifiée.
     * Remarque: Seul « ici » est actuellement supporté.
     */
    static getObjetsQuiSeTrouventLa(position: string, objets: Objet[], curLieuID: number): Objet[] {
        let retVal: Objet[] = [];

        if (position === 'ici') {
            objets.forEach(obj => {
                if (obj.position && obj.position.cibleType === EClasseRacine.lieu && obj.position.cibleId === curLieuID) {
                    retVal.push(obj);
                }
            });
        } else {
            console.warn("getObjetsQuiSeTrouventLa >>> position pas encore gérée:", position);
        }
        return retVal;
    }

    
}
