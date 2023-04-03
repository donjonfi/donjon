import { Action } from "../../models/compilateur/action";
import { StringUtils } from "../commun/string.utils";

export class TrouverAction {

  /**
   * Chercher les actions correspondantes à l’infinitif spécifié.
   * 1ère passe: on tient compte des accents.
   * 2e passe (si pas trouvé d’action): on ne tient plus compte des accents
   * @param infinitif verbe à l’infinitif (non normalisé)
   * @param actions catalogue des actions
   * @returns les actions correspondantes à l’infinitif spécifié.
   * 
   * Tests unitaires (todo):
   * - roder, rôder
   * - mater, mâter
   * - regarder
   * - aller au nord
   * - prendre la pièce
   * - …
   */
  public static trouverActionsPourInfinitif(infinitif: string, actions: Action[]): Action[] {
    let candidats = this._trouverActionsPourInfinitif(infinitif, actions, false);
    if(!candidats.length){
      candidats = this._trouverActionsPourInfinitif(infinitif, actions, true);
    }
    return candidats;
  }
  
  /**
   * Chercher les actions correspondantes à l’infinitif spécifié.
   * @param infinitifNormalise verbe à l’infinitif (non normalisé)
   * @param actions catalogue des actions
   * @param tenirCompteDesAccents  vérifier les accents ? (conseillé pour la 1ère passe)
   * @returns les actions correspondantes à l’infinitif spécifié.
   */
  private static _trouverActionsPourInfinitif(infinitif: string, actions: Action[], tenirCompteDesAccents: boolean): Action[] {
    let candidats: Action[] = [];

    actions.forEach(action => {
      let infinitifOk = false;
      // vérifier infinitif => avec accents (1ère passe)
      infinitifOk = (infinitif === action.infinitif);
      // vérifier également les synonymes
      if (tenirCompteDesAccents) {
        if (!infinitifOk && action.synonymes) {
          action.synonymes.forEach(synonyme => {
            if (!infinitifOk && infinitif === synonyme) {
              infinitifOk = true;
            }
          });
        }
      } else {
        // vérifier infinitif => sans accents (2e passe)
        const infinitifNormalise = StringUtils.normaliserMot(infinitif);
        infinitifOk = (infinitifNormalise === action.infinitifSansAccent);
        // vérifier également les synonymes
        if (!infinitifOk && action.synonymesSansAccent) {
          action.synonymesSansAccent.forEach(synonymeSansAccent => {
            if (!infinitifOk && infinitifNormalise === synonymeSansAccent) {
              infinitifOk = true;
            }
          });
        }
      }
      if (infinitifOk) {
        candidats.push(action);
      }
    });
    return candidats;
  }

}